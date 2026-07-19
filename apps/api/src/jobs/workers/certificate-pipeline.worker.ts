import { Worker, Job } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';
import { redis } from '../../lib/redis';
import { prisma } from '../../lib/prisma';
import { downloadFileFromS3, uploadBufferToS3 } from '../../lib/s3';
import { verifyHash } from '../../shared/utils/hash';
import { createTimestamp } from '../../shared/utils/timestamp';
import { registerFingerprint } from '../../lib/acrcloud';
import { generateCertificatePDF, CertificateData } from '../../shared/utils/certificate-generator';
import { sendCertificateEmail, CertificateEmailData } from '../../lib/email';
import { logger } from '../../shared/utils/logger';
import { CertificatePipelineJobData } from '../job-types';
import { QUEUE_NAMES } from '../queues';
import { config } from '../../shared/config/env';

async function processCertificatePipeline(
  job: Job<CertificatePipelineJobData>
): Promise<void> {
  const { workId, userId, s3Key, fileHash, isrc } = job.data;

  logger.info({ workId, jobId: job.id }, 'Certificate pipeline started');

  try {
    // ── STAGE 1: Download + verify hash ──────────────────────────
    await job.updateProgress(10);
    logger.info({ workId }, 'Stage 1: Downloading file from S3');

    const fileBuffer = await downloadFileFromS3(s3Key);

    const hashValid = verifyHash(fileBuffer, fileHash);
    if (!hashValid) {
      throw new Error(`Hash mismatch for work ${workId}`);
    }

    logger.info({ workId }, 'Stage 1: Hash verified ✓');
    await job.updateProgress(30);

    // ── STAGE 2: RFC 3161 Timestamp ───────────────────────────────
    logger.info({ workId }, 'Stage 2: Requesting RFC 3161 timestamp');

    const timestampToken = await createTimestamp(fileHash);
    const timestampedAt = new Date();

    await prisma.work.update({
      where: { id: workId },
      data: {
        timestampToken,
        timestampedAt,
      },
    });

    logger.info({ workId }, 'Stage 2: Timestamp stored ✓');
    await job.updateProgress(50);

    // ── STAGE 3: ACRCloud Fingerprint Registration ─────────────────
    logger.info({ workId }, 'Stage 3: Registering fingerprint with ACRCloud');

    let acrcloudId: string;
    try {
      acrcloudId = await registerFingerprint(
        fileBuffer,
        `${isrc}.mp3`,
        workId
      );
    } catch (acrError) {
      // ACRCloud failure is non-fatal for certificate issuance
      // Log and continue — fingerprint can be retried separately
      logger.warn({ workId, acrError }, 'ACRCloud registration failed — continuing pipeline');
      acrcloudId = `pending-${workId}`;
    }

    await prisma.work.update({
      where: { id: workId },
      data: {
        acrcloudId,
        fingerprintStatus: acrcloudId.startsWith('pending-')
          ? 'FAILED'
          : 'REGISTERED',
        fingerprintedAt: new Date(),
      },
    });

    logger.info({ workId, acrcloudId }, 'Stage 3: Fingerprint complete ✓');
    await job.updateProgress(70);

    // ── STAGE 4: Certificate PDF Generation ───────────────────────
    logger.info({ workId }, 'Stage 4: Generating certificate PDF');

    // Fetch full work record for certificate data
    const workRecord = await prisma.work.findUnique({
      where: { id: workId },
    });

    if (!workRecord || !workRecord.timestampedAt) {
      throw new Error(`Work record missing or timestamp not set for ${workId}`);
    }

    const certificateId = uuidv4();
    const certificateNumber = `HDV-${new Date().getFullYear()}-${certificateId.substring(0, 8).toUpperCase()}`;
    const verificationUrl = `${config.CERTIFICATE_BASE_URL}/${certificateId}`;

    const certData: CertificateData = {
      certificateNumber,
      workTitle: workRecord.title,
      artistName: workRecord.artistName,
      isrc: workRecord.isrc,
      fileHash,
      timestampedAt: workRecord.timestampedAt,
      verificationUrl,
      issuedAt: new Date(),
    };

    const pdfBuffer = await generateCertificatePDF(certData);

    // Upload certificate PDF to S3
    const certS3Key = `certificates/${userId}/${certificateId}.pdf`;
    await uploadBufferToS3(certS3Key, pdfBuffer, 'application/pdf');

    // Create Certificate record in DB
    await prisma.certificate.create({
      data: {
        id: certificateId,
        workId,
        certificateNumber,
        s3Key: certS3Key,
        verificationUrl,
      },
    });

    // Update work status to ACTIVE
    await prisma.work.update({
      where: { id: workId },
      data: {
        status: 'ACTIVE',
        certificateS3Key: certS3Key,
      },
    });

    logger.info({ workId, certificateNumber }, 'Stage 4: Certificate generated and stored ✓');
    await job.updateProgress(90);

    // ── STAGE 5: Send Certificate Email ───────────────────────
    logger.info({ workId }, 'Stage 5: Sending certificate email');

    const userRecord = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, fullName: true },
    });

    if (userRecord) {
      const emailData: CertificateEmailData = {
        recipientEmail: userRecord.email,
        recipientName: userRecord.fullName,
        workTitle: workRecord.title,
        artistName: workRecord.artistName,
        isrc: workRecord.isrc,
        certificateNumber,
        verificationUrl,
        issuedAt: new Date(),
      };

      try {
        await sendCertificateEmail(emailData);
        logger.info({ workId }, 'Stage 5: Certificate email sent ✓');
      } catch (emailError) {
        // Email failure is non-fatal — certificate is already created
        logger.warn({ workId, emailError }, 'Certificate email failed — pipeline still complete');
      }
    }

    await job.updateProgress(100);
    logger.info({ workId, certificateNumber }, 'Pipeline complete — all 5 stages done ✓');

  } catch (error) {
    logger.error({ workId, error }, 'Certificate pipeline failed');

    await prisma.work.update({
      where: { id: workId },
      data: { status: 'FAILED' },
    });

    throw error; // BullMQ will retry per job config
  }
}

export function startCertificateWorker() {
  const worker = new Worker(
    QUEUE_NAMES.CERTIFICATE_PIPELINE,
    processCertificatePipeline,
    {
      connection: redis,
      concurrency: 3,
    }
  );

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Certificate pipeline job completed');
  });

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'Certificate pipeline job failed');
  });

  logger.info('Certificate pipeline worker started');
  return worker;
}
