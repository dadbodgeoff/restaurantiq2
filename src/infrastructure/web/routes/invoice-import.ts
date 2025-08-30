import { Router } from 'express';
import { authenticate, authorizeRestaurantAccess } from '../../../domains/auth/middleware/auth.middleware';
import { uploadSingleFile, handleUploadError, cleanupTempFile } from '../middleware/file-upload.middleware';
import { InvoiceImportService } from '../../../domains/invoice/services/invoice-import.service';
import * as path from 'path';

const router = Router();

// ============================================================================
// INVOICE IMPORT ROUTES
// ============================================================================

/**
 * POST /api/v1/invoice-import/upload
 * Upload and process invoice file (CSV, PDF, TXT)
 */
router.post('/upload', 
  authenticate(), 
  authorizeRestaurantAccess(),
  uploadSingleFile,
  handleUploadError,
  async (req, res) => {
    try {
      const { restaurantId } = req.user!;
      const { vendorName, invoiceDate } = req.body;
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'NO_FILE_UPLOADED',
            message: 'No file was uploaded',
            correlationId: (req as any).correlationId
          }
        });
      }

      const filePath = req.file.path;
      const fileName = req.file.originalname;
      const fileSize = req.file.size;

      // Validate file size
      if (fileSize > 10 * 1024 * 1024) { // 10MB
        cleanupTempFile(filePath);
        return res.status(400).json({
          success: false,
          error: {
            code: 'FILE_TOO_LARGE',
            message: 'File size exceeds 10MB limit',
            correlationId: (req as any).correlationId
          }
        });
      }

      // Validate file type
      const allowedExtensions = ['.csv', '.pdf', '.txt'];
      const fileExtension = path.extname(fileName).toLowerCase();
      
      if (!allowedExtensions.includes(fileExtension)) {
        cleanupTempFile(filePath);
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_FILE_TYPE',
            message: `Invalid file type. Allowed types: ${allowedExtensions.join(', ')}`,
            correlationId: (req as any).correlationId
          }
        });
      }

      // Resolve services from container
      const invoiceImportService = req.container.resolve('invoiceImportService') as InvoiceImportService;

      // Process the invoice file
      const result = await invoiceImportService.importInvoiceFromFile(
        restaurantId,
        filePath,
        vendorName,
        invoiceDate
      );

      // Clean up temporary file
      cleanupTempFile(filePath);

      // Return results
      res.json({
        success: true,
        data: {
          fileName,
          fileSize,
          fileType: fileExtension,
          ...result
        },
        correlationId: (req as any).correlationId
      });

    } catch (error) {
      // Clean up file on error
      if (req.file?.path) {
        cleanupTempFile(req.file.path);
      }

      console.error('Error processing invoice upload:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'IMPORT_ERROR',
          message: error instanceof Error ? error.message : 'Failed to process invoice file',
          correlationId: (req as any).correlationId
        }
      });
    }
  }
);

/**
 * GET /api/v1/invoice-import/supported-formats
 * Get list of supported file formats and their requirements
 */
router.get('/supported-formats', authenticate(), authorizeRestaurantAccess(), async (req, res) => {
  try {
    const formats = [
      {
        type: 'CSV',
        extension: '.csv',
        description: 'Comma-separated values file',
        maxSize: '10MB',
        requiredColumns: [
          'item_number (or sku, code, id)',
          'name (or description, item_name, product_name)',
          'unit_price (or price, cost, rate)',
          'quantity (or qty, amount)',
          'business_date (or date, invoice_date)'
        ],
        optionalColumns: [
          'unit (or uom, unit_of_measure)',
          'vendor (or vendor_name, supplier)'
        ],
        example: 'item_number,name,unit_price,quantity,business_date\nTOMATO-001,Roma Tomatoes,45.00,2,2025-01-15'
      },
      {
        type: 'TXT',
        extension: '.txt',
        description: 'Plain text file with invoice data',
        maxSize: '10MB',
        supportedFormats: [
          'ITEM123 Product Name $10.50 x 2',
          'ITEM123,Product Name,10.50,2',
          'ITEM123 | Product Name | $10.50 | 2'
        ],
        requirements: [
          'Each line should contain item number, name, price, and quantity',
          'Vendor name can be specified in request body or detected from file content',
          'Date can be specified in request body or detected from file content'
        ]
      },
      {
        type: 'PDF',
        extension: '.pdf',
        description: 'PDF invoice document',
        maxSize: '10MB',
        status: 'Coming Soon',
        note: 'PDF parsing will be implemented in a future update'
      }
    ];

    res.json({
      success: true,
      data: {
        formats,
        globalRequirements: [
          'File must be under 10MB',
          'Vendor name must be provided or detectable from file',
          'Invoice date must be provided or detectable from file',
          'All items must have valid item numbers, names, prices, and quantities'
        ]
      },
      correlationId: (req as any).correlationId
    });

  } catch (error) {
    console.error('Error getting supported formats:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get supported formats',
        correlationId: (req as any).correlationId
      }
    });
  }
});

/**
 * GET /api/v1/invoice-import/health
 * Health check for invoice import service
 */
router.get('/health', authenticate(), authorizeRestaurantAccess(), async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        status: 'healthy',
        service: 'Invoice Import Service',
        timestamp: new Date().toISOString(),
        features: [
          'CSV file parsing',
          'TXT file parsing',
          'PDF file parsing (coming soon)',
          'Automatic vendor creation',
          'Price intelligence integration'
        ]
      },
      correlationId: (req as any).correlationId
    });

  } catch (error) {
    console.error('Error checking invoice import health:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to check invoice import health',
        correlationId: (req as any).correlationId
      }
    });
  }
});

export default router;
