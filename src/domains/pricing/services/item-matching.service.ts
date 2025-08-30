// SIMPLE BUT EFFECTIVE Item Matching Service
// Fuzzy matching for cross-vendor price comparison (4th tracker)

import { PrismaClient } from '@prisma/client';
import { BaseRepository } from '../../shared/base-repository';
import { LoggerService } from '../../../infrastructure/logging/logger.service';

interface ItemMatchResult {
  masterId: string;
  masterName: string;
  confidence: number;
  reason: string;
}

interface FuzzyMatchCandidate {
  id: string;
  name: string;
  unit: string;
  category?: string;
  similarity: number;
}

export class ItemMatchingService extends BaseRepository {
  private logger: LoggerService;

  constructor(prisma: PrismaClient, logger: LoggerService) {
    super(prisma);
    this.logger = logger;
  }

  /**
   * Find or create ItemMaster for a VendorItem
   * Uses simple but effective fuzzy matching
   */
  async findOrCreateItemMaster(
    restaurantId: string,
    vendorId: string,
    itemNumber: string,
    itemName: string,
    unit: string,
    category?: string
  ): Promise<string> {
    this.validateRequiredString(restaurantId, 'Restaurant ID');
    this.validateRequiredString(itemName, 'Item Name');

    return this.executeQuery(async () => {
      this.logOperation('findOrCreateItemMaster', { 
        restaurantId, vendorId, itemNumber, itemName, unit, category 
      });

      // Step 1: Try exact name match first (fastest)
      const exactMatch = await this.prisma.itemMaster.findFirst({
        where: {
          restaurantId,
          masterName: itemName
        }
      });

      if (exactMatch) {
        this.logger.info('findOrCreateItemMaster', 'Exact match found', { 
          masterId: exactMatch.id, masterName: exactMatch.masterName 
        });
        return exactMatch.id;
      }

      // Step 2: Try fuzzy matching against existing masters
      const fuzzyMatch = await this.findBestFuzzyMatch(restaurantId, itemName, unit, category);
      
      if (fuzzyMatch && fuzzyMatch.confidence >= 0.85) { // 85% confidence threshold
        this.logger.info('findOrCreateItemMaster', 'Fuzzy match found', {
          masterId: fuzzyMatch.masterId,
          masterName: fuzzyMatch.masterName,
          confidence: fuzzyMatch.confidence,
          reason: fuzzyMatch.reason
        });
        return fuzzyMatch.masterId;
      }

      // Step 3: Create new master (no good match found)
      const newMaster = await this.prisma.itemMaster.create({
        data: {
          restaurantId,
          masterName: this.cleanItemName(itemName),
          category: category || this.guessCategory(itemName),
          unit: unit || 'each',
          description: `Auto-created from ${itemName}`
        }
      });

      this.logger.info('findOrCreateItemMaster', 'New master created', {
        masterId: newMaster.id,
        masterName: newMaster.masterName
      });

      return newMaster.id;

    }, 'findOrCreateItemMaster');
  }

  /**
   * Simple but effective fuzzy matching
   * Checks: name similarity, unit matching, category matching
   */
  private async findBestFuzzyMatch(
    restaurantId: string,
    itemName: string,
    unit: string,
    category?: string
  ): Promise<ItemMatchResult | null> {
    
    // Get all existing masters for this restaurant
    const existingMasters = await this.prisma.itemMaster.findMany({
      where: { restaurantId },
      select: { id: true, masterName: true, unit: true, category: true }
    });

    if (existingMasters.length === 0) {
      return null;
    }

    const cleanItemName = this.cleanItemName(itemName);
    let bestMatch: ItemMatchResult | null = null;
    let bestScore = 0;

    for (const master of existingMasters) {
      const cleanMasterName = this.cleanItemName(master.masterName);
      
      // Calculate similarity score
      const nameSimilarity = this.calculateStringSimilarity(cleanItemName, cleanMasterName);
      const unitMatch = this.normalizeUnit(unit) === this.normalizeUnit(master.unit || '');
      const categoryMatch = category && master.category ? 
        category.toLowerCase() === master.category.toLowerCase() : false;

      // Weighted scoring (name is most important)
      let totalScore = nameSimilarity * 0.7; // 70% weight on name
      if (unitMatch) totalScore += 0.2;      // 20% weight on unit
      if (categoryMatch) totalScore += 0.1;  // 10% weight on category

      if (totalScore > bestScore && totalScore >= 0.8) { // 80% minimum threshold
        bestScore = totalScore;
        bestMatch = {
          masterId: master.id,
          masterName: master.masterName,
          confidence: totalScore,
          reason: this.buildMatchReason(nameSimilarity, unitMatch, categoryMatch)
        };
      }
    }

    return bestMatch;
  }

  /**
   * Simple string similarity using Jaro-Winkler-like algorithm
   * Good for fuzzy matching without external dependencies
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1.0;
    if (str1.length === 0 || str2.length === 0) return 0.0;

    // Convert to lowercase and split into words
    const words1 = str1.toLowerCase().split(/\s+/);
    const words2 = str2.toLowerCase().split(/\s+/);

    // Check for exact word matches
    let matchingWords = 0;
    let totalWords = Math.max(words1.length, words2.length);

    for (const word1 of words1) {
      if (words2.some(word2 => word2.includes(word1) || word1.includes(word2))) {
        matchingWords++;
      }
    }

    // Basic similarity based on word overlap
    const wordSimilarity = matchingWords / totalWords;

    // Also check character-level similarity for things like "25lb" vs "25 lb"
    const charSimilarity = this.calculateLevenshteinSimilarity(str1, str2);

    // Return the better of the two scores
    return Math.max(wordSimilarity, charSimilarity);
  }

  /**
   * Levenshtein distance for character-level similarity
   */
  private calculateLevenshteinSimilarity(str1: string, str2: string): number {
    const a = str1.toLowerCase();
    const b = str2.toLowerCase();
    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    const maxLength = Math.max(a.length, b.length);
    return maxLength === 0 ? 1 : (maxLength - matrix[b.length][a.length]) / maxLength;
  }

