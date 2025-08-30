import { Router } from 'express';
import { authenticate, authorizeRestaurantAccess, requirePermission } from '../../../domains/auth/middleware/auth.middleware';
import { Permissions } from '../../../domains/shared/types/permissions';
import { PrepService } from '../../../domains/prep/services/prep.service';

const router = Router({ mergeParams: true });

// Middleware chain for all prep routes on a specific restaurant
router.use(authenticate());
router.use(authorizeRestaurantAccess());

// GET /api/v1/restaurants/:restaurantId/prep/:date
router.get('/:date', requirePermission(Permissions.PREP_READ), async (req, res) => {
  const { restaurantId } = req.params;
  const dateStr = req.params.date;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return res.status(400).json({ success: false, error: { code: 'INVALID_DATE', message: 'Invalid date', correlationId: req.correlationId } });
  }
  const prepService = (req as any).container.resolve('prepService') as PrepService;
  try {
    const items = await prepService.getPrepForDate(restaurantId, date);
    return res.json({ success: true, data: items, correlationId: req.correlationId });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: (err as Error).message, correlationId: req.correlationId } });
  }
});

// PUT /api/v1/restaurants/:restaurantId/prep/items/:itemId
router.put('/items/:itemId', requirePermission(Permissions.PREP_UPDATE), async (req, res) => {
  const { restaurantId, itemId } = req.params;

  // Input validation
  const { par, onHand, notes } = req.body;
  if (par !== undefined && (typeof par !== 'number' || par < 0)) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_PAR', message: 'Par must be a non-negative number', correlationId: req.correlationId }
    });
  }
  if (onHand !== undefined && (typeof onHand !== 'number' || onHand < 0)) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_ON_HAND', message: 'On hand must be a non-negative number', correlationId: req.correlationId }
    });
  }
  if (notes !== undefined && typeof notes !== 'string') {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_NOTES', message: 'Notes must be a string', correlationId: req.correlationId }
    });
  }

  const prepService = (req as any).container.resolve('prepService') as PrepService;
  try {
    const updated = await prepService.updatePrepItem(restaurantId, itemId, { par, onHand, notes });
    return res.json({ success: true, data: updated, correlationId: req.correlationId });
  } catch (err) {
    return res.status(400).json({ success: false, error: { code: 'UPDATE_FAILED', message: (err as Error).message, correlationId: req.correlationId } });
  }
});

// POST /api/v1/restaurants/:restaurantId/prep/:date/sync
router.post('/:date/sync', requirePermission(Permissions.PREP_SYNC), async (req, res) => {
  const { restaurantId } = req.params;
  const date = new Date(req.params.date);
  if (isNaN(date.getTime())) {
    return res.status(400).json({ success: false, error: { code: 'INVALID_DATE', message: 'Invalid date', correlationId: req.correlationId } });
  }
  const prepService = (req as any).container.resolve('prepService') as PrepService;
  try {
    const result = await prepService.syncFromMenu(restaurantId, date);
    return res.json({ success: true, data: result, correlationId: req.correlationId });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SYNC_FAILED', message: (err as Error).message, correlationId: req.correlationId } });
  }
});

