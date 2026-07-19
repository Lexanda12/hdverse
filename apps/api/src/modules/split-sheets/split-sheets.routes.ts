import { Router } from 'express';
import { splitSheetsController } from './split-sheets.controller';
import { requireAuth } from '../../shared/middleware/auth.middleware';

const router = Router();

// Create split sheet for a work
router.post(
  '/',
  requireAuth,
  splitSheetsController.createSplitSheet
);

// Get split sheet for a work
router.get(
  '/work/:workId',
  requireAuth,
  splitSheetsController.getSplitSheet
);

// Check distribution eligibility
router.get(
  '/work/:workId/distribution-check',
  requireAuth,
  splitSheetsController.checkDistributionEligibility
);

// Confirm or decline a split entry (NO auth — 
// collaborators may not have accounts)
router.post(
  '/confirm/:token',
  splitSheetsController.confirmSplitEntry
);

export default router;
