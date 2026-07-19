import { prisma } from '../../lib/prisma';
import { generateCertificatePDF } from '../../shared/utils/certificate-generator';
import { uploadBufferToS3 } from '../../lib/s3';
import { sendCertificateEmail } from '../../lib/email';
import { config } from '../../shared/config/env';
import { logger } from '../../shared/utils/logger';
import { v4 as uuidv4 } from 'uuid';

function generateCertificateNumber(): string {
  const year = new Date().getFullYear();
  const seq = Date.now().toString().slice(-5);
  return `HDV-${year}-${seq}`;
}

export const certificatesService = {
  async triggerCertificatePipeline(workId: string) {
    try {
      logger.info({ workId }, 'Certificate pipeline triggered');

      // Get the work record with all needed data
      const work = await prisma.work.findUnique({
        where: { id: workId },
        include: { user: true },
      });

      if (!work || !work.user) {
        throw new Error(`Work ${workId} not found`);
      }

      // Check if certificate already exists (idempotency)
      const existing = await prisma.certificate.findUnique({
        where: { workId },
      });
      if (existing) {
        logger.info({ workId }, 'Certificate already exists — skipping');
        return existing;
      }

      // Generate certificate number and verification UUID
      const certificateNumber = generateCertificateNumber();
      const verificationId = uuidv4();
      const verificationUrl = 
        `${config.CERTIFICATE_BASE_URL}/${verificationId}`;

      // Generate the PDF
      const pdfBuffer = await generateCertificatePDF({
        certificateNumber,
        workTitle: work.title,
        artistName: work.artistName,
        isrc: work.isrc,
        fileHash: work.fileHash,
        timestampedAt: work.timestampedAt ?? new Date(),
        verificationUrl,
        issuedAt: new Date(),
        coCreators: work.coCreators ?? undefined,
      });

      // Upload PDF to S3
      const certificateS3Key = 
        `certificates/${work.userId}/${workId}/${verificationId}.pdf`;

      await uploadBufferToS3(certificateS3Key, pdfBuffer, 'application/pdf');

      // Create certificate record in DB
      const certificate = await prisma.certificate.create({
        data: {
          workId,
          certificateNumber,
          s3Key: certificateS3Key,
          verificationUrl: verificationId,
        },
      });

      // Update work status to ACTIVE
      await prisma.work.update({
        where: { id: workId },
        data: { 
          status: 'ACTIVE',
          certificateS3Key,
        },
      });

      // Send certificate delivery email
      try {
        await sendCertificateEmail({
          recipientEmail: work.user.email,
          recipientName: work.user.fullName,
          workTitle: work.title,
          artistName: work.artistName,
          isrc: work.isrc,
          certificateNumber,
          verificationUrl: `${config.CERTIFICATE_BASE_URL}/${verificationId}`,
          issuedAt: new Date(),
        });
      } catch (emailError) {
        // Email failure should NOT fail the certificate
        logger.error(
          { emailError, workId },
          'Certificate email failed — certificate still issued'
        );
      }

      logger.info(
        { workId, certificateNumber },
        'Certificate pipeline completed successfully'
      );

      return certificate;

    } catch (error) {
      logger.error(
        { error, workId },
        'Certificate pipeline failed'
      );
      // Update work status to FAILED
      await prisma.work.update({
        where: { id: workId },
        data: { status: 'FAILED' },
      }).catch(() => {});
      throw error;
    }
  },

  async getCertificateByWorkId(workId: string, userId: string) {
    const work = await prisma.work.findFirst({
      where: { id: workId, userId },
    });

    if (!work) {
      throw Object.assign(
        new Error('Work not found.'),
        { code: 'WORK_NOT_FOUND', statusCode: 404 }
      );
    }

    const certificate = await prisma.certificate.findUnique({
      where: { workId },
    });

    if (!certificate) {
      throw Object.assign(
        new Error('Certificate not yet issued.'),
        { code: 'CERTIFICATE_PENDING', statusCode: 404 }
      );
    }

    return certificate;
  },

  async verifyCertificatePublic(verificationId: string) {
    const certificate = await prisma.certificate.findUnique({
      where: { verificationUrl: verificationId },
      include: {
        work: {
          select: {
            title: true,
            artistName: true,
            isrc: true,
            fileHash: true,
            timestampedAt: true,
            createdAt: true,
          },
        },
      },
    });

    if (!certificate) {
      throw Object.assign(
        new Error('Certificate not found.'),
        { code: 'CERTIFICATE_NOT_FOUND', statusCode: 404 }
      );
    }

    return {
      certificateNumber: certificate.certificateNumber,
      issuedAt: certificate.issuedAt,
      workTitle: certificate.work.title,
      artistName: certificate.work.artistName,
      isrc: certificate.work.isrc,
      fileHash: certificate.work.fileHash,
      timestampedAt: certificate.work.timestampedAt,
      verificationUrl: certificate.verificationUrl,
    };
  },
};
