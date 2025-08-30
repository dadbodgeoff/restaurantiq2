import { Router } from 'express';
import { authenticate, authorizeRestaurantAccess } from '../../../domains/auth/middleware/auth.middleware';
import { PriceIngestionService } from '../../../domains/pricing/services/price-ingestion.service';
import { PriceStatsService } from '../../../domains/pricing/services/price-stats.service';
import { ItemMatchingService } from '../../../domains/pricing/services/item-matching.service';
import { VendorItemRepository } from '../../../domains/pricing/repositories/vendor-item.repository';
import { VendorItemStatsRepository } from '../../../domains/pricing/repositories/vendor-item-stats.repository';
import { VendorItemDailyRepository } from '../../../domains/pricing/repositories/vendor-item-daily.repository';

const router = Router();

// ============================================================================
// VENDOR MANAGEMENT
// ============================================================================

/**
 * GET /api/v1/pricing/vendors
 * Get all vendors for a restaurant
 */
router.get('/vendors', authenticate(), authorizeRestaurantAccess(), async (req, res) => {
  try {
    const { restaurantId } = req.user!;
    const vendorItemRepository = req.container.resolve('vendorItemRepository') as VendorItemRepository;
    
    const vendorItems = await vendorItemRepository.findByRestaurantId(restaurantId);
    
    // Group by vendor
    const vendors = vendorItems.reduce((acc, item) => {
      const vendor = item.vendor;
      if (!acc.find(v => v.id === vendor.id)) {
        acc.push({
          id: vendor.id,
          name: vendor.name,
          itemCount: vendorItems.filter(vi => vi.vendorId === vendor.id).length
        });
      }
      return acc;
    }, [] as any[]);
    
    res.json({
      success: true,
      data: vendors,
      correlationId: req.correlationId
    });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch vendors',
        correlationId: req.correlationId
      }
    });
  }
});

// ============================================================================
// PRICE INTELLIGENCE - 4 TRACKERS
// ============================================================================

/**
 * GET /api/v1/pricing/trackers/:vendorId/:itemNumber
 * Get all 4 price trackers for a specific item
 */
router.get('/trackers/:vendorId/:itemNumber', authenticate(), authorizeRestaurantAccess(), async (req, res) => {
  try {
    const { restaurantId } = req.user!;
    const { vendorId, itemNumber } = req.params;
    
    const vendorItemStatsRepository = req.container.resolve('vendorItemStatsRepository') as VendorItemStatsRepository;
    
    const stats = await vendorItemStatsRepository.get(restaurantId, vendorId, itemNumber);
    
    if (!stats) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Price intelligence data not found for this item',
          correlationId: req.correlationId
        }
      });
    }
    
    // Format the 4 trackers
    const trackers = {
      lastPaidPrice: {
        value: stats.lastPaidPrice,
        date: stats.lastPaidAt,
        description: 'Most recent price paid for this item'
      },
      avg7dPrice: {
        value: stats.avg7dPrice,
        description: '7-day weighted average price'
      },
      avg28dPrice: {
        value: stats.avg28dPrice,
        description: '28-day weighted average price'
      },
      crossVendorComparison: {
        bestPrice: stats.bestPriceAcrossVendors,
        bestVendor: stats.bestVendorName,
        diffVsBestPct: stats.diffVsBestPct,
        description: 'Best price across all vendors for similar items'
      }
    };
    
    res.json({
      success: true,
      data: {
        vendorId,
        itemNumber,
        trackers,
        lastUpdated: stats.updatedAt
      },
      correlationId: req.correlationId
    });
      } catch (error) {
      console.error('Error fetching price trackers:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch price trackers',
          correlationId: req.correlationId
        }
      });
    }
});

/**
 * GET /api/v1/pricing/trackers/:vendorId
 * Get all items with price intelligence for a vendor
 */
