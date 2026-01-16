'use server';

import {
  getDateRange,
  validateArticle,
  formatArticle,
} from '@/lib/utils';
import { cache } from 'react';
import { POPULAR_STOCK_SYMBOLS } from '../constants';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const NEXT_PUBLIC_FINNHUB_API_KEY: string | undefined = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;

async function fetchJSON<T>(url: string, revalidateSeconds?: number): Promise<T> {
  const cacheOptions: RequestInit = revalidateSeconds
    ? {
        cache: 'force-cache',
        next: { revalidate: revalidateSeconds },
      }
    : {
        cache: 'no-store',
      };

  const response = await fetch(url, cacheOptions);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export async function getNews(symbols?: string[]): Promise<MarketNewsArticle[]> {
  try {
    if (!NEXT_PUBLIC_FINNHUB_API_KEY) {
      throw new Error('FINNHUB_API_KEY is not configured');
    }

    const { from, to } = getDateRange(5); // Last 5 days

    if (symbols && symbols.length > 0) {
      // Clean and uppercase symbols
      const cleanSymbols = symbols
        .map((s) => s.trim().toUpperCase())
        .filter((s) => s.length > 0);

      if (cleanSymbols.length === 0) {
        // Fallback to general news if no valid symbols
        return getGeneralNews();
      }

      const articles: Array<{ article: RawNewsArticle; symbol: string }> = [];
      const maxRounds = 6;

      // Round-robin through symbols, max 6 times
      for (let round = 0; round < maxRounds; round++) {
        const symbolIndex = round % cleanSymbols.length;
        const symbol = cleanSymbols[symbolIndex];

        try {
          const url = `${FINNHUB_BASE_URL}/company-news?symbol=${encodeURIComponent(
            symbol
          )}&from=${from}&to=${to}&token=${NEXT_PUBLIC_FINNHUB_API_KEY}`;
          const data = await fetchJSON(url);

          if (Array.isArray(data)) {
            // Find first valid article for this round
            const validArticle = data.find((article: RawNewsArticle) =>
              validateArticle(article)
            );
            if (validArticle) {
              articles.push({ article: validArticle, symbol });
            }
          }
        } catch (error) {
          console.error(`Error fetching news for symbol ${symbol}:`, error);
          // Continue to next symbol
        }
      }

      // Format and sort articles
      const formattedArticles = articles
        .map(({ article, symbol }, index) =>
          formatArticle(article, true, symbol, index)
        )
        .sort((a, b) => (b.datetime || 0) - (a.datetime || 0));

      return formattedArticles.slice(0, 6); // Max 6 articles
    } else {
      // No symbols provided, fetch general market news
      return getGeneralNews();
    }
  } catch (error) {
    console.error('Failed to fetch news:', error);
    throw new Error('Failed to fetch news');
  }
}

async function getGeneralNews(): Promise<MarketNewsArticle[]> {
  try {
    const url = `${FINNHUB_BASE_URL}/news?category=general&token=${NEXT_PUBLIC_FINNHUB_API_KEY}`;
    const data = await fetchJSON(url);

    if (!Array.isArray(data)) {
      return [];
    }

    // Deduplicate by id, url, or headline
    const seen = new Set<string>();
    const uniqueArticles: RawNewsArticle[] = [];

    for (const article of data) {
      if (!validateArticle(article)) continue;

      const key =
        article.id?.toString() ||
        article.url ||
        article.headline?.toLowerCase().trim() ||
        '';
      if (key && !seen.has(key)) {
        seen.add(key);
        uniqueArticles.push(article);
      }
    }

    // Take top 6, format them
    const formattedArticles = uniqueArticles
      .slice(0, 6)
      .map((article, index) => formatArticle(article, false, undefined, index))
      .sort((a, b) => (b.datetime || 0) - (a.datetime || 0));

    return formattedArticles;
  } catch (error) {
    console.error('Failed to fetch general news:', error);
    return [];
  }
}

//! search for socks
export const getStockDetails = async (symbol: string): Promise<{
  company: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: number;
  peRatio: number | null;
} | null> => {
  try {
    const token = process.env.FINNHUB_API_KEY ?? NEXT_PUBLIC_FINNHUB_API_KEY;
    if (!token) {
      console.error('FINNHUB API key is not configured');
      return null;
    }

    const upperSymbol = symbol.toUpperCase();

    // Fetch quote, profile, and financials in parallel
    const [quoteData, profileData, financialsData] = await Promise.all([
      fetchJSON<any>(`${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(upperSymbol)}&token=${token}`, 60).catch(() => null),
      fetchJSON<any>(`${FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(upperSymbol)}&token=${token}`, 3600).catch(() => null),
      fetchJSON<any>(`${FINNHUB_BASE_URL}/stock/metric?symbol=${encodeURIComponent(upperSymbol)}&metric=all&token=${token}`, 3600).catch(() => null),
    ]);

    const company = profileData?.name || upperSymbol;
    const currentPrice = quoteData?.c || 0;
    const previousClose = quoteData?.pc || currentPrice;
    const change = currentPrice - previousClose;
    const changePercent = previousClose !== 0 ? ((change / previousClose) * 100) : 0;
    const marketCap = profileData?.marketCapitalization || 0;
    const peRatio = financialsData?.metric?.peNormalizedAnnual || financialsData?.metric?.peAnnual || null;

    return {
      company,
      price: currentPrice,
      change,
      changePercent,
      marketCap,
      peRatio: peRatio !== null && peRatio !== undefined ? peRatio : null,
    };
  } catch (error) {
    console.error('Error fetching stock details:', error);
    return null;
  }
};

export const searchStocks = cache(async (query?: string): Promise<StockWithWatchlistStatus[]> => {
  try {
    const token = process.env.FINNHUB_API_KEY ?? NEXT_PUBLIC_FINNHUB_API_KEY;
    if (!token) {
      // If no token, log and return empty to avoid throwing per requirements
      console.error('Error in stock search:', new Error('FINNHUB API key is not configured'));
      return [];
    }

    const trimmed = typeof query === 'string' ? query.trim() : '';

    let results: FinnhubSearchResult[] = [];

    if (!trimmed) {
      // Fetch top 10 popular symbols' profiles
      const top = POPULAR_STOCK_SYMBOLS.slice(0, 10);
      const profiles = await Promise.all(
        top.map(async (sym) => {
          try {
            const url = `${FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(sym)}&token=${token}`;
            // Revalidate every hour
            const profile = await fetchJSON<any>(url, 3600);
            return { sym, profile } as { sym: string; profile: any };
          } catch (e) {
            console.error('Error fetching profile2 for', sym, e);
            return { sym, profile: null } as { sym: string; profile: any };
          }
        })
      );

      results = profiles
        .map(({ sym, profile }) => {
          const symbol = sym.toUpperCase();
          const name: string | undefined = profile?.name || profile?.ticker || undefined;
          const exchange: string | undefined = profile?.exchange || undefined;
          if (!name) return undefined;
          const r: FinnhubSearchResult = {
            symbol,
            description: name,
            displaySymbol: symbol,
            type: 'Common Stock',
          };
          // We don't include exchange in FinnhubSearchResult type, so carry via mapping later using profile
          // To keep pipeline simple, attach exchange via closure map stage
          // We'll reconstruct exchange when mapping to final type
          (r as any).__exchange = exchange; // internal only
          return r;
        })
        .filter((x): x is FinnhubSearchResult => Boolean(x));
    } else {
      const url = `${FINNHUB_BASE_URL}/search?q=${encodeURIComponent(trimmed)}&token=${token}`;
      const data = await fetchJSON<FinnhubSearchResponse>(url, 1800);
      results = Array.isArray(data?.result) ? data.result : [];
    }

    // Get watchlist symbols for the current user
    const { getWatchlistSymbolsByEmail } = await import('@/lib/actions/watchlist.actions');
    const { auth } = await import('@/lib/better-auth/auth');
    const { headers } = await import('next/headers');
    const session = await auth.api.getSession({ headers: await headers() });
    const watchlistSymbols = session?.user?.email 
      ? await getWatchlistSymbolsByEmail(session.user.email)
      : [];
    const watchlistSet = new Set(watchlistSymbols.map(s => s.toUpperCase()));

    const mapped: StockWithWatchlistStatus[] = results
      .map((r) => {
        const upper = (r.symbol || '').toUpperCase();
        const name = r.description || upper;
        const exchangeFromDisplay = (r.displaySymbol as string | undefined) || undefined;
        const exchangeFromProfile = (r as any).__exchange as string | undefined;
        const exchange = exchangeFromDisplay || exchangeFromProfile || 'US';
        const type = r.type || 'Stock';
        const item: StockWithWatchlistStatus = {
          symbol: upper,
          name,
          exchange,
          type,
          isInWatchlist: watchlistSet.has(upper),
        };
        return item;
      })
      .slice(0, 15);

    return mapped;
  } catch (err) {
    console.error('Error in stock search:', err);
    return [];
  }
});







