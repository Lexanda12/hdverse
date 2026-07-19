import { Router, Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { sendDetectionAlertEmail } from '../../lib/email';
import { logger } from '../../shared/utils/logger';
import { sendSuccess } from '../../shared/utils/api-response';
import { requireAuth } from '../../shared/middleware/auth.middleware';

const router = Router();

/**
 * POST /api/detection/webhook
 * Called by ACRCloud when a fingerprint match is found in the wild.
 * Creates a DetectionAlert record and emails the creator.
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const body = req.body;

    // ACRCloud sends: external_id (our workId), platform, confidence, etc.
    const workId = body.external_id || body.acr_id;
    const platform = body.platform || body.channel || 'Unknown Platform';
    const matchConfidence = body.score?.toString() || body.confidence || 'High';
    const sourceUrl = body.stream_url || body.play_url || undefined;

    if (!workId) {
      res.status(400).json({ error: 'Missing workId' });
      return;
    }

    // Find the work and its owner
    const work = await prisma.work.findFirst({
      where: { id: workId },
      include: {
        user: { select: { email: true, fullName: true } },
        certificate: true,
      },
    });

    if (!work) {
      logger.warn({ workId }, 'Detection webhook: work not found');
      res.status(404).json({ error: 'Work not found' });
      return;
    }

    // Create detection alert record
    const alert = await prisma.detectionAlert.create({
      data: {
        workId,
        platform,
        detectedAt: new Date(),
        matchConfidence,
        sourceUrl,
        rawResponse: body,
        status: 'NEW',
      },
    });

    logger.info({ workId, platform, alertId: alert.id }, 'Detection alert created');

    // Send notification email
    if (work.user && work.certificate) {
      try {
        await sendDetectionAlertEmail({
          recipientEmail: work.user.email,
          recipientName: work.user.fullName,
          workTitle: work.title,
          platform,
          detectedAt: alert.detectedAt,
          matchConfidence,
          sourceUrl,
          verificationUrl: work.certificate.verificationUrl,
        });

        await prisma.detectionAlert.update({
          where: { id: alert.id },
          data: { notifiedAt: new Date(), status: 'NOTIFIED' },
        });

        logger.info({ alertId: alert.id }, 'Detection alert email sent');
      } catch (emailError) {
        logger.warn({ alertId: alert.id, emailError }, 'Detection alert email failed');
      }
    }

    sendSuccess(res, { received: true, alertId: alert.id }, 200);
  } catch (error) {
    logger.error({ error }, 'Detection webhook error');
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/detection/alerts
 * Returns all detection alerts for the authenticated creator's works.
 */
router.get('/alerts', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const alerts = await prisma.detectionAlert.findMany({
      where: { work: { userId } },
      include: {
        work: {
          select: { title: true, isrc: true, certificate: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    sendSuccess(res, { alerts }, 200);
  } catch (error) {
    logger.error({ error }, 'Failed to fetch detection alerts');
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
