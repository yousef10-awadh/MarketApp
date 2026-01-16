import mongoose, { Document, Model, Schema } from 'mongoose';

export interface WatchlistItem extends Document {
  userId: string;
  symbol: string;
  company: string;
  addedAt: Date;
}

const watchlistSchema = new Schema<WatchlistItem>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    company: {
      type: String,
      required: true,
      trim: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

// Compound index to prevent duplicate entries (userId + symbol)
watchlistSchema.index({ userId: 1, symbol: 1 }, { unique: true });

const Watchlist: Model<WatchlistItem> =
  mongoose.models?.Watchlist || mongoose.model<WatchlistItem>('Watchlist', watchlistSchema);

export default Watchlist;
