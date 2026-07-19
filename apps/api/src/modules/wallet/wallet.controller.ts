import { Request, Response, NextFunction } from 'express';
import { walletService } from './wallet.service';
import { z } from 'zod';

const payoutSchema = z.object({
  amount: z.number()
    .positive()
    .min(1000, 'Minimum payout is ₦1,000'),
  bankCode: z.string().min(1, 'Bank code required'),
  accountNumber: z.string()
    .length(10, 'Account number must be 10 digits'),
  accountName: z.string().min(1, 'Account name required'),
});

const resolveAccountSchema = z.object({
  accountNumber: z.string().length(10),
  bankCode: z.string().min(1),
});

export const walletController = {
  async getWallet(
    req: Request, res: Response, next: NextFunction
  ) {
    try {
      const userId = (req as any).user.userId;
      const wallet = await walletService.getWallet(userId);
      return res.status(200).json({ 
        success: true, data: wallet 
      });
    } catch (error: any) {
      if (error.code && error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          error: { code: error.code, message: error.message },
        });
      }
      next(error);
    }
  },

  async requestPayout(
    req: Request, res: Response, next: NextFunction
  ) {
    try {
      const parsed = payoutSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.errors[0].message,
          },
        });
      }
      const userId = (req as any).user.userId;
      const result = await walletService.requestPayout(
        userId, parsed.data
      );
      return res.status(200).json({ 
        success: true, data: result 
      });
    } catch (error: any) {
      if (error.code && error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          error: { code: error.code, message: error.message },
        });
      }
      next(error);
    }
  },

  async handleTransferWebhook(
    req: Request, res: Response, next: NextFunction
  ) {
    try {
      const payload = JSON.stringify(req.body);
      const signature = 
        req.headers['x-paystack-signature'] as string;
      const result = await walletService
        .handleTransferWebhook(payload, signature ?? '');
      return res.status(200).json(result);
    } catch (error) {
      return res.status(200).json({ received: true });
    }
  },

  async getBanks(
    req: Request, res: Response, next: NextFunction
  ) {
    try {
      const { paystack } = await import('../../lib/paystack');
      const banks = await paystack.getBanks();
      return res.status(200).json({ 
        success: true, data: banks 
      });
    } catch (error: any) {
      if (error.code && error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          error: { code: error.code, message: error.message },
        });
      }
      next(error);
    }
  },

  async resolveAccount(
    req: Request, res: Response, next: NextFunction
  ) {
    try {
      const parsed = resolveAccountSchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.errors[0].message,
          },
        });
      }
      const { paystack } = await import('../../lib/paystack');
      const result = await paystack.resolveAccountNumber(
        parsed.data
      );
      return res.status(200).json({ 
        success: true, data: result 
      });
    } catch (error: any) {
      if (error.code && error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          error: { code: error.code, message: error.message },
        });
      }
      next(error);
    }
  },
};
