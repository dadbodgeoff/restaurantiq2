import React from 'react';
import { VendorItem } from '../../domains/pricing/services/pricing.service';

interface VendorItemsListProps {
  items: VendorItem[];
  selectedItemNumber: string | null;
  onItemSelect: (itemNumber: string) => void;
  isLoading: boolean;
  vendorId: string;
}

export const VendorItemsList: React.FC<VendorItemsListProps> = ({
  items,
  selectedItemNumber,
  onItemSelect,
  isLoading,
  vendorId
}) => {
  const formatPrice = (price: number | null) => {
    if (price === null) return 'N/A';
    return `$${price.toFixed(2)}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Items</h3>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Items</h3>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p className="text-gray-500">No items found for this vendor</p>
          <p className="text-sm text-gray-400">Process an invoice to see price intelligence data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Items ({items.length})
      </h3>
      <div className="space-y-3">
        {items.map((item) => (
          <button
            key={item.itemNumber}
            onClick={() => onItemSelect(item.itemNumber)}
            className={`w-full text-left p-4 rounded-lg border transition-colors ${
              selectedItemNumber === item.itemNumber
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-gray-900">{item.itemNumber}</h4>
                  {item.lastSeenUnit && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {item.lastSeenUnit}
                    </span>
                  )}
                </div>
                {item.lastSeenName && (
                  <p className="text-sm text-gray-600 mb-2">{item.lastSeenName}</p>
                )}
                
                {/* Quick price indicators */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Last Paid:</span>
                    <div className="font-medium text-blue-600">
                      {formatPrice(item.trackers.lastPaidPrice)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">7-Day Avg:</span>
                    <div className="font-medium text-green-600">
                      {formatPrice(item.trackers.avg7dPrice)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Best Price:</span>
                    <div className="font-medium text-orange-600">
                      {formatPrice(item.trackers.bestPriceAcrossVendors)}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-gray-400 ml-4">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
            
            {/* Last updated info */}
            {item.trackers.lastPaidAt && (
              <div className="mt-2 text-xs text-gray-500">
                Last updated: {formatDate(item.trackers.lastPaidAt)}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
