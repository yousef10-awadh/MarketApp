import TradingViewWidget from '@/components/TradingViewWidget';
import WatchlistButton from '@/components/WatchlistButton';
import {
  SYMBOL_INFO_WIDGET_CONFIG,
  CANDLE_CHART_WIDGET_CONFIG,
  BASELINE_WIDGET_CONFIG,
  TECHNICAL_ANALYSIS_WIDGET_CONFIG,
  COMPANY_PROFILE_WIDGET_CONFIG,
  COMPANY_FINANCIALS_WIDGET_CONFIG,
} from '@/lib/constants';
import { getUserWatchlist } from '@/lib/actions/watchlist.actions';
import { getStockDetails } from '@/lib/actions/finnhub.actions';

const StockDetails = async ({ params }: StockDetailsPageProps) => {
  const { symbol } = await params;
  const upperSymbol = symbol.toUpperCase();
  
  // Fetch stock details and watchlist in parallel
  const [stockData, watchlist] = await Promise.all([
    getStockDetails(upperSymbol),
    getUserWatchlist(),
  ]);

  const company = stockData?.company || upperSymbol;
  const isInWatchlistStatus = watchlist.some(item => item.symbol === upperSymbol);

  const scriptUrl = 'https://s3.tradingview.com/external-embedding/embed-widget-';

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <TradingViewWidget
            scriptUrl={`${scriptUrl}symbol-info.js`}
            config={SYMBOL_INFO_WIDGET_CONFIG(upperSymbol)}
            height={170}
          />
          <TradingViewWidget
            scriptUrl={`${scriptUrl}advanced-chart.js`}
            config={CANDLE_CHART_WIDGET_CONFIG(upperSymbol)}
            height={600}
          />
          <TradingViewWidget
            scriptUrl={`${scriptUrl}advanced-chart.js`}
            config={BASELINE_WIDGET_CONFIG(upperSymbol)}
            height={600}
          />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <WatchlistButton
            symbol={upperSymbol}
            company={company}
            isInWatchlist={isInWatchlistStatus}
          />
          <TradingViewWidget
            scriptUrl={`${scriptUrl}technical-analysis.js`}
            config={TECHNICAL_ANALYSIS_WIDGET_CONFIG(upperSymbol)}
            height={400}
          />
          <TradingViewWidget
            scriptUrl={`${scriptUrl}company-profile.js`}
            config={COMPANY_PROFILE_WIDGET_CONFIG(upperSymbol)}
            height={440}
          />
          <TradingViewWidget
            scriptUrl={`${scriptUrl}financials.js`}
            config={COMPANY_FINANCIALS_WIDGET_CONFIG(upperSymbol)}
            height={464}
          />
        </div>
      </div>
    </div>
  );
};

export default StockDetails;
