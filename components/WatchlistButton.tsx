'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Star, Trash2 } from 'lucide-react';
import { addToWatchlist, removeFromWatchlist } from '@/lib/actions/watchlist.actions';
import { cn } from '@/lib/utils';

const WatchlistButton = ({
  symbol,
  company,
  isInWatchlist: initialIsInWatchlist,
  showTrashIcon = false,
  type = 'button',
  onWatchlistChange,
}: WatchlistButtonProps) => {
  const [isInWatchlist, setIsInWatchlist] = useState(initialIsInWatchlist);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      if (isInWatchlist) {
        const result = await removeFromWatchlist(symbol);
        if (result.success) {
          setIsInWatchlist(false);
          onWatchlistChange?.(symbol, false);
        }
      } else {
        const result = await addToWatchlist(symbol, company);
        if (result.success) {
          setIsInWatchlist(true);
          onWatchlistChange?.(symbol, true);
        }
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (type === 'icon') {
    return (
      <button
        onClick={handleToggle}
        disabled={isLoading}
        className={cn(
          'watchlist-icon-btn',
          isInWatchlist && 'watchlist-icon-added'
        )}
        aria-label={isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
      >
        <div className="watchlist-icon">
          {showTrashIcon ? (
            <Trash2 className="trash-icon" />
          ) : (
            <Star className={cn('star-icon', isInWatchlist && 'fill-current')} />
          )}
        </div>
      </button>
    );
  }

  return (
    <Button
      onClick={handleToggle}
      disabled={isLoading}
      className={cn(
        'watchlist-btn',
        isInWatchlist && 'watchlist-remove'
      )}
    >
      {isLoading ? (
        'Loading...'
      ) : isInWatchlist ? (
        'Remove from Watchlist'
      ) : (
        'Add to Watchlist'
      )}
    </Button>
  );
};

export default WatchlistButton;
