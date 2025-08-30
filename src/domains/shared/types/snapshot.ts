// src/domains/shared/types/snapshot.ts
// DailySnapshot domain types - Source of Truth for restaurant data

export type SnapshotStatus = 'DRAFT' | 'PENDING' | 'FINALIZED' | 'CORRUPTED';

export interface DailySnapshot {
  id: string;
  snapshotDate: Date;
  status: SnapshotStatus;
  version: number;
  sha256?: string;
  metadata: SnapshotMetadata;
  data: PrePData;
  finalizedAt?: Date;
  restaurantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SnapshotMetadata {
  createdBy: string;
  finalizedBy?: string;
  prepFinalizationTime: string;
  menuVersion: string;
  totalItems: number;
  totalValue: number;
  integrityHash: string;
  businessDate: Date;
  timezone: string;
  correlationId: string;
}

export interface PrePData {
  items: PrePItem[];
  summary: PrePSummary;
  categories: string[];
  lastModified: string; // Date serialized as ISO string for JSON compatibility
  version: string;
  [key: string]: any; // Index signature for Prisma JSON compatibility
}

export interface PrePItem {
  id: string;
  menuItemId: string;
  name: string;
  category: string;
  unit: string;
  par: number;
  onHand: number;
  amountToPrep: number;
  status: PrePStatus;
  notes?: string;
  estimatedValue?: number;
  lastUpdated: string; // Date serialized as ISO string for JSON compatibility
}

export interface PrePSummary {
  totalItems: number;
  totalValue: number;
  itemsNeedingPrep: number;
  categoriesCount: number;
  lastCalculation: string; // Date serialized as ISO string for JSON compatibility
}

export type PrePStatus = 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK';

export interface CreateSnapshotData {
  restaurantId: string;
  snapshotDate: Date;
  prepData: PrePData;
  createdBy: string;
  correlationId: string;
  businessDate: Date;
  timezone: string;
}

export interface FinalizeSnapshotData {
  snapshotId: string;
  finalizedBy: string;
  correlationId: string;
  finalData?: PrePData;
}

export interface SnapshotValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  hash?: string;
}

export interface SnapshotQuery {
  restaurantId: string;
  date?: Date;
  status?: SnapshotStatus;
  limit?: number;
  offset?: number;
}

export interface SnapshotConflict {
  snapshotId: string;
  expectedVersion: number;
  actualVersion: number;
  conflictingFields: string[];
  lastModifiedBy: string;
  lastModifiedAt: Date;
}

// Domain events for snapshot lifecycle
export const SnapshotEventTypes = {
  SNAPSHOT_CREATED: 'snapshot.created',
  SNAPSHOT_FINALIZED: 'snapshot.finalized',
  SNAPSHOT_CORRUPTED: 'snapshot.corrupted',
  SNAPSHOT_VALIDATED: 'snapshot.validated',
  SNAPSHOT_CONFLICT: 'snapshot.conflict',
} as const;

export type SnapshotEventType = typeof SnapshotEventTypes[keyof typeof SnapshotEventTypes];

// Event data interfaces
export interface SnapshotCreatedEventData {
  snapshotId: string;
  restaurantId: string;
  snapshotDate: Date;
  status: SnapshotStatus;
  createdBy: string;
  version: number;
}

export interface SnapshotFinalizedEventData {
  snapshotId: string;
  restaurantId: string;
  finalizedBy: string;
  finalHash: string;
  finalizedAt: Date;
  version: number;
}

export interface SnapshotConflictEventData {
  snapshotId: string;
  restaurantId: string;
  expectedVersion: number;
  actualVersion: number;
  userId: string;
  conflictingFields: string[];
}
