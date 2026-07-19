import { Router } from 'express';
import { walletController } from './wallet.controller';
import { requireAuth } from '../../shared/middleware/auth.middleware';

const router = Router();

// Get wallet balance + transaction history
router.get('/', requireAuth, walletController.getWallet);

// Request a payout
router.post(
  '/payout', 
  requireAuth, 
  walletController.requestPayout
);

// Paystack transfer webhook (no auth)
router.post(
  '/webhook/transfer',
  walletController.handleTransferWebhook
);

// Get Nigerian bank list
router.get('/banks', requireAuth, walletController.getBanks);

// Resolve account number to name
// (call before payout to confirm account)
router.get(
  '/resolve-account',
  requireAuth,
  walletController.resolveAccount
);

export default router;
