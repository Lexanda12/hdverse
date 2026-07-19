import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../lib/prisma';
import { generatePresignedUploadUrl } from '../../lib/s3';
import { generateISRC } from '../../shared/utils/isrc';
import { certificatePipelineQueue } from '../../jobs/registry';
import { CertificatePipelineJobData } from '../../jobs/job-types';
import { logger } from '../../shared/utils/logger';
import { InitiateUploadInput } from './works.schema';
import { config } from '../../shared/config/env';

export class WorksService {
  async initiateUpload(userId: string, input: InitiateUploadInput) {
    const {
      title,
      artistName,
      genre,
      yearCreated,
      coCreators,
      fileName,
      mimeType,
      fileSizeBytes,
    } = input;

    // Generate unique S3 key
    const fileExtension = fileName.split('.').pop() || 'bin';
    const s3Key = `works/${userId}/${uuidv4()}.${fileExtension}`;

    // Generate ISRC
    const isrc = generateISRC();

    // Create work record in PENDING state
    const work = await prisma.work.create({
      data: {
        userId,
        title,
        artistName,
        genre,
        yearCreated,
        coCreators,
        s3Key,
        s3Bucket: config.AWS_S3_BUCKET,
        fileName,
        fileSizeBytes: BigInt(fileSizeBytes),
        mimeType,
        fileHash: `pending-${uuidv4()}`, // placeholder until confirmed
        isrc,
        status: 'PROCESSING',
        fingerprintStatus: 'PENDING',
      },
      select: {
        id: true,
        title: true,
        artistName: true,
        isrc: true,
        s3Key: true,
        status: true,
        createdAt: true,
      },
    });

    // Generate presigned upload URL (valid 5 minutes)
    const uploadUrl = await generatePresignedUploadUrl(s3Key, mimeType, 300);

    logger.info({ workId: work.id, userId }, 'Upload initiated');

    return {
      workId: work.id,
      uploadUrl,
      s3Key,
      isrc: work.isrc,
      expiresInSeconds: 300,
    };
  }

  async confirmUpload(workId: string, userId: string, fileHash: string) {
    // Verify work belongs to user
    const work = await prisma.work.findFirst({
      where: { id: workId, userId },
    });

    if (!work) {
      throw Object.assign(
        new Error('Work not found'),
        { code: 'NOT_FOUND', statusCode: 404 }
      );
    }

    if (work.status !== 'PROCESSING') {
      throw Object.assign(
        new Error('Work already confirmed or failed'),
        { code: 'INVALID_STATE', statusCode: 409 }
      );
    }

    // Check for duplicate file hash
    const duplicate = await prisma.work.findFirst({
      where: { fileHash, NOT: { id: workId } },
    });

    if (duplicate) {
      throw Object.assign(
        new Error('This file has already been registered'),
        { code: 'DUPLICATE_FILE', statusCode: 409 }
      );
    }

    // Update work with real file hash
    await prisma.work.update({
      where: { id: workId },
      data: { fileHash },
    });

    // Enqueue certificate pipeline job
    const jobData: CertificatePipelineJobData = {
      workId: work.id,
      userId: work.userId,
      s3Key: work.s3Key,
      fileHash,
      isrc: work.isrc,
    };

    await certificatePipelineQueue.add('process-certificate', jobData, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    });

    logger.info({ workId, userId }, 'Upload confirmed, pipeline enqueued');

    return { workId, status: 'PROCESSING', message: 'Certificate pipeline started' };
  }

  async getWork(workId: string, userId: string) {
    const work = await prisma.work.findFirst({
      where: { id: workId, userId },
      include: { certificate: true },
    });

    if (!work) {
      throw Object.assign(
        new Error('Work not found'),
        { code: 'NOT_FOUND', statusCode: 404 }
      );
    }

    return {
      ...work,
      fileSizeBytes: Number(work.fileSizeBytes),
    };
  }

  async listWorks(userId: string) {
    const works = await prisma.work.findMany({
      where: { userId },
      include: { certificate: true },
      orderBy: { createdAt: 'desc' },
    });

    return works.map(w => ({
      ...w,
      fileSizeBytes: Number(w.fileSizeBytes),
    }));
  }
}

export const worksService = new WorksService();
