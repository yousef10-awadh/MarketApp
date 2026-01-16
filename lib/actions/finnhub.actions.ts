'use server';

import {
  getDateRange,
  validateArticle,
  formatArticle,
} from '@/lib/utils';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const NEXT_PUBLIC_FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;

async function fetchJSON(url: string, revalidateSeconds?: number): Promise<any> {
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