  /**
   * Clean item names for better matching
   */
  private cleanItemName(name: string): string {
    return name
      .replace(/[^\w\s]/g, ' ')  // Remove special characters
      .replace(/\s+/g, ' ')      // Normalize whitespace
      .trim()
      .toLowerCase();
  }

  /**
   * Normalize units for matching (case, case vs cs, lb vs pound, etc.)
   */
  private normalizeUnit(unit: string): string {
    const normalized = unit.toLowerCase().trim();
    
    // Common unit normalizations
    const unitMap: { [key: string]: string } = {
      'case': 'case',
      'cs': 'case',
      'cases': 'case',
      'lb': 'pound',
      'lbs': 'pound',
      'pound': 'pound',
      'pounds': 'pound',
      'oz': 'ounce',
      'ounce': 'ounce',
      'ounces': 'ounce',
      'kg': 'kilogram',
      'kilogram': 'kilogram',
      'each': 'each',
      'ea': 'each',
      'piece': 'each',
      'pcs': 'each'
    };

    return unitMap[normalized] || normalized;
  }

  /**
   * Simple category guessing based on item name keywords
   */
  private guessCategory(itemName: string): string {
    const name = itemName.toLowerCase();
    
    if (name.includes('tomato') || name.includes('onion') || name.includes('pepper') || 
        name.includes('lettuce') || name.includes('carrot') || name.includes('potato')) {
      return 'Vegetables';
    }
    
    if (name.includes('chicken') || name.includes('beef') || name.includes('pork') || 
        name.includes('turkey') || name.includes('meat')) {
      return 'Proteins';
    }
    
    if (name.includes('salmon') || name.includes('fish') || name.includes('shrimp') || 
        name.includes('seafood') || name.includes('tuna')) {
      return 'Seafood';
    }
    
    if (name.includes('cheese') || name.includes('milk') || name.includes('cream') || 
        name.includes('butter') || name.includes('dairy')) {
      return 'Dairy';
    }
    
    if (name.includes('flour') || name.includes('bread') || name.includes('rice') || 
        name.includes('grain') || name.includes('pasta')) {
      return 'Grains';
    }
    
    if (name.includes('oil') || name.includes('vinegar') || name.includes('sauce') || 
        name.includes('spice') || name.includes('pepper') || name.includes('salt')) {
      return 'Condiments';
    }
    
    return 'Other';
  }

  /**
   * Build human-readable match reason
   */
  private buildMatchReason(nameSimilarity: number, unitMatch: boolean, categoryMatch: boolean): string {
    const reasons = [];
    
    if (nameSimilarity > 0.9) reasons.push('very similar name');
    else if (nameSimilarity > 0.7) reasons.push('similar name');
    
    if (unitMatch) reasons.push('same unit');
    if (categoryMatch) reasons.push('same category');
    
    return reasons.join(', ') || 'basic similarity';
  }

  /**
   * Update cross-vendor statistics for an ItemMaster
   * This populates the 4th tracker (best price across vendors)
   */
  async updateCrossVendorStats(restaurantId: string, itemMasterId: string): Promise<void> {
    this.validateRequiredString(restaurantId, 'Restaurant ID');
    this.validateRequiredString(itemMasterId, 'Item Master ID');

    return this.executeQuery(async () => {
      this.logOperation('updateCrossVendorStats', { restaurantId, itemMasterId });

      // Get all vendor items linked to this master
      const vendorItems = await this.prisma.vendorItem.findMany({
        where: {
          restaurantId,
          itemMasterId
        },
        include: {
          vendor: true,
          stats: true
        }
      });

      if (vendorItems.length === 0) {
        this.logger.info('updateCrossVendorStats', 'No vendor items found for master', { itemMasterId });
        return;
      }

      // Find the best current price across all vendors
      let bestPrice: number | null = null;
      let bestVendorName: string | null = null;

      for (const vendorItem of vendorItems) {
        const stats = vendorItem.stats;
        if (stats && stats.lastPaidPrice && stats.lastPaidPrice > 0) {
          if (bestPrice === null || stats.lastPaidPrice < bestPrice) {
            bestPrice = stats.lastPaidPrice;
            bestVendorName = vendorItem.vendor.name;
          }
        }
      }

      // Update all vendor item stats with cross-vendor comparison
      if (bestPrice !== null && bestVendorName !== null) {
        for (const vendorItem of vendorItems) {
          if (vendorItem.stats) {
            const currentPrice = vendorItem.stats.lastPaidPrice || 0;
            const diffVsBestPct = currentPrice > 0 && bestPrice > 0 ? 
              ((currentPrice - bestPrice) / bestPrice) * 100 : 0;

            await this.prisma.vendorItemStats.update({
              where: { id: vendorItem.stats.id },
              data: {
                bestPriceAcrossVendors: bestPrice,
                bestVendorName: bestVendorName,
                diffVsBestPct: diffVsBestPct
              }
            });
          }
        }

        this.logger.info('updateCrossVendorStats', 'Cross-vendor stats updated', {
          itemMasterId,
          vendorCount: vendorItems.length,
          bestPrice,
          bestVendorName
        });
      }

    }, 'updateCrossVendorStats');
  }
}
