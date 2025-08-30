import { ApiService } from '../../shared/services/api.service';
import { config } from '../../../lib/config';

export interface PriceTracker {
  lastPaidPrice: {
    value: number | null;
    date: string | null;
    description: string;
  };
  avg7dPrice: {
    value: number | null;
    description: string;
  };
  avg28dPrice: {
    value: number | null;
    description: string;
  };
  crossVendorComparison: {
    bestPrice: number | null;
    bestVendor: string | null;
    diffVsBestPct: number | null;
    description: string;
  };
}

export interface VendorItem {
  itemNumber: string;
  lastSeenName: string | null;
  lastSeenUnit: string | null;
  trackers: {
    lastPaidPrice: number | null;
    lastPaidAt: string | null;
    avg7dPrice: number | null;
    avg28dPrice: number | null;
    bestPriceAcrossVendors: number | null;
    bestVendorName: string | null;
    diffVsBestPct: number | null;
  };
}

export interface Vendor {
  id: string;
  name: string;
  itemCount: number;
}

export interface InvoiceLine {
  itemNumber: string;
  name: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  businessDate: string;
}

export interface CrossVendorComparison {
  itemMasterId: string;
  comparison: Array<{
    vendorId: string;
    vendorName: string | null;
    itemNumber: string;
    lastPaidPrice: number | null;
    lastPaidAt: string | null;
    bestPriceAcrossVendors: number | null;
    diffVsBestPct: number | null;
  }>;
  bestPrice: number;
  vendorCount: number;
}

export class PricingService {
  private apiService: ApiService;

  constructor() {
    this.apiService = new ApiService(`${config.API_URL}/api/v1`);
  }

  // Get all vendors for a restaurant
  async getVendors(): Promise<Vendor[]> {
    const response = await this.apiService.get<Vendor[]>('/pricing/vendors');
    return response.data;
  }

  // Get all 4 price trackers for a specific item
  async getPriceTrackers(vendorId: string, itemNumber: string): Promise<{
    vendorId: string;
    itemNumber: string;
    trackers: PriceTracker;
    lastUpdated: string;
  }> {
    const response = await this.apiService.get<{
      vendorId: string;
      itemNumber: string;
      trackers: PriceTracker;
      lastUpdated: string;
    }>(`/pricing/trackers/${vendorId}/${itemNumber}`);
    return response.data;
  }

  // Get all items with price intelligence for a vendor
  async getVendorItems(vendorId: string): Promise<{
    vendorId: string;
    items: VendorItem[];
    count: number;
  }> {
    const response = await this.apiService.get<{
      vendorId: string;
      items: VendorItem[];
      count: number;
    }>(`/pricing/trackers/${vendorId}`);
    return response.data;
  }

  // Process invoice lines and update price intelligence
  async processInvoice(vendorId: string, invoiceLines: InvoiceLine[]): Promise<{
    vendorId: string;
    processedLines: number;
    results: Array<{
      itemNumber: string;
      name: string;
      status: string;
    }>;
  }> {
    const response = await this.apiService.post<{
      vendorId: string;
      processedLines: number;
      results: Array<{
        itemNumber: string;
        name: string;
        status: string;
      }>;
    }>('/pricing/process-invoice', {
      vendorId,
      invoiceLines
    });
    return response.data;
  }

  // Get cross-vendor comparison for a specific item master
  async getCrossVendorComparison(itemMasterId: string): Promise<CrossVendorComparison> {
    const response = await this.apiService.get<CrossVendorComparison>(`/pricing/cross-vendor/${itemMasterId}`);
    return response.data;
  }

  // Health check for pricing services
  async getHealth(): Promise<{
    status: string;
    services: {
      priceIngestion: string;
      priceStats: string;
      itemMatching: string;
    };
    timestamp: string;
  }> {
    const response = await this.apiService.get<{
      status: string;
      services: {
        priceIngestion: string;
        priceStats: string;
        itemMatching: string;
      };
      timestamp: string;
    }>('/pricing/health');
    return response.data;
  }
}
