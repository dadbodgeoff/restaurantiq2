// src/infrastructure/web/routes/snapshots.ts
// DailySnapshot API Routes - Source of Truth endpoints

import { Router } from 'express';
import { authenticate, authorizeRestaurantAccess } from '../../../domains/auth/middleware/auth.middleware';
import { UserRole } from '../../../domains/shared/types/permissions';
import { BusinessRuleError } from '../../../lib/errors/specific-errors';
import { PrePData, SnapshotQuery } from '../../../domains/shared/types/snapshot';

const router = Router();

// ==========================================
// SNAPSHOT ENDPOINTS - SOURCE OF TRUTH API
// ==========================================

// POST /api/v1/snapshots/:restaurantId/:date/create
// Create a new daily snapshot from PREP data
router.post('/:restaurantId/:date/create',
  authenticate(),
  authorizeRestaurantAccess(),
  async (req, res, next) => {
    try {
      const { restaurantId, date } = req.params;
      const { prepData } = req.body;

      if (!prepData) {
        return next(new BusinessRuleError(
          'PREP data is required to create snapshot',
          req.correlationId,
          { restaurantId, date }
        ));
      }

      // Parse date parameter
      const snapshotDate = new Date(date);
      if (isNaN(snapshotDate.getTime())) {
        return next(new BusinessRuleError(
          'Invalid date format. Use YYYY-MM-DD',
          req.correlationId,
          { restaurantId, date, providedDate: date }
        ));
      }

      // Get services from container
      const snapshotService = req.container.resolve('dailySnapshotService') as any;

      // Create snapshot
      const snapshot = await snapshotService.createDailySnapshot(
        restaurantId,
        snapshotDate,
        prepData,
        req.user!.id,
        req.correlationId
      );

      res.status(201).json({
        success: true,
        data: {
          snapshot: {
            id: snapshot.id,
            snapshotDate: snapshot.snapshotDate,
            status: snapshot.status,
            version: snapshot.version,
            metadata: snapshot.metadata,
            createdAt: snapshot.createdAt,
          },
          message: 'Daily snapshot created successfully',
          nextStep: 'Use finalize endpoint when ready to lock the data'
        },
        correlationId: req.correlationId
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/snapshots/:snapshotId/finalize
// Finalize a snapshot (make it immutable source of truth)
router.post('/:snapshotId/finalize',
  authenticate(),
  async (req, res, next) => {
    try {
      const { snapshotId } = req.params;
      const { finalData } = req.body;

      // Get services from container
      const snapshotService = req.container.resolve('dailySnapshotService') as any;

      // Finalize snapshot
      const finalizedSnapshot = await snapshotService.finalizeSnapshot(
        snapshotId,
        req.user!.id,
        req.correlationId,
        finalData
      );

      res.json({
        success: true,
        data: {
          snapshot: {
            id: finalizedSnapshot.id,
            snapshotDate: finalizedSnapshot.snapshotDate,
            status: finalizedSnapshot.status,
            version: finalizedSnapshot.version,
            sha256: finalizedSnapshot.sha256,
            finalizedAt: finalizedSnapshot.finalizedAt,
            metadata: finalizedSnapshot.metadata,
          },
          message: 'Snapshot finalized successfully and is now the source of truth',
          note: 'This snapshot is now immutable and can be used for revenue calculations'
        },
        correlationId: req.correlationId
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/snapshots/:restaurantId/:date
// Get snapshot for specific date (D-1 sourcing)
router.get('/:restaurantId/:date',
  authenticate(),
  authorizeRestaurantAccess(),
  async (req, res, next) => {
    try {
      const { restaurantId, date } = req.params;

      // Parse date parameter
      const snapshotDate = new Date(date);
      if (isNaN(snapshotDate.getTime())) {
        return next(new BusinessRuleError(
          'Invalid date format. Use YYYY-MM-DD',
          req.correlationId,
          { restaurantId, date }
        ));
      }

      // Get services from container
      const snapshotService = req.container.resolve('dailySnapshotService') as any;

      // Get snapshot for date
      const snapshot = await snapshotService.getSnapshotForDate(
        restaurantId,
        snapshotDate,
        req.correlationId
      );

      if (!snapshot) {
        return res.status(404).json({
          success: false,
          data: null,
          error: {
            code: 'SNAPSHOT_NOT_FOUND',
            message: `No finalized snapshot found for date ${date}`,
            details: { restaurantId, date }
          },
          correlationId: req.correlationId
        });
      }

      return res.json({
        success: true,
        data: {
          snapshot: {
            id: snapshot.id,
            snapshotDate: snapshot.snapshotDate,
            status: snapshot.status,
            version: snapshot.version,
            sha256: snapshot.sha256,
            finalizedAt: snapshot.finalizedAt,
            metadata: snapshot.metadata,
            data: snapshot.data, // Complete PREP data for source of truth usage
          },
          integrity: {
            validated: true,
            hash: snapshot.sha256,
            lastValidated: new Date().toISOString()
          }
        },
        correlationId: req.correlationId
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/snapshots/:restaurantId/d1/:targetDate
// Get D-1 snapshot for revenue calculations (specialized endpoint)
router.get('/:restaurantId/d1/:targetDate',
  authenticate(),
  authorizeRestaurantAccess(),
  async (req, res, next) => {
    try {
      const { restaurantId, targetDate } = req.params;

      // Parse target date
      const targetDateObj = new Date(targetDate);
      if (isNaN(targetDateObj.getTime())) {
        throw new BusinessRuleError(
          'Invalid target date format. Use YYYY-MM-DD',
          req.correlationId,
          { restaurantId, targetDate }
        );
      }

      // Get services from container
      const snapshotService = req.container.resolve('dailySnapshotService') as any;

      // Get D-1 snapshot for revenue calculations
      const d1Snapshot = await snapshotService.getD1SnapshotForRevenue(
        restaurantId,
        targetDateObj,
        req.correlationId
      );

      // Calculate D-1 date for response
      const d1Date = new Date(targetDateObj);
      d1Date.setDate(d1Date.getDate() - 1);

      res.json({
        success: true,
        data: {
          snapshot: {
            id: d1Snapshot.id,
            snapshotDate: d1Snapshot.snapshotDate,
            status: d1Snapshot.status,
            version: d1Snapshot.version,
            sha256: d1Snapshot.sha256,
            finalizedAt: d1Snapshot.finalizedAt,
            metadata: d1Snapshot.metadata,
            data: d1Snapshot.data, // PREP data for revenue calculations
          },
          query: {
            targetDate: targetDate,
            d1Date: d1Date.toISOString().split('T')[0],
            restaurantId
          },
          integrity: {
            validated: true,
            hash: d1Snapshot.sha256,
            isSourceOfTruth: d1Snapshot.status === 'FINALIZED'
          }
        },
        correlationId: req.correlationId
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/snapshots/:restaurantId/history
// Get snapshot history for restaurant
router.get('/:restaurantId/history',
  authenticate(),
  authorizeRestaurantAccess(),
  async (req, res, next) => {
    try {
      const { restaurantId } = req.params;
      const { limit = '30', status } = req.query;

      const limitNum = parseInt(limit as string, 10);
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        return next(new BusinessRuleError(
          'Limit must be a number between 1 and 100',
          req.correlationId,
          { restaurantId, providedLimit: limit }
        ));
      }

      // Get services from container
      const snapshotService = req.container.resolve('dailySnapshotService') as any;

      // Query snapshots
      const query: SnapshotQuery = {
        restaurantId,
        limit: limitNum,
        ...(status && { status: status as any })
      };

      const snapshots = await snapshotService.querySnapshots(query, req.correlationId);

      return res.json({
        success: true,
        data: {
          snapshots: snapshots.map((snapshot: any) => ({
            id: snapshot.id,
            snapshotDate: snapshot.snapshotDate,
            status: snapshot.status,
            version: snapshot.version,
            sha256: snapshot.sha256,
            finalizedAt: snapshot.finalizedAt,
            metadata: snapshot.metadata,
            createdAt: snapshot.createdAt,
            updatedAt: snapshot.updatedAt,
          })),
          count: snapshots.length,
          query: {
            restaurantId,
            limit: limitNum,
            status: status || 'all',
          }
        },
        correlationId: req.correlationId
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/snapshots/:snapshotId
// Get specific snapshot details
router.get('/snapshot/:snapshotId',
  authenticate(),
  async (req, res, next) => {
    try {
      const { snapshotId } = req.params;

      // Get services from container
      const snapshotService = req.container.resolve('dailySnapshotService') as any;

      // Get snapshot by ID
      const snapshot = await snapshotService.snapshotRepository.findById(snapshotId);
      if (!snapshot) {
        return res.status(404).json({
          success: false,
          data: null,
          error: {
            code: 'SNAPSHOT_NOT_FOUND',
            message: `Snapshot not found: ${snapshotId}`,
            details: { snapshotId }
          },
          correlationId: req.correlationId
        });
      }

      // Validate user has access to restaurant
      if (snapshot.restaurantId !== req.user!.restaurantId) {
        return next(new BusinessRuleError(
          'Access denied: User does not belong to restaurant',
          req.correlationId,
          { snapshotId, userRestaurantId: req.user!.restaurantId, snapshotRestaurantId: snapshot.restaurantId }
        ));
      }

      return res.json({
        success: true,
        data: {
          snapshot: {
            id: snapshot.id,
            snapshotDate: snapshot.snapshotDate,
            status: snapshot.status,
            version: snapshot.version,
            sha256: snapshot.sha256,
            finalizedAt: snapshot.finalizedAt,
            metadata: snapshot.metadata,
            data: snapshot.data,
            createdAt: snapshot.createdAt,
            updatedAt: snapshot.updatedAt,
          }
        },
        correlationId: req.correlationId
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/v1/snapshots/:snapshotId
// Update snapshot data (only for DRAFT status)
router.put('/:snapshotId',
  authenticate(),
  async (req, res, next) => {
    try {
      const { snapshotId } = req.params;
      const { data } = req.body;

      if (!data) {
        throw new BusinessRuleError(
          'Snapshot data is required for update',
          req.correlationId,
          { snapshotId }
        );
      }

      // Get services from container
      const snapshotService = req.container.resolve('dailySnapshotService') as any;

      // Update snapshot data
      const updatedSnapshot = await snapshotService.updateSnapshotData(
        snapshotId,
        data,
        req.user!.id,
        req.correlationId
      );

      res.json({
        success: true,
        data: {
          snapshot: {
            id: updatedSnapshot.id,
            snapshotDate: updatedSnapshot.snapshotDate,
            status: updatedSnapshot.status,
            version: updatedSnapshot.version,
            metadata: updatedSnapshot.metadata,
            updatedAt: updatedSnapshot.updatedAt,
          },
          message: 'Snapshot updated successfully',
          warning: updatedSnapshot.status === 'DRAFT' ? 'Remember to finalize when ready' : null
        },
        correlationId: req.correlationId
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/snapshots/:snapshotId/validate
// Validate snapshot data integrity
router.post('/:snapshotId/validate',
  authenticate(),
  async (req, res, next) => {
    try {
      const { snapshotId } = req.params;

      // Get services from container
      const snapshotService = req.container.resolve('dailySnapshotService') as any;

      // Validate snapshot integrity
      const validationResult = await snapshotService.validateSnapshot(snapshotId, req.correlationId);

      res.json({
        success: true,
        data: {
          snapshotId,
          validation: validationResult,
          timestamp: new Date().toISOString(),
          validatedBy: req.user!.id
        },
        correlationId: req.correlationId
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/v1/snapshots/:snapshotId
// Delete snapshot (only for DRAFT status)
router.delete('/:snapshotId',
  authenticate(),
  async (req, res, next) => {
    try {
      const { snapshotId } = req.params;

      // Get services from container
      const snapshotRepository = req.container.resolve('dailySnapshotRepository') as any;

      // Delete snapshot (repository handles validation)
      await snapshotRepository.deleteSnapshot(snapshotId);

      res.json({
        success: true,
        data: {
          snapshotId,
          deleted: true,
          deletedAt: new Date().toISOString(),
          deletedBy: req.user!.id
        },
        correlationId: req.correlationId
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
