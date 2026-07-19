import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { sendSuccess, sendError } from '../../shared/utils/api-response';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.register(req.body);
      sendSuccess(res, { user }, 201);
    } catch (error: any) {
      if (error.code && error.statusCode) {
        sendError(res, error.code, error.message, error.statusCode);
        return;
      }
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);
      sendSuccess(res, result, 200);
    } catch (error: any) {
      if (error.code && error.statusCode) {
        sendError(res, error.code, error.message, error.statusCode);
        return;
      }
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshTokens(refreshToken);
      sendSuccess(res, result, 200);
    } catch (error: any) {
      if (error.code && error.statusCode) {
        sendError(res, error.code, error.message, error.statusCode);
        return;
      }
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
      sendSuccess(res, { message: 'Logged out successfully' }, 200);
    } catch (error: any) {
      next(error);
    }
  }

  async sendOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }
      const result = await authService.sendOtp(userId);
      sendSuccess(res, result, 200);
    } catch (error: any) {
      if (error.code && error.statusCode) {
        sendError(res, error.code, error.message, error.statusCode);
        return;
      }
      next(error);
    }
  }

  async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }
      const { otp } = req.body;
      const result = await authService.verifyOtp(userId, otp);
      sendSuccess(res, result, 200);
    } catch (error: any) {
      if (error.code && error.statusCode) {
        sendError(res, error.code, error.message, error.statusCode);
        return;
      }
      next(error);
    }
  }
}

export const authController = new AuthController();
