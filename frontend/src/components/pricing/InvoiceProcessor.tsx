import React, { useState } from 'react';
import { useProcessInvoice } from '../../domains/pricing/hooks/usePricing';
import { InvoiceLine } from '../../domains/pricing/services/pricing.service';

interface InvoiceProcessorProps {
  onInvoiceProcessed: () => void;
}

export const InvoiceProcessor: React.FC<InvoiceProcessorProps> = ({ onInvoiceProcessed }) => {
  const [vendorId, setVendorId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSampleData, setShowSampleData] = useState(false);
  
  const processInvoiceMutation = useProcessInvoice();

  const sampleInvoiceLines: InvoiceLine[] = [
    {
      itemNumber: 'TOMATO-001',
      name: 'Roma Tomatoes',
      unit: 'lb',
      unitPrice: 2.49,
      quantity: 10,
      businessDate: new Date().toISOString().split('T')[0]
    },
    {
      itemNumber: 'ONION-002',
      name: 'Yellow Onions',
      unit: 'lb',
      unitPrice: 1.29,
      quantity: 15,
      businessDate: new Date().toISOString().split('T')[0]
    },
    {
      itemNumber: 'LETTUCE-003',
      name: 'Iceberg Lettuce',
      unit: 'each',
      unitPrice: 1.99,
      quantity: 8,
      businessDate: new Date().toISOString().split('T')[0]
    },
    {
      itemNumber: 'CARROT-004',
      name: 'Baby Carrots',
      unit: 'lb',
      unitPrice: 1.79,
      quantity: 12,
      businessDate: new Date().toISOString().split('T')[0]
    }
  ];

  const handleProcessSampleInvoice = async () => {
    if (!vendorId.trim()) {
      alert('Please enter a vendor ID');
      return;
    }

    setIsProcessing(true);
    try {
      await processInvoiceMutation.mutateAsync({
        vendorId: vendorId.trim(),
        invoiceLines: sampleInvoiceLines
      });
      
      setShowSampleData(false);
      setVendorId('');
      onInvoiceProcessed();
      
      alert('Sample invoice processed successfully! Check the vendors list to see the new data.');
    } catch (error) {
      console.error('Error processing invoice:', error);
      alert('Error processing invoice. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Process Invoice</h3>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="vendorId" className="block text-sm font-medium text-gray-700 mb-2">
            Vendor ID
          </label>
          <input
            type="text"
            id="vendorId"
            value={vendorId}
            onChange={(e) => setVendorId(e.target.value)}
            placeholder="Enter vendor ID (e.g., clvendor12345678901234567)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Use a 25-character CUID format for testing
          </p>
        </div>

        <div className="border-t pt-4">
          <button
            onClick={() => setShowSampleData(!showSampleData)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {showSampleData ? 'Hide' : 'Show'} Sample Invoice Data
          </button>
          
          {showSampleData && (
            <div className="mt-3 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Sample Invoice Lines:</h4>
              <div className="space-y-2 text-sm">
                {sampleInvoiceLines.map((line, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-gray-700">
                      {line.name} ({line.itemNumber})
                    </span>
                    <span className="text-gray-600">
                      {line.quantity} {line.unit} @ ${line.unitPrice}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleProcessSampleInvoice}
          disabled={!vendorId.trim() || isProcessing}
          className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
            !vendorId.trim() || isProcessing
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isProcessing ? 'Processing...' : 'Process Sample Invoice'}
        </button>

        {processInvoiceMutation.isError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">
              Error: {processInvoiceMutation.error?.message || 'Failed to process invoice'}
            </p>
          </div>
        )}

        {processInvoiceMutation.isSuccess && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-600">
              Successfully processed {processInvoiceMutation.data?.processedLines} invoice lines!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
