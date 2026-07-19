import axios from 'axios';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../shared/config/env';
import { logger } from '../shared/utils/logger';

const BASE_URL = config.SMILE_IDENTITY_ENVIRONMENT === 'production'
  ? 'https://api.smileidentity.com/v1'
  : 'https://testapi.smileidentity.com/v1';

const SID_SERVER = config.SMILE_IDENTITY_ENVIRONMENT === 'production' ? 1 : 0;

function generateSignature(): { timestamp: string; signature: string } {
  const timestamp = new Date().toISOString();
  const signature = crypto
    .createHmac('sha256', config.SMILE_IDENTITY_API_KEY)
    .update(timestamp + config.SMILE_IDENTITY_PARTNER_ID + 'sid_request_signature_v1')
    .digest('base64');
  return { timestamp, signature };
}

export async function sendOtp(userId: string, phoneNumber: string): Promise<{
  success: boolean;
  jobId: string;
}> {
  if (config.SMILE_IDENTITY_ENVIRONMENT === 'sandbox' && config.NODE_ENV === 'development') {
    // In development sandbox mode, skip real API call
    // OTP is always "123456" for testing
    logger.info({ userId }, '[SANDBOX] OTP send simulated - use 123456');
    return { success: true, jobId: 'sandbox-job-' + userId };
  }

  const jobId = uuidv4();
  const { timestamp, signature } = generateSignature();

  try {
    const response = await axios.post(`${BASE_URL}/phone_verification`, {
      partner_id: config.SMILE_IDENTITY_PARTNER_ID,
      phone_number: phoneNumber,
      phone_number_type: 'MOBILE',
      sid_server: SID_SERVER,
      partner_params: {
        job_id: jobId,
        user_id: userId,
        job_type: 2,
      },
      timestamp,
      signature,
    });

    logger.info({ userId, jobId, responseData: response.data }, 'OTP sent via Smile Identity');
    return { success: true, jobId };
  } catch (error: any) {
    logger.error({ error: error?.response?.data, userId }, 'Smile Identity OTP send failed');
    throw new Error('Failed to send OTP. Please try again.');
  }
}

export async function verifyOtp(
  userId: string,
  jobId: string,
  phoneNumber: string,
  otp: string
): Promise<{ success: boolean; verified: boolean }> {
  if (config.SMILE_IDENTITY_ENVIRONMENT === 'sandbox' && config.NODE_ENV === 'development') {
    const verified = otp === '123456';
    logger.info({ userId, verified }, '[SANDBOX] OTP verification simulated');
    return { success: true, verified };
  }

  const { timestamp, signature } = generateSignature();

  try {
    const response = await axios.post(`${BASE_URL}/phone_verification`, {
      partner_id: config.SMILE_IDENTITY_PARTNER_ID,
      phone_number: phoneNumber,
      phone_number_type: 'MOBILE',
      sid_server: SID_SERVER,
      otp,
      partner_params: {
        job_id: jobId,
        user_id: userId,
        job_type: 2,
      },
      timestamp,
      signature,
    });

    const verified = response.data?.verified === true 
      || response.data?.ResultCode === '1012';

    logger.info({ userId, verified, responseData: response.data }, 'Smile Identity OTP verification result');
    return { success: true, verified };
  } catch (error: any) {
    logger.error({ error: error?.response?.data, userId }, 'Smile Identity OTP verify failed');
    throw new Error('OTP verification failed. Please try again.');
  }
}
