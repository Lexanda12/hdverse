import { Router } from 'express';
import { worksController } from './works.controller';
import { validate } from '../../shared/middleware/validate';
import { requireAuth } from '../../shared/middleware/auth.middleware';
import { initiateUploadSchema, confirmUploadSchema } from './works.schema';

const router = Router();

// All works routes require authentication
router.use(requireAuth);

// POST /api/works/upload/initiate
router.post(
  '/upload/initiate',
  validate(initiateUploadSchema),
  worksController.initiateUpload.bind(worksController)
);

// POST /api/works/:workId/confirm
router.post(
  '/:workId/confirm',
  validate(confirmUploadSchema),
  worksController.confirmUpload.bind(worksController)
);

// GET /api/works
router.get(
  '/',
  worksController.listWorks.bind(worksController)
);

// GET /api/works/:workId
router.get(
  '/:workId',
  worksController.getWork.bind(worksController)
);

export default router;
