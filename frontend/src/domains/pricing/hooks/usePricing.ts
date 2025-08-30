import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PricingService, Vendor, VendorItem, PriceTracker, InvoiceLine, CrossVendorComparison } from '../services/pricing.service';

const pricingService = new PricingService();

// Query keys for React Query
export const pricingKeys = {
  all: ['pricing'] as const,
  vendors: () => [...pricingKeys.all, 'vendors'] as const,
  vendorItems: (vendorId: string) => [...pricingKeys.all, 'vendorItems', vendorId] as const,
  priceTrackers: (vendorId: string, itemNumber: string) => 
    [...pricingKeys.all, 'priceTrackers', vendorId, itemNumber] as const,
  crossVendorComparison: (itemMasterId: string) => 
    [...pricingKeys.all, 'crossVendorComparison', itemMasterId] as const,
  health: () => [...pricingKeys.all, 'health'] as const,
};

// Hook to get all vendors
export const useVendors = () => {
  return useQuery({
    queryKey: pricingKeys.vendors(),
    queryFn: () => pricingService.getVendors(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to get vendor items
export const useVendorItems = (vendorId: string) => {
  return useQuery({
    queryKey: pricingKeys.vendorItems(vendorId),
    queryFn: () => pricingService.getVendorItems(vendorId),
    enabled: !!vendorId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Hook to get price trackers for a specific item
export const usePriceTrackers = (vendorId: string, itemNumber: string) => {
  return useQuery({
    queryKey: pricingKeys.priceTrackers(vendorId, itemNumber),
    queryFn: () => pricingService.getPriceTrackers(vendorId, itemNumber),
    enabled: !!vendorId && !!itemNumber,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

// Hook to get cross-vendor comparison
export const useCrossVendorComparison = (itemMasterId: string) => {
  return useQuery({
    queryKey: pricingKeys.crossVendorComparison(itemMasterId),
    queryFn: () => pricingService.getCrossVendorComparison(itemMasterId),
    enabled: !!itemMasterId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Hook to get pricing health status
export const usePricingHealth = () => {
  return useQuery({
    queryKey: pricingKeys.health(),
    queryFn: () => pricingService.getHealth(),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
};

// Hook to process invoice
export const useProcessInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ vendorId, invoiceLines }: { vendorId: string; invoiceLines: InvoiceLine[] }) =>
      pricingService.processInvoice(vendorId, invoiceLines),
    onSuccess: (data) => {
      // Invalidate relevant queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: pricingKeys.vendorItems(data.vendorId) });
      queryClient.invalidateQueries({ queryKey: pricingKeys.vendors() });
      
      // Invalidate all price trackers since processing an invoice might affect multiple items
      queryClient.invalidateQueries({ queryKey: [...pricingKeys.all, 'priceTrackers'] });
    },
  });
};
