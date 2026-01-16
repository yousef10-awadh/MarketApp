'use server';

import { connectToDatabase } from '@/database/mongoose';
import Watchlist from '@/database/models/watchlist.model';

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
