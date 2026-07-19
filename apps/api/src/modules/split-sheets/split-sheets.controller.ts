import { Request, Response, NextFunction } from 'express';
import { splitSheetsService } from './split-sheets.service';
import { 
  createSplitSheetSchema, 
  confirmSplitSchema 
} from './split-sheets.schema';

export const splitSheetsController = {
  async createSplitSheet(
    req: Request, res: Response, next: NextFunction
  ) {
    try {
      const parsed = createSplitSheetSchema.safeParse({ 
        body: req.body 
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
      const result = await splitSheetsService.createSplitSheet(
        userId, parsed.data.body
      );
      return res.status(201).json({ success: true, data: result });
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

  async getSplitSheet(
    req: Request, res: Response, next: NextFunction
  ) {
    try {
      const userId = (req as any).user.userId;
      const result = await splitSheetsService.getSplitSheet(
        req.params.workId, userId
      );
      return res.status(200).json({ success: true, data: result });
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

  async confirmSplitEntry(
    req: Request, res: Response, next: NextFunction
  ) {
    try {
      const parsed = confirmSplitSchema.safeParse({
        params: req.params,
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
      const result = await splitSheetsService.confirmSplitEntry(
        parsed.data.params.token,
        parsed.data.body.action
      );
      return res.status(200).json({ success: true, data: result });
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

  async checkDistributionEligibility(
    req: Request, res: Response, next: NextFunction
  ) {
    try {
      const result = await splitSheetsService
        .isEligibleForDistribution(req.params.workId);
      return res.status(200).json({ success: true, data: result });
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
