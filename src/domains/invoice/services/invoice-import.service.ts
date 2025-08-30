import { LoggerService } from '../../../infrastructure/logging/logger.service';
import { PriceIngestionService } from '../../pricing/services/price-ingestion.service';
import { VendorRepository } from '../../pricing/repositories/vendor.repository';
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'csv-parser';
import { createReadStream } from 'fs';

export interface InvoiceLine {
  itemNumber: string;
  name: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  businessDate: string;
}

export interface ParsedInvoice {
  vendorName: string;
  invoiceNumber?: string;
  invoiceDate: string;
  lines: InvoiceLine[];
}

export interface ImportResult {
  success: boolean;
  vendorId: string;
  vendorName: string;
  processedLines: number;
  errors: string[];
  results: Array<{
    itemNumber: string;
    name: string;
    status: 'processed' | 'error';
    error?: string;
  }>;
}

export class InvoiceImportService {
  constructor(
    private priceIngestionService: PriceIngestionService,
    private vendorRepository: VendorRepository,
    private logger: LoggerService
  ) {}

  /**
   * Import invoice from file and process through price intelligence
   */
  async importInvoiceFromFile(
    restaurantId: string,
    filePath: string,
    vendorName?: string,
    invoiceDate?: string
  ): Promise<ImportResult> {
    try {
      this.logger.info('importInvoiceFromFile', 'Starting invoice import', {
        restaurantId,
        filePath,
        vendorName,
        invoiceDate
      });

      // Detect file type and parse
      const fileExtension = path.extname(filePath).toLowerCase();
      let parsedInvoice: ParsedInvoice;

      switch (fileExtension) {
        case '.csv':
          parsedInvoice = await this.parseCSV(filePath, vendorName, invoiceDate);
          break;
        case '.pdf':
          parsedInvoice = await this.parsePDF(filePath, vendorName, invoiceDate);
          break;
        case '.txt':
          parsedInvoice = await this.parseTXT(filePath, vendorName, invoiceDate);
          break;
        default:
          throw new Error(`Unsupported file type: ${fileExtension}`);
      }

      // Process the parsed invoice
      return await this.processParsedInvoice(restaurantId, parsedInvoice);

    } catch (error) {
      this.logger.error('importInvoiceFromFile', error as Error, {
        restaurantId,
        filePath,
        vendorName,
        invoiceDate
      });
      throw error;
    }
  }

