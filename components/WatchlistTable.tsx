'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import WatchlistButton from './WatchlistButton';
import Link from 'next/link';
import { WATCHLIST_TABLE_HEADER } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

const WatchlistTable = ({ watchlist }: WatchlistTableProps) => {
  const router = useRouter();

  if (!watchlist || watchlist.length === 0) {
    return null;
  }

  const handleWatchlistChange = (symbol: string, isAdded: boolean) => {
    if (!isAdded) {
      // Refresh the page to update the table when item is removed
      router.refresh();
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {WATCHLIST_TABLE_HEADER.map((header) => (
              <TableHead key={header}>{header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {watchlist.map((stock) => (
            <TableRow key={stock.symbol} className="cursor-pointer hover:bg-muted/50">
              <TableCell>
                <Link 
                  href={`/stocks/${stock.symbol}`}
                  className="font-medium hover:underline"
                >
                  {stock.company}
                </Link>
              </TableCell>
              <TableCell>
                <Link 
                  href={`/stocks/${stock.symbol}`}
                  className="text-muted-foreground hover:underline"
                >
                  {stock.symbol}
                </Link>
              </TableCell>
              <TableCell className="font-medium">
                {stock.priceFormatted || 'N/A'}
              </TableCell>
              <TableCell>
                <span
                  className={cn(
                    'font-medium',
                    stock.changePercent !== undefined && stock.changePercent > 0
                      ? 'text-green-500'
                      : stock.changePercent !== undefined && stock.changePercent < 0
                      ? 'text-red-500'
                      : 'text-gray-400'
                  )}
                >
                  {stock.changeFormatted || 'N/A'}
                </span>
              </TableCell>
              <TableCell>{stock.marketCap || 'N/A'}</TableCell>
              <TableCell>{stock.peRatio || 'N/A'}</TableCell>
              <TableCell>
                <span className="text-muted-foreground text-sm">-</span>
              </TableCell>
              <TableCell>
                <div onClick={(e) => e.stopPropagation()}>
                  <WatchlistButton
                    symbol={stock.symbol}
                    company={stock.company}
                    isInWatchlist={true}
                    type="icon"
                    showTrashIcon={true}
                    onWatchlistChange={handleWatchlistChange}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default WatchlistTable;
