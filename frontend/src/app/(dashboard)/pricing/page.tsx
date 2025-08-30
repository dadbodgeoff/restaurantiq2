'use client';

import React, { useState } from 'react';
import { VendorList } from '../../../components/pricing/VendorList';
import { VendorItemsList } from '../../../components/pricing/VendorItemsList';
import { PriceTrackerCard } from '../../../components/pricing/PriceTrackerCard';
import { InvoiceProcessor } from '../../../components/pricing/InvoiceProcessor';
import { useVendors, useVendorItems, usePriceTrackers, usePricingHealth } from '../../../domains/pricing/hooks/usePricing';

export default function PricingDashboard() {
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [selectedItemNumber, setSelectedItemNumber] = useState<string | null>(null);

  // Data hooks
  const { data: vendors, isLoading: vendorsLoading, refetch: refetchVendors } = useVendors();
  const { data: vendorItems, isLoading: vendorItemsLoading } = useVendorItems(selectedVendorId || '');
  const { data: priceTrackers, isLoading: trackersLoading } = usePriceTrackers(
    selectedVendorId || '',
    selectedItemNumber || ''
  );
  const { data: health } = usePricingHealth();

  const handleVendorSelect = (vendorId: string) => {
    setSelectedVendorId(vendorId);
    setSelectedItemNumber(null); // Reset item selection when vendor changes
  };

  const handleItemSelect = (itemNumber: string) => {
    setSelectedItemNumber(itemNumber);
  };

  const handleInvoiceProcessed = () => {
    refetchVendors(); // Refresh vendors list after processing invoice
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Price Intelligence Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Track your pricing across vendors with 4 key metrics: Last Paid, 7-Day Average, 28-Day Average, and Cross-Vendor Comparison
          </p>
          
          {/* Health Status */}
          {health && (
            <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
              Pricing Services: {health.status}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Vendors */}
          <div className="lg:col-span-1">
            <VendorList
              vendors={vendors || []}
              selectedVendorId={selectedVendorId}
              onVendorSelect={handleVendorSelect}
              isLoading={vendorsLoading}
            />
          </div>

          {/* Middle - Items */}
          <div className="lg:col-span-1">
            {selectedVendorId ? (
              <VendorItemsList
                items={vendorItems?.items || []}
                selectedItemNumber={selectedItemNumber}
                onItemSelect={handleItemSelect}
                isLoading={vendorItemsLoading}
                vendorId={selectedVendorId}
              />
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Items</h3>
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-gray-500">Select a vendor to view items</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Side - Price Trackers & Invoice Processor */}
          <div className="lg:col-span-2 space-y-6">
            {/* Price Trackers */}
            {selectedItemNumber ? (
              <div>
                {trackersLoading ? (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="animate-pulse">
                      <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="h-32 bg-gray-200 rounded"></div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : priceTrackers ? (
                  <PriceTrackerCard
                    trackers={priceTrackers.trackers}
                    vendorId={priceTrackers.vendorId}
                    itemNumber={priceTrackers.itemNumber}
                    lastUpdated={priceTrackers.lastUpdated}
                  />
                ) : (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="text-center py-8">
                      <div className="text-gray-400 mb-2">
                        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <p className="text-gray-500">No price intelligence data available</p>
                      <p className="text-sm text-gray-400">Process an invoice to see pricing data</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500">Select an item to view price intelligence</p>
                </div>
              </div>
            )}

            {/* Invoice Processor */}
            <InvoiceProcessor onInvoiceProcessed={handleInvoiceProcessed} />
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Getting Started</h3>
          <div className="text-blue-800 space-y-2">
            <p>1. <strong>Process an Invoice:</strong> Use the invoice processor to add sample data</p>
            <p>2. <strong>Select a Vendor:</strong> Choose from the vendors list to see their items</p>
            <p>3. <strong>View Price Intelligence:</strong> Click on any item to see the 4 price trackers</p>
            <p>4. <strong>Monitor Trends:</strong> Track last paid, averages, and cross-vendor comparisons</p>
          </div>
        </div>
      </div>
    </div>
  );
}
