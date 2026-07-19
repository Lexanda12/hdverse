import { Router } from 'express';
import { paymentsController } from './payments.controller';
import { requireAuth } from '../../shared/middleware/auth.middleware';

const router = Router();

// Initiate payment for a certificate
// Requires auth + KYC
router.post(
  '/initiate',
  requireAuth,
  paymentsController.initiatePayment
);

// Paystack webhook — NO auth middleware
// Paystack calls this directly with its own signature
router.post(
  '/webhook',
  paymentsController.handleWebhook
);

// Payment history for logged-in user
router.get(
  '/history',
  requireAuth,
  paymentsController.getPaymentHistory
);

export default router;
