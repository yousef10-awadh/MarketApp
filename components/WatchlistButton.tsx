'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Star, Trash2 } from 'lucide-react';
import { addToWatchlist, removeFromWatchlist } from '@/lib/actions/watchlist.actions';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync state with prop changes
  useEffect(() => {
    setIsInWatchlist(initialIsInWatchlist);
  }, [initialIsInWatchlist]);

  const handleToggle = useCallback(async (e?: React.MouseEvent) => {
    // Prevent event bubbling if inside clickable rows
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    // Clear any existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Optimistic UI update
    const previousState = isInWatchlist;
    setIsInWatchlist(!isInWatchlist);
    setIsLoading(true);

    // Debounce the actual API call
    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        if (previousState) {
          const result = await removeFromWatchlist(symbol);
          if (result.success) {
            toast.success('Removed from watchlist', {
              description: `${symbol} has been removed from your watchlist.`,
            });
            onWatchlistChange?.(symbol, false);
          } else {
            // Revert optimistic update on error
            setIsInWatchlist(previousState);
            toast.error('Failed to remove', {
              description: result.error || 'Could not remove stock from watchlist.',
            });
          }
        } else {
          const result = await addToWatchlist(symbol, company);
          if (result.success) {
            toast.success('Added to watchlist', {
              description: `${symbol} has been added to your watchlist.`,
            });
            onWatchlistChange?.(symbol, true);
          } else {
            // Revert optimistic update on error
            setIsInWatchlist(previousState);
            toast.error('Failed to add', {
              description: result.error || 'Could not add stock to watchlist.',
            });
          }
        }
      } catch (error) {
        // Revert optimistic update on error
        setIsInWatchlist(previousState);
        console.error('Error toggling watchlist:', error);
        toast.error('Error', {
          description: 'An error occurred while updating your watchlist.',
        });
      } finally {
        setIsLoading(false);
      }
    }, 300);
  }, [isInWatchlist, symbol, company, onWatchlistChange]);

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
