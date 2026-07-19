import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../../lib/prisma';
import { logger } from '../../shared/utils/logger';
import { RegisterInput, LoginInput, RefreshInput } from './auth.schema';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  RefreshTokenPayload,
} from '../../shared/utils/jwt';
import { sendOtp as sendSmileOtp, verifyOtp as verifySmileOtp } from '../../lib/smile-identity';
import {
  storeOtpJob,
  getOtpJob,
  clearOtpJob,
  checkResendCooldown,
  setResendCooldown,
  incrementAttempts,
  MAX_OTP_ATTEMPTS,
} from '../../shared/utils/otp-store';

export class AuthService {
  async register(input: RegisterInput) {
    const { email, password, fullName, phone } = input;

    // Check for existing user by email
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });
    if (existingEmail) {
      throw Object.assign(new Error('Email already registered'), {
        code: 'EMAIL_EXISTS',
        statusCode: 409,
      });
    }

    // Check for existing user by phone
    const existingPhone = await prisma.user.findUnique({
      where: { phone },
    });
    if (existingPhone) {
      throw Object.assign(new Error('Phone number already registered'), {
        code: 'PHONE_EXISTS',
        statusCode: 409,
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        phone,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        phoneVerified: true,
        kycStatus: true,
        subscriptionTier: true,
        createdAt: true,
      },
    });

    logger.info({ userId: user.id }, 'New user registered');
    return user;
  }

  async login(input: LoginInput) {
    const { email, password } = input;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw Object.assign(
        new Error('Invalid email or password'),
        { code: 'INVALID_CREDENTIALS', statusCode: 401 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      throw Object.assign(
        new Error('Invalid email or password'),
        { code: 'INVALID_CREDENTIALS', statusCode: 401 }
      );
    }

    // Create refresh token record
    const tokenId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        id: tokenId,
        userId: user.id,
        token: tokenId,
        expiresAt,
      },
    });

    const accessToken = signAccessToken({
      userId: user.id,
      email: user.email,
      subscriptionTier: user.subscriptionTier,
    });

    const refreshToken = signRefreshToken({
      userId: user.id,
      tokenId,
    });

    logger.info({ userId: user.id }, 'User logged in');

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        phoneVerified: user.phoneVerified,
        kycStatus: user.kycStatus,
        subscriptionTier: user.subscriptionTier,
      },
    };
  }

  async refreshTokens(refreshToken: string) {
    let payload: RefreshTokenPayload;

    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw Object.assign(
        new Error('Invalid or expired refresh token'),
        { code: 'INVALID_REFRESH_TOKEN', statusCode: 401 }
      );
    }

    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: payload.tokenId },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      throw Object.assign(
        new Error('Refresh token not found or expired'),
        { code: 'INVALID_REFRESH_TOKEN', statusCode: 401 }
      );
    }

    // Rotate: delete old, create new
    const newTokenId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.$transaction([
      prisma.refreshToken.delete({ where: { token: payload.tokenId } }),
      prisma.refreshToken.create({
        data: {
          id: newTokenId,
          userId: tokenRecord.userId,
          token: newTokenId,
          expiresAt,
        },
      }),
    ]);

    const newAccessToken = signAccessToken({
      userId: tokenRecord.user.id,
      email: tokenRecord.user.email,
      subscriptionTier: tokenRecord.user.subscriptionTier,
    });

    const newRefreshToken = signRefreshToken({
      userId: tokenRecord.user.id,
      tokenId: newTokenId,
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async logout(refreshToken: string) {
    let payload: RefreshTokenPayload;

    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      // Token invalid — treat as already logged out
      return;
    }

    await prisma.refreshToken.deleteMany({
      where: { token: payload.tokenId },
    });

    logger.info({ tokenId: payload.tokenId }, 'User logged out');
  }

  async sendOtp(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw Object.assign(new Error('User not found'), {
        code: 'USER_NOT_FOUND',
        statusCode: 404,
      });
    }

    if (user.phoneVerified) {
      throw Object.assign(new Error('Phone already verified'), {
        code: 'PHONE_ALREADY_VERIFIED',
        statusCode: 400,
      });
    }

    const isInCooldown = await checkResendCooldown(userId);
    if (isInCooldown) {
      throw Object.assign(new Error('Please wait 60 seconds before requesting a new code'), {
        code: 'OTP_RESEND_COOLDOWN',
        statusCode: 429,
      });
    }

    const result = await sendSmileOtp(userId, user.phone);
    await storeOtpJob(userId, result.jobId, user.phone);
    await setResendCooldown(userId);

    return { success: true, message: 'OTP sent to your phone' };
  }

  async verifyOtp(userId: string, otp: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw Object.assign(new Error('User not found'), {
        code: 'USER_NOT_FOUND',
        statusCode: 404,
      });
    }

    if (user.phoneVerified) {
      throw Object.assign(new Error('Phone already verified'), {
        code: 'PHONE_ALREADY_VERIFIED',
        statusCode: 400,
      });
    }

    const storedJob = await getOtpJob(userId);
    if (!storedJob) {
      throw Object.assign(new Error('OTP expired or not requested. Please request a new code.'), {
        code: 'OTP_EXPIRED_OR_NOT_FOUND',
        statusCode: 400,
      });
    }

    const attempts = await incrementAttempts(userId);
    if (attempts > MAX_OTP_ATTEMPTS) {
      throw Object.assign(new Error('Too many attempts. Please request a new code.'), {
        code: 'OTP_TOO_MANY_ATTEMPTS',
        statusCode: 429,
      });
    }

    const result = await verifySmileOtp(userId, storedJob.jobId, storedJob.phone, otp);
    
    if (result.verified) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          phoneVerified: true,
          kycStatus: 'VERIFIED',
          kycTier: 1,
        },
      });

      await clearOtpJob(userId);
      return { success: true, message: 'Phone verified successfully' };
    }

    return { success: false, message: 'Incorrect code. Please try again.' };
  }
}

export const authService = new AuthService();
