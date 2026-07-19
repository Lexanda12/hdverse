import { redis } from '../../lib/redis';

const OTP_TTL_SECONDS = 600; // 10 minutes
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_ATTEMPTS = 3;

function otpJobKey(userId: string) { 
  return `otp:job:${userId}`; 
}
function otpAttemptsKey(userId: string) { 
  return `otp:attempts:${userId}`; 
}
function otpCooldownKey(userId: string) { 
  return `otp:cooldown:${userId}`; 
}

export async function storeOtpJob(userId: string, jobId: string, phone: string) {
  await redis.setex(
    otpJobKey(userId), 
    OTP_TTL_SECONDS, 
    JSON.stringify({ jobId, phone })
  );
}

export async function getOtpJob(userId: string): Promise<{ 
  jobId: string; 
  phone: string 
} | null> {
  const raw = await redis.get(otpJobKey(userId));
  if (!raw) return null;
  return JSON.parse(raw);
}

export async function clearOtpJob(userId: string) {
  await redis.del(otpJobKey(userId));
  await redis.del(otpAttemptsKey(userId));
}

export async function checkResendCooldown(userId: string): Promise<boolean> {
  const cooldown = await redis.get(otpCooldownKey(userId));
  return cooldown !== null; // true means still in cooldown
}

export async function setResendCooldown(userId: string) {
  await redis.setex(otpCooldownKey(userId), RESEND_COOLDOWN_SECONDS, '1');
}

export async function incrementAttempts(userId: string): Promise<number> {
  const key = otpAttemptsKey(userId);
  const attempts = await redis.incr(key);
  if (attempts === 1) {
    await redis.expire(key, OTP_TTL_SECONDS);
  }
  return attempts;
}

export async function getAttempts(userId: string): Promise<number> {
  const val = await redis.get(otpAttemptsKey(userId));
  return val ? parseInt(val) : 0;
}

export const MAX_OTP_ATTEMPTS = MAX_ATTEMPTS;
