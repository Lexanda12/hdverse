import { Request, Response, NextFunction } from 'express';
import { paymentsService } from './payments.service';
import { initiatePaymentSchema } from './payments.schema';
import { logger } from '../../shared/utils/logger';

export const paymentsController = {
  async initiatePayment(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const parsed = initiatePaymentSchema.safeParse({
        body: req.body,
      });

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
      const result = await paymentsService.initiatePayment(
        userId,
        parsed.data.body.workId
      );

      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async handleWebhook(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      // Paystack sends raw body — must be parsed as string
      const payload = JSON.stringify(req.body);
      const signature = req.headers['x-paystack-signature'] as string;

      const result = await paymentsService.handleWebhook(
        payload,
        signature ?? ''
      );

      // Always return 200 to Paystack immediately
      // Processing happens async
      return res.status(200).json(result);
    } catch (error: any) {
      // Even on error, return 200 to prevent Paystack retries
      // Log the error but don't surface it
      logger.error({ error }, 'Webhook handler error');
      return res.status(200).json({ received: true });
    }
  },

  async getPaymentHistory(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = (req as any).user.userId;
      const payments = await paymentsService.getPaymentHistory(userId);
      return res.status(200).json({ success: true, data: payments });
    } catch (error) {
      next(error);
    }
  },
};