// POST /api/v1/restaurants/:restaurantId/prep/presets/:dayOfWeek/save
router.post('/presets/:dayOfWeek/save', requirePermission(Permissions.PREP_UPDATE), async (req, res) => {
  const { restaurantId, dayOfWeek } = req.params;
  const { prepItems } = req.body;

  if (!prepItems || !Array.isArray(prepItems)) {
    return res.status(400).json({ 
      success: false, 
      error: { code: 'INVALID_PREP_ITEMS', message: 'prepItems array is required', correlationId: req.correlationId } 
    });
  }

  const validDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
  if (!validDays.includes(dayOfWeek)) {
    return res.status(400).json({ 
      success: false, 
      error: { code: 'INVALID_DAY', message: 'Invalid day of week', correlationId: req.correlationId } 
    });
  }

  try {
    const prisma = (req as any).container.resolve('databaseService').prisma;
    
    // Delete existing presets for this day
    await prisma.prepPreset.deleteMany({
      where: { restaurantId, dayOfWeek }
    });

    // Insert new presets
    const presets = prepItems.map((item: any) => ({
      restaurantId,
      dayOfWeek,
      menuItemId: item.menuItemId,
      presetPar: item.par || 0
    }));

    await prisma.prepPreset.createMany({
      data: presets
    });

    return res.json({ 
      success: true, 
      message: `Saved ${presets.length} presets for ${dayOfWeek}`,
      correlationId: req.correlationId 
    });
  } catch (err) {
    return res.status(500).json({ 
      success: false, 
      error: { code: 'SAVE_FAILED', message: (err as Error).message, correlationId: req.correlationId } 
    });
  }
});

// GET /api/v1/restaurants/:restaurantId/prep/presets/:dayOfWeek/load
router.get('/presets/:dayOfWeek/load', requirePermission(Permissions.PREP_READ), async (req, res) => {
  const { restaurantId, dayOfWeek } = req.params;

  const validDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
  if (!validDays.includes(dayOfWeek)) {
    return res.status(400).json({ 
      success: false, 
      error: { code: 'INVALID_DAY', message: 'Invalid day of week', correlationId: req.correlationId } 
    });
  }

  try {
    const prisma = (req as any).container.resolve('databaseService').prisma;
    
    const presets = await prisma.prepPreset.findMany({
      where: { restaurantId, dayOfWeek },
      include: {
        menuItem: {
          include: {
            category: true
          }
        }
      }
    });

    return res.json({ 
      success: true, 
      data: presets,
      correlationId: req.correlationId 
    });
  } catch (err) {
    return res.status(500).json({ 
      success: false, 
      error: { code: 'LOAD_FAILED', message: (err as Error).message, correlationId: req.correlationId } 
    });
  }
});

// POST /api/v1/restaurants/:restaurantId/prep/:date/finalize
router.post('/:date/finalize', requirePermission(Permissions.PREP_UPDATE), async (req, res) => {
  const { restaurantId } = req.params;
  const date = new Date(req.params.date);
  if (isNaN(date.getTime())) {
    return res.status(400).json({ 
      success: false, 
      error: { code: 'INVALID_DATE', message: 'Invalid date', correlationId: req.correlationId } 
    });
  }

  const { prepItems, notes } = req.body;

  if (!prepItems || !Array.isArray(prepItems)) {
    return res.status(400).json({ 
      success: false, 
      error: { code: 'INVALID_PREP_ITEMS', message: 'prepItems array is required', correlationId: req.correlationId } 
    });
  }

  try {
    const prisma = (req as any).container.resolve('databaseService').prisma;
    
    // Update all prep items with final values
    const updatePromises = prepItems.map((item: any) => {
      return prisma.prepItem.update({
        where: { id: item.id },
        data: {
          par: item.par,
          onHand: item.onHand,
          amountToPrep: Math.max(0, item.par - item.onHand),
          notes: item.notes || null,
          lastUpdated: new Date()
        }
      });
    });

    await Promise.all(updatePromises);

    // Log the finalization
    console.log(`[${new Date().toISOString()}] INFO: Prep list finalized for ${restaurantId} on ${date.toISOString().split('T')[0]} - ${prepItems.length} items`);

    return res.json({ 
      success: true, 
      message: `Finalized prep list for ${date.toISOString().split('T')[0]} with ${prepItems.length} items`,
      data: {
        date: date.toISOString().split('T')[0],
        itemCount: prepItems.length,
        finalizedAt: new Date().toISOString()
      },
      correlationId: req.correlationId 
    });
  } catch (err) {
    return res.status(500).json({ 
      success: false, 
      error: { code: 'FINALIZE_FAILED', message: (err as Error).message, correlationId: req.correlationId } 
    });
  }
});

export default router;


