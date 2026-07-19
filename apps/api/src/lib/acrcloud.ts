import crypto from 'crypto';
import axios from 'axios';
import FormData from 'form-data';
import { config } from '../shared/config/env';
import { logger } from '../shared/utils/logger';

function buildACRCloudSignature(
  method: string,
  uri: string,
  contentType: string,
  md5Content: string,
  timestamp: number
): string {
  const stringToSign = [
    method,
    md5Content,
    contentType,
    timestamp.toString(),
    uri,
  ].join('\n');

  return crypto
    .createHmac('sha1', config.ACRCLOUD_ACCESS_SECRET)
    .update(stringToSign)
    .digest('base64');
}

export async function registerFingerprint(
  fileBuffer: Buffer,
  fileName: string,
  externalId: string
): Promise<string> {
  const host = config.ACRCLOUD_HOST;
  const bucketName = config.ACRCLOUD_BUCKET_NAME;
  const uri = `/v1/buckets/${bucketName}/files`;
  const url = `https://${host}${uri}`;

  const timestamp = Math.floor(Date.now() / 1000);
  const contentType = 'audio/mpeg';
  const md5Content = crypto
    .createHash('md5')
    .update(fileBuffer)
    .digest('base64');

  const signature = buildACRCloudSignature(
    'POST',
    uri,
    contentType,
    md5Content,
    timestamp
  );

  const authHeader = `ACRCloud ${config.ACRCLOUD_ACCESS_KEY}:${signature}`;

  const formData = new FormData();
  formData.append('file', fileBuffer, {
    filename: fileName,
    contentType,
  });
  formData.append('external_id', externalId);
  formData.append('title', fileName);

  logger.info({ externalId, bucketName }, 'Registering fingerprint with ACRCloud');

  const response = await axios.post(url, formData, {
    headers: {
      ...formData.getHeaders(),
      Authorization: authHeader,
      'Content-MD5': md5Content,
      Date: timestamp.toString(),
    },
    timeout: 30000,
  });

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(
      `ACRCloud registration failed: ${response.status} ${JSON.stringify(response.data)}`
    );
  }

  // ACRCloud returns the file's acr_id on success
  const acrId: string =
    response.data?.data?.acr_id ||
    response.data?.acr_id ||
    externalId;

  logger.info({ externalId, acrId }, 'Fingerprint registered with ACRCloud ✓');
  return acrId;
}
