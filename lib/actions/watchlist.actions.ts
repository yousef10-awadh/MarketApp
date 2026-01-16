'use server';

import { connectToDatabase } from '@/database/mongoose';
import Watchlist from '@/database/models/watchlist.model';
import { auth } from '@/lib/better-auth/auth';
import { headers } from 'next/headers';

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

    await Watchlist.create({
      userId,
      symbol: symbol.toUpperCase(),
      company,
    });

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
