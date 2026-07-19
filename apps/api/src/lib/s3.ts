import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../shared/config/env';
import fs from 'fs';
import path from 'path';

export const s3Client = new S3Client({
  region: config.AWS_REGION,
  credentials: {
    accessKeyId: config.AWS_ACCESS_KEY_ID,
    secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
  },
});

export async function generatePresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 300
): Promise<string> {
  if (config.AWS_ACCESS_KEY_ID === 'dummy_aws_key') {
    return `http://localhost:3001/api/mock-s3/${key}`;
  }
  const command = new PutObjectCommand({
    Bucket: config.AWS_S3_BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3Client, command, { expiresIn });
}

export async function generatePresignedDownloadUrl(
  key: string,
  expiresIn = 3600
): Promise<string> {
  if (config.AWS_ACCESS_KEY_ID === 'dummy_aws_key') {
    return `http://localhost:3001/api/mock-s3/${key}`;
  }
  const command = new GetObjectCommand({
    Bucket: config.AWS_S3_BUCKET,
    Key: key,
  });
  return getSignedUrl(s3Client, command, { expiresIn });
}

export async function downloadFileFromS3(key: string): Promise<Buffer> {
  if (config.AWS_ACCESS_KEY_ID === 'dummy_aws_key') {
    const mockS3Path = path.join(process.cwd(), 'mock-s3', key);
    if (fs.existsSync(mockS3Path)) {
      return fs.readFileSync(mockS3Path);
    }
    throw new Error(`Mock S3 file not found at: ${mockS3Path}`);
  }

  const command = new GetObjectCommand({
    Bucket: config.AWS_S3_BUCKET,
    Key: key,
  });

  const response = await s3Client.send(command);

  if (!response.Body) {
    throw new Error(`No body returned for S3 key: ${key}`);
  }

  // Convert stream to buffer
  const chunks: Uint8Array[] = [];
  for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export async function uploadBufferToS3(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<void> {
  if (config.AWS_ACCESS_KEY_ID === 'dummy_aws_key') {
    // Local mock: save to filesystem
    const mockPath = path.join(process.cwd(), 'mock-s3', key);
    fs.mkdirSync(path.dirname(mockPath), { recursive: true });
    fs.writeFileSync(mockPath, buffer);
    return;
  }

  const command = new PutObjectCommand({
    Bucket: config.AWS_S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });
  await s3Client.send(command);
}