router.get('/trackers/:vendorId', authenticate(), authorizeRestaurantAccess(), async (req, res) => {
  try {
    const { restaurantId } = req.user!;
    const { vendorId } = req.params;
    
    const vendorItemStatsRepository = req.container.resolve('vendorItemStatsRepository') as VendorItemStatsRepository;
    
    const allStats = await vendorItemStatsRepository.findByVendorId(vendorId);
    
    // Filter by restaurant for security
    const filteredStats = allStats.filter(stats => stats.restaurantId === restaurantId);
    
    const items = filteredStats.map((stats: any) => ({
      itemNumber: stats.itemNumber,
      lastSeenName: stats.item?.lastSeenName,
      lastSeenUnit: stats.item?.lastSeenUnit,
      trackers: {
        lastPaidPrice: stats.lastPaidPrice,
        lastPaidAt: stats.lastPaidAt,
        avg7dPrice: stats.avg7dPrice,
        avg28dPrice: stats.avg28dPrice,
        bestPriceAcrossVendors: stats.bestPriceAcrossVendors,
        bestVendorName: stats.bestVendorName,
        diffVsBestPct: stats.diffVsBestPct
      }
    }));
    
    res.json({
      success: true,
      data: {
        vendorId,
        items,
        count: items.length
      },
      correlationId: req.correlationId
    });
  } catch (error) {
    console.error('Error fetching vendor items:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch vendor items',
        correlationId: req.correlationId
      }
    });
  }
});

// ============================================================================
// INVOICE PROCESSING
// ============================================================================

/**
 * POST /api/v1/pricing/process-invoice
 * Process invoice lines and update price intelligence
 */
router.post('/process-invoice', authenticate(), authorizeRestaurantAccess(), async (req, res) => {
  try {
    const { restaurantId } = req.user!;
    const { vendorId, invoiceLines } = req.body;
    
    if (!vendorId || !invoiceLines || !Array.isArray(invoiceLines)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'vendorId and invoiceLines array are required',
          correlationId: req.correlationId
        }
      });
    }
    
    const priceIngestionService = req.container.resolve('priceIngestionService') as PriceIngestionService;
    
    const results = [];
    
    for (const line of invoiceLines) {
      const { itemNumber, name, unit, unitPrice, quantity, businessDate } = line;
      
      await priceIngestionService.recordLine({
        restaurantId,
        vendorId,
        itemNumber,
        name,
        unit,
        unitPrice,
        quantity,
        businessDate
      });
      
      results.push({
        itemNumber,
        name,
        status: 'processed'
      });
    }
    
    res.json({
      success: true,
      data: {
        vendorId,
        processedLines: results.length,
        results
      },
      correlationId: req.correlationId
    });
      } catch (error) {
      console.error('Error processing invoice:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to process invoice',
          correlationId: req.correlationId
        }
      });
    }
});

// ============================================================================
// CROSS-VENDOR COMPARISON
// ============================================================================

/**
 * GET /api/v1/pricing/cross-vendor/:itemMasterId
 * Get cross-vendor comparison for a specific item master
 */
router.get('/cross-vendor/:itemMasterId', authenticate(), authorizeRestaurantAccess(), async (req, res) => {
  try {
    const { restaurantId } = req.user!;
    const { itemMasterId } = req.params;
    
    const itemMatchingService = req.container.resolve('itemMatchingService') as ItemMatchingService;
    
    // This would need to be implemented in ItemMatchingService
    // For now, we'll get the data through the stats repository
    const vendorItemStatsRepository = req.container.resolve('vendorItemStatsRepository') as VendorItemStatsRepository;
    
    const vendorItems = await vendorItemStatsRepository.findByRestaurantId(restaurantId);
    
    // Filter by itemMasterId
    const filteredItems = vendorItems.filter(item => item.item?.itemMasterId === itemMasterId);
    
    const comparison = filteredItems.map((item: any) => ({
      vendorId: item.vendorId,
      vendorName: item.vendor?.name,
      itemNumber: item.itemNumber,
      lastPaidPrice: item.lastPaidPrice,
      lastPaidAt: item.lastPaidAt,
      bestPriceAcrossVendors: item.bestPriceAcrossVendors,
      diffVsBestPct: item.diffVsBestPct
    }));
    
    res.json({
      success: true,
      data: {
        itemMasterId,
        comparison,
        bestPrice: Math.min(...comparison.map((c: any) => c.lastPaidPrice || Infinity)),
        vendorCount: comparison.length
      },
      correlationId: req.correlationId
    });
  } catch (error) {
    console.error('Error fetching cross-vendor comparison:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch cross-vendor comparison',
        correlationId: req.correlationId
      }
    });
  }
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * GET /api/v1/pricing/health
 * Health check for pricing services
 */
router.get('/health', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        status: 'healthy',
        services: {
          priceIngestion: 'available',
          priceStats: 'available',
          itemMatching: 'available'
        },
        timestamp: new Date().toISOString()
      },
      correlationId: req.correlationId
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Pricing services unavailable',
        correlationId: req.correlationId
      }
    });
  }
});

export default router;
