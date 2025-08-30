import React from 'react';
import { Vendor } from '../../domains/pricing/services/pricing.service';

interface VendorListProps {
  vendors: Vendor[];
  selectedVendorId: string | null;
  onVendorSelect: (vendorId: string) => void;
  isLoading: boolean;
}

export const VendorList: React.FC<VendorListProps> = ({
  vendors,
  selectedVendorId,
  onVendorSelect,
  isLoading
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendors</h3>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (vendors.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendors</h3>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <p className="text-gray-500">No vendors found</p>
          <p className="text-sm text-gray-400">Start by processing an invoice to add vendors</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendors ({vendors.length})</h3>
      <div className="space-y-2">
        {vendors.map((vendor) => (
          <button
            key={vendor.id}
            onClick={() => onVendorSelect(vendor.id)}
            className={`w-full text-left p-3 rounded-lg border transition-colors ${
              selectedVendorId === vendor.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium text-gray-900">{vendor.name}</h4>
                <p className="text-sm text-gray-600">
                  {vendor.itemCount} item{vendor.itemCount !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="text-gray-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
