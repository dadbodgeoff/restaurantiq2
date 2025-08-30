import React from 'react';
import { PriceTracker } from '../../domains/pricing/services/pricing.service';

interface PriceTrackerCardProps {
  trackers: PriceTracker;
  vendorId: string;
  itemNumber: string;
  lastUpdated: string;
}

export const PriceTrackerCard: React.FC<PriceTrackerCardProps> = ({
  trackers,
  vendorId,
  itemNumber,
  lastUpdated
}) => {
  const formatPrice = (price: number | null) => {
    if (price === null) return 'N/A';
    return `$${price.toFixed(2)}`;
  };

  const formatPercentage = (percentage: number | null) => {
    if (percentage === null) return 'N/A';
    const sign = percentage >= 0 ? '+' : '';
    return `${sign}${percentage.toFixed(1)}%`;
  };

  const getPriceColor = (price: number | null, isPercentage = false) => {
    if (price === null) return 'text-gray-500';
    if (isPercentage) {
      return price > 0 ? 'text-red-600' : price < 0 ? 'text-green-600' : 'text-gray-600';
    }
    return 'text-gray-900';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Price Intelligence</h3>
          <p className="text-sm text-gray-600">Vendor: {vendorId}</p>
          <p className="text-sm text-gray-600">Item: {itemNumber}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Last Updated</p>
          <p className="text-xs text-gray-700">
            {new Date(lastUpdated).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Last Paid Price */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Last Paid Price</h4>
          <div className="text-2xl font-bold text-blue-600">
            {formatPrice(trackers.lastPaidPrice.value)}
          </div>
          {trackers.lastPaidPrice.date && (
            <p className="text-xs text-blue-700 mt-1">
              {new Date(trackers.lastPaidPrice.date).toLocaleDateString()}
            </p>
          )}
          <p className="text-xs text-blue-600 mt-2">
            {trackers.lastPaidPrice.description}
          </p>
        </div>

        {/* 7-Day Average */}
        <div className="bg-green-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-green-900 mb-2">7-Day Average</h4>
          <div className="text-2xl font-bold text-green-600">
            {formatPrice(trackers.avg7dPrice.value)}
          </div>
          <p className="text-xs text-green-600 mt-2">
            {trackers.avg7dPrice.description}
          </p>
        </div>

        {/* 28-Day Average */}
        <div className="bg-purple-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-purple-900 mb-2">28-Day Average</h4>
          <div className="text-2xl font-bold text-purple-600">
            {formatPrice(trackers.avg28dPrice.value)}
          </div>
          <p className="text-xs text-purple-600 mt-2">
            {trackers.avg28dPrice.description}
          </p>
        </div>

        {/* Cross-Vendor Comparison */}
        <div className="bg-orange-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-orange-900 mb-2">Cross-Vendor Best</h4>
          <div className="text-2xl font-bold text-orange-600">
            {formatPrice(trackers.crossVendorComparison.bestPrice)}
          </div>
          {trackers.crossVendorComparison.bestVendor && (
            <p className="text-xs text-orange-700 mt-1">
              {trackers.crossVendorComparison.bestVendor}
            </p>
          )}
          {trackers.crossVendorComparison.diffVsBestPct !== null && (
            <p className={`text-xs mt-1 ${getPriceColor(trackers.crossVendorComparison.diffVsBestPct, true)}`}>
              {formatPercentage(trackers.crossVendorComparison.diffVsBestPct)} vs best
            </p>
          )}
          <p className="text-xs text-orange-600 mt-2">
            {trackers.crossVendorComparison.description}
          </p>
        </div>
      </div>
    </div>
  );
};