  /**
   * Parse CSV invoice file
   */
  private async parseCSV(
    filePath: string,
    vendorName?: string,
    invoiceDate?: string
  ): Promise<ParsedInvoice> {
    return new Promise((resolve, reject) => {
      const lines: InvoiceLine[] = [];
      let detectedVendorName = vendorName;
      let detectedInvoiceDate = invoiceDate;

      createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          // Try to detect vendor name and invoice date from CSV headers
          if (!detectedVendorName && row.vendor) detectedVendorName = row.vendor;
          if (!detectedVendorName && row.vendor_name) detectedVendorName = row.vendor_name;
          if (!detectedVendorName && row.supplier) detectedVendorName = row.supplier;
          
          if (!detectedInvoiceDate && row.date) detectedInvoiceDate = row.date;
          if (!detectedInvoiceDate && row.invoice_date) detectedInvoiceDate = row.invoice_date;
          if (!detectedInvoiceDate && row.business_date) detectedInvoiceDate = row.business_date;

          // Parse invoice line
          const line = this.parseCSVLine(row);
          if (line) {
            lines.push(line);
          }
        })
        .on('end', () => {
          if (!detectedVendorName) {
            reject(new Error('Vendor name not found in CSV and not provided'));
            return;
          }

          if (!detectedInvoiceDate) {
            reject(new Error('Invoice date not found in CSV and not provided'));
            return;
          }

          resolve({
            vendorName: detectedVendorName,
            invoiceDate: detectedInvoiceDate,
            lines
          });
        })
        .on('error', reject);
    });
  }

  /**
   * Parse a single CSV line into InvoiceLine format
   */
  private parseCSVLine(row: any): InvoiceLine | null {
    try {
      // Try different possible column names
      const itemNumber = row.item_number || row.itemNumber || row.sku || row.code || row.id;
      const name = row.name || row.description || row.item_name || row.product_name;
      const unit = row.unit || row.uom || row.unit_of_measure || 'unit';
      const unitPrice = parseFloat(row.unit_price || row.price || row.cost || row.rate);
      const quantity = parseFloat(row.quantity || row.qty || row.amount || '1');
      const businessDate = row.business_date || row.date || row.invoice_date;

      if (!itemNumber || !name || isNaN(unitPrice) || isNaN(quantity) || !businessDate) {
        this.logger.warn('parseCSVLine', 'Skipping invalid CSV line', { row });
        return null;
      }

      return {
        itemNumber: itemNumber.toString().trim(),
        name: name.toString().trim(),
        unit: unit.toString().trim(),
        unitPrice,
        quantity,
        businessDate: this.normalizeDate(businessDate)
      };
    } catch (error) {
      this.logger.warn('parseCSVLine', 'Error parsing CSV line', { row, error });
      return null;
    }
  }

  /**
   * Parse PDF invoice file (basic text extraction)
   */
  private async parsePDF(
    filePath: string,
    vendorName?: string,
    invoiceDate?: string
  ): Promise<ParsedInvoice> {
    // For now, we'll implement basic PDF text extraction
    // In production, you might want to use a more sophisticated PDF parser
    throw new Error('PDF parsing not yet implemented');
  }

  /**
   * Parse TXT invoice file
   */
  private async parseTXT(
    filePath: string,
    vendorName?: string,
    invoiceDate?: string
  ): Promise<ParsedInvoice> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    
    const invoiceLines: InvoiceLine[] = [];
    let detectedVendorName = vendorName;
    let detectedInvoiceDate = invoiceDate;

    for (const line of lines) {
      // Try to detect vendor and date from text patterns
      if (!detectedVendorName) {
        const vendorMatch = line.match(/vendor[:\s]+(.+)/i) || 
                           line.match(/supplier[:\s]+(.+)/i) ||
                           line.match(/from[:\s]+(.+)/i);
        if (vendorMatch) detectedVendorName = vendorMatch[1].trim();
      }

      if (!detectedInvoiceDate) {
        const dateMatch = line.match(/date[:\s]+(\d{4}-\d{2}-\d{2})/i) ||
                         line.match(/(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) detectedInvoiceDate = dateMatch[1];
      }

      // Parse invoice line (basic pattern matching)
      const lineData = this.parseTXTLine(line);
      if (lineData) {
        invoiceLines.push(lineData);
      }
    }

    if (!detectedVendorName) {
      throw new Error('Vendor name not found in TXT and not provided');
    }

    if (!detectedInvoiceDate) {
      throw new Error('Invoice date not found in TXT and not provided');
    }

    return {
      vendorName: detectedVendorName,
      invoiceDate: detectedInvoiceDate,
      lines: invoiceLines
    };
  }

  /**
   * Parse a single TXT line into InvoiceLine format
   */
  private parseTXTLine(line: string): InvoiceLine | null {
    try {
      // Basic pattern matching for common invoice line formats
      // This is a simplified parser - in production you'd want more sophisticated parsing
      const patterns = [
        // Pattern: "ITEM123 Product Name $10.50 x 2"
        /(\w+)\s+(.+?)\s+\$?(\d+\.?\d*)\s*[xX]\s*(\d+\.?\d*)/,
        // Pattern: "ITEM123,Product Name,10.50,2"
        /(\w+),(.+?),(\d+\.?\d*),(\d+\.?\d*)/,
        // Pattern: "ITEM123 | Product Name | $10.50 | 2"
        /(\w+)\s*\|\s*(.+?)\s*\|\s*\$?(\d+\.?\d*)\s*\|\s*(\d+\.?\d*)/
      ];

      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match) {
          const [, itemNumber, name, unitPrice, quantity] = match;
          return {
            itemNumber: itemNumber.trim(),
            name: name.trim(),
            unit: 'unit', // Default unit
            unitPrice: parseFloat(unitPrice),
            quantity: parseFloat(quantity),
            businessDate: new Date().toISOString().split('T')[0] // Default to today
          };
        }
      }

      return null;
    } catch (error) {
      this.logger.warn('parseTXTLine', 'Error parsing TXT line', { line, error });
      return null;
    }
  }

  /**
   * Process parsed invoice through price intelligence
   */
  private async processParsedInvoice(
    restaurantId: string,
    parsedInvoice: ParsedInvoice
  ): Promise<ImportResult> {
    try {
      // Find or create vendor
      const vendor = await this.vendorRepository.findOrCreateByName(
        restaurantId,
        parsedInvoice.vendorName
      );

      const results: ImportResult['results'] = [];
      const errors: string[] = [];

      // Process each line through price intelligence
      for (const line of parsedInvoice.lines) {
        try {
          await this.priceIngestionService.recordLine({
            restaurantId,
            vendorId: vendor.id,
            itemNumber: line.itemNumber,
            name: line.name,
            unit: line.unit,
            unitPrice: line.unitPrice,
            quantity: line.quantity,
            businessDate: line.businessDate
          });

          results.push({
            itemNumber: line.itemNumber,
            name: line.name,
            status: 'processed'
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          errors.push(`Line ${line.itemNumber}: ${errorMessage}`);
          results.push({
            itemNumber: line.itemNumber,
            name: line.name,
            status: 'error',
            error: errorMessage
          });
        }
      }

      return {
        success: errors.length === 0,
        vendorId: vendor.id,
        vendorName: vendor.name,
        processedLines: results.filter(r => r.status === 'processed').length,
        errors,
        results
      };

    } catch (error) {
      this.logger.error('processParsedInvoice', error as Error, {
        restaurantId,
        vendorName: parsedInvoice.vendorName
      });
      throw error;
    }
  }

  /**
   * Normalize date to YYYY-MM-DD format
   */
  private normalizeDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch (error) {
      this.logger.warn('normalizeDate', 'Error normalizing date', { dateString, error });
      return new Date().toISOString().split('T')[0]; // Default to today
    }
  }
}
