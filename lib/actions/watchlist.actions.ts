'use server';

import { connectToDatabase } from '@/database/mongoose';
import Watchlist from '@/database/models/watchlist.model';
import { auth } from '@/lib/better-auth/auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

export const getWatchlistSymbolsByEmail = async (email: string): Promise<string[]> => {
  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error('MongoDB connection not found');

    // Find user by email in the user collection (Better Auth)
    const user = await db.collection('user').findOne({ email });
    if (!user) {
      return [];
    }

    // Get userId (Better Auth uses 'id' field)
    const userId = user.id || user._id?.toString();
    if (!userId) {
      return [];
    }

    // Query Watchlist by userId and return just the symbols
    const watchlistItems = await Watchlist.find({ userId }).select('symbol').lean();
    return watchlistItems.map((item) => item.symbol);
  } catch (error) {
    console.error('Error getting watchlist symbols by email:', error);
    return [];
  }
};

export const addToWatchlist = async (symbol: string, company: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' };
    }

    const mongoose = await connectToDatabase();
    const userId = session.user.id;
    const upperSymbol = symbol.toUpperCase().trim();
    const trimmedCompany = company.trim();

    // Check if stock already exists in user's watchlist
    const existing = await Watchlist.findOne({
      userId,
      symbol: upperSymbol,
    });

    if (existing) {
      return { success: false, error: 'Stock already in watchlist' };
    }

    await Watchlist.create({
      userId,
      symbol: upperSymbol,
      company: trimmedCompany,
    });

    revalidatePath('/watchlist');
    return { success: true };
  } catch (error: any) {
    console.error('Error adding to watchlist:', error);
    if (error.code === 11000) {
      return { success: false, error: 'Stock already in watchlist' };
    }
    return { success: false, error: 'Failed to add to watchlist' };
  }
};

export const removeFromWatchlist = async (symbol: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return { success: false, error: 'Not authenticated' };
    }

    const mongoose = await connectToDatabase();
    const userId = session.user.id;

    await Watchlist.deleteOne({
      userId,
      symbol: symbol.toUpperCase(),
    });

    revalidatePath('/watchlist');
    return { success: true };
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    return { success: false, error: 'Failed to remove from watchlist' };
  }
};

export const isInWatchlist = async (symbol: string): Promise<boolean> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return false;
    }

    const mongoose = await connectToDatabase();
    const userId = session.user.id;

    const item = await Watchlist.findOne({
      userId,
      symbol: symbol.toUpperCase(),
    });

    return !!item;
  } catch (error) {
    console.error('Error checking watchlist:', error);
    return false;
  }
};

export const getUserWatchlist = async (): Promise<StockWithData[]> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return [];
    }

    const mongoose = await connectToDatabase();
    const userId = session.user.id;

    const watchlistItems = await Watchlist.find({ userId })
      .sort({ addedAt: -1 })
      .lean();

    return watchlistItems.map((item) => ({
      userId: item.userId,
      symbol: item.symbol,
      company: item.company,
      addedAt: item.addedAt,
    }));
  } catch (error) {
    console.error('Error getting user watchlist:', error);
    return [];
  }
};

export const getWatchlistWithData = async (): Promise<StockWithData[]> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return [];
    }

    const mongoose = await connectToDatabase();
    const userId = session.user.id;

    const watchlistItems = await Watchlist.find({ userId })
      .sort({ addedAt: -1 })
      .lean();

    // Import getStockDetails dynamically to avoid circular dependencies
    const { getStockDetails } = await import('@/lib/actions/finnhub.actions');

    // Fetch stock details for all watchlist items in parallel
    const watchlistWithData = await Promise.all(
      watchlistItems.map(async (item) => {
        const stockData = await getStockDetails(item.symbol);
        
        const currentPrice = stockData?.price || 0;
        const change = stockData?.change || 0;
        const changePercent = stockData?.changePercent || 0;
        
        // Format price and change
        const priceFormatted = currentPrice > 0 
          ? `$${currentPrice.toFixed(2)}` 
          : 'N/A';
        const changeFormatted = changePercent !== 0
          ? `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`
          : 'N/A';

        // Format market cap
        const marketCap = stockData?.marketCap || 0;
        let marketCapFormatted = 'N/A';
        if (marketCap > 0) {
          if (marketCap >= 1e12) {
            marketCapFormatted = `$${(marketCap / 1e12).toFixed(2)}T`;
          } else if (marketCap >= 1e9) {
            marketCapFormatted = `$${(marketCap / 1e9).toFixed(2)}B`;
          } else if (marketCap >= 1e6) {
            marketCapFormatted = `$${(marketCap / 1e6).toFixed(2)}M`;
          } else {
            marketCapFormatted = `$${marketCap.toFixed(2)}`;
          }
        }

        // Format P/E ratio
        const peRatio = stockData?.peRatio;
        const peRatioFormatted = peRatio !== null && peRatio !== undefined 
          ? peRatio.toFixed(2) 
          : 'N/A';

        return {
          userId: item.userId,
          symbol: item.symbol,
          company: item.company,
          addedAt: item.addedAt,
          currentPrice,
          changePercent,
          priceFormatted,
          changeFormatted,
          marketCap: marketCapFormatted,
          peRatio: peRatioFormatted,
        };
      })
    );

    return watchlistWithData;
  } catch (error) {
    console.error('Error getting watchlist with data:', error);
    return [];
  }
};
