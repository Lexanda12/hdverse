import { Router } from 'express';
import { certificatesService } from './certificates.service';
import { requireAuth } from '../../shared/middleware/auth.middleware';
import { generatePresignedDownloadUrl } from '../../lib/s3';

const router = Router();

// Get certificate for a work (authenticated)
router.get(
  '/work/:workId',
  requireAuth,
  async (req, res, next) => {
    try {
      const userId = (req as any).user.userId;
      const cert = await certificatesService
        .getCertificateByWorkId(req.params.workId, userId);
      return res.status(200).json({ success: true, data: cert });
    } catch (error: any) {
      if (error.code && error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          error: { code: error.code, message: error.message },
        });
      }
      next(error);
    }
  }
);

// Download certificate PDF (authenticated)
router.get(
  '/work/:workId/download',
  requireAuth,
  async (req, res, next) => {
    try {
      const userId = (req as any).user.userId;
      const cert = await certificatesService
        .getCertificateByWorkId(req.params.workId, userId);

      const downloadUrl = await generatePresignedDownloadUrl(
        cert.s3Key,
        3600 // 1 hour for download
      );

      return res.status(200).json({
        success: true,
        data: { downloadUrl },
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
  }
);

// Public verification — NO auth required (spec version)
router.get(
  '/verify/:verificationId',
  async (req, res, next) => {
    try {
      const result = await certificatesService
        .verifyCertificatePublic(req.params.verificationId);
      
      // Match spec format AND add certificate nested object for frontend compatibility
      return res.status(200).json({
        success: true,
        data: {
          ...result,
          certificate: {
            certificateNumber: result.certificateNumber,
            issuedAt: result.issuedAt,
            verificationUrl: result.verificationUrl,
            work: {
              title: result.workTitle,
              artistName: result.artistName,
              isrc: result.isrc,
              fileHash: result.fileHash,
              timestampedAt: result.timestampedAt,
              fingerprintStatus: 'REGISTERED',
              status: 'ACTIVE',
            }
          }
        }
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
  }
);

// Fallback public verification — NO auth required (frontend client version)
router.get(
  '/:verificationId/verify',
  async (req, res, next) => {
    try {
      const result = await certificatesService
        .verifyCertificatePublic(req.params.verificationId);
      
      return res.status(200).json({
        success: true,
        data: {
          certificate: {
            id: req.params.verificationId,
            certificateNumber: result.certificateNumber,
            issuedAt: result.issuedAt.toISOString(),
            verificationUrl: result.verificationUrl,
            work: {
              title: result.workTitle,
              artistName: result.artistName,
              isrc: result.isrc,
              fileHash: result.fileHash,
              timestampedAt: result.timestampedAt ? result.timestampedAt.toISOString() : undefined,
              fingerprintStatus: 'REGISTERED',
              status: 'ACTIVE',
            }
          }
        }
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
  }
);

export default router;
