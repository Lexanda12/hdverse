import { Request, Response, NextFunction } from 'express';
import { worksService } from './works.service';
import { sendSuccess, sendError } from '../../shared/utils/api-response';

export class WorksController {
  async initiateUpload(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const result = await worksService.initiateUpload(userId, req.body);
      sendSuccess(res, result, 201);
    } catch (error: any) {
      if (error.code && error.statusCode) {
        sendError(res, error.code, error.message, error.statusCode);
        return;
      }
      next(error);
    }
  }

  async confirmUpload(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { workId } = req.params;
      const { fileHash } = req.body;
      const result = await worksService.confirmUpload(workId, userId, fileHash);
      sendSuccess(res, result, 200);
    } catch (error: any) {
      if (error.code && error.statusCode) {
        sendError(res, error.code, error.message, error.statusCode);
        return;
      }
      next(error);
    }
  }

  async getWork(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { workId } = req.params;
      const work = await worksService.getWork(workId, userId);
      sendSuccess(res, { work }, 200);
    } catch (error: any) {
      if (error.code && error.statusCode) {
        sendError(res, error.code, error.message, error.statusCode);
        return;
      }
      next(error);
    }
  }

  async listWorks(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const works = await worksService.listWorks(userId);
      sendSuccess(res, { works }, 200);
    } catch (error: any) {
      if (error.code && error.statusCode) {
        sendError(res, error.code, error.message, error.statusCode);
        return;
      }
      next(error);
    }
  }
}

export const worksController = new WorksController();
