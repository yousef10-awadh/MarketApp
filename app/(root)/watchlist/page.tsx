import { redirect } from 'next/navigation';
import { auth } from '@/lib/better-auth/auth';
import { headers } from 'next/headers';
import { searchStocks } from '@/lib/actions/finnhub.actions';
import { getWatchlistWithData } from '@/lib/actions/watchlist.actions';
import SearchCommand from '@/components/SearchCommand';
import WatchlistTable from '@/components/WatchlistTable';
import { Star } from 'lucide-react';

const WatchlistPage = async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session?.user) {
    redirect('/sign-in');
  }

  const watchlist = await getWatchlistWithData();
  const initialStocks = await searchStocks();

  return (
    <div className="w-full p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Watchlist</h1>
        <SearchCommand 
          renderAs="button" 
          label="Add Stock" 
          initialStocks={initialStocks}
        />
      </div>

      {watchlist.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="mb-4 p-4 rounded-full bg-gray-800">
            <Star className="w-12 h-12 text-gray-400" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Your watchlist is empty</h2>
          <p className="text-gray-400 mb-6 max-w-md">
            Search for stocks and click the star icon to add them to your watchlist.
          </p>
          <SearchCommand 
            renderAs="button" 
            label="Add Stock" 
            initialStocks={initialStocks}
          />
        </div>
      ) : (
        <WatchlistTable watchlist={watchlist} />
      )}
    </div>
  );
};

export default WatchlistPage;
