import { v4 as uuidv4 } from 'uuid';
import { paystack } from '../../lib/paystack';
import { paymentsRepository } from './payments.repository';
import { worksRepository } from '../works/works.repository';
import { certificatesService } from '../certificates/certificates.service';
import { prisma } from '../../lib/prisma';
import { config } from '../../shared/config/env';
import { logger } from '../../shared/utils/logger';
import { walletService } from '../wallet/wallet.service';


// Certificate price in kobo (NGN)
// ₦3,000 = 300,000 kobo (~$2 USD)
const CERTIFICATE_PRICE_KOBO = 300000;

export const paymentsService = {
  async initiatePayment(userId: string, workId: string) {
    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, fullName: true },
    });

    if (!user) {
      throw Object.assign(
        new Error('User not found.'),
        { code: 'USER_NOT_FOUND', statusCode: 404 }
      );
    }

    // Get work and verify ownership
    const work = await worksRepository.findById(workId, userId);
    if (!work) {
      throw Object.assign(
        new Error('Work not found.'),
        { code: 'WORK_NOT_FOUND', statusCode: 404 }
      );
    }

    // Check if already paid
    const existingPayment = await paymentsRepository
      .findByWorkId(workId);
    if (existingPayment) {
      throw Object.assign(
        new Error('This work has already been paid for.'),
        { code: 'ALREADY_PAID', statusCode: 409 }
      );
    }

    // Generate unique payment reference
    const reference = `HDV-${uuidv4().replace(/-/g, '').slice(0, 16).toUpperCase()}`;

    // Initialize with Paystack
    const paystackResult = await paystack.initializePayment({
      email: user.email,
      amountKobo: CERTIFICATE_PRICE_KOBO,
      reference,
      metadata: {
        workId,
        userId,
        paymentType: 'CERTIFICATE',
        workTitle: work.title,
      },
      callbackUrl: `${config.FRONTEND_URL}/works/${workId}/certificate`,
    });

    // Create pending payment record
    await paymentsRepository.create({
      userId,
      workId,
      paystackRef: reference,
      amount: CERTIFICATE_PRICE_KOBO / 100, // store in NGN
      currency: 'NGN',
      type: 'CERTIFICATE',
    });

    logger.info(
      { workId, userId, reference },
      'Payment initiated'
    );

    return {
      authorizationUrl: paystackResult.authorizationUrl,
      reference,
      amount: CERTIFICATE_PRICE_KOBO,
      currency: 'NGN',
    };
  },

  async handleWebhook(payload: string, signature: string) {
    // Verify webhook signature
    const isValid = paystack.verifyWebhookSignature(
      payload, 
      signature
    );

    if (!isValid) {
      throw Object.assign(
        new Error('Invalid webhook signature.'),
        { code: 'INVALID_SIGNATURE', statusCode: 401 }
      );
    }

    const event = JSON.parse(payload);
    logger.info({ event: event.event }, 'Paystack webhook received');

    // Only process successful charge events
    if (event.event !== 'charge.success') {
      return { received: true };
    }

    const { reference, status, metadata } = event.data;

    if (status !== 'success') {
      logger.info({ reference, status }, 'Payment not successful — ignoring');
      return { received: true };
    }

    // Find the payment record
    const payment = await paymentsRepository
      .findByReference(reference);

    if (!payment) {
      logger.warn({ reference }, 'Payment record not found for webhook');
      return { received: true };
    }

    // Idempotency check — don't process twice
    if (payment.status === 'COMPLETED') {
      logger.info({ reference }, 'Payment already processed — skipping');
      return { received: true };
    }

    // Verify with Paystack directly (don't trust webhook alone)
    const transaction = await paystack.verifyTransaction(reference);

    if (transaction.status !== 'success') {
      logger.warn(
        { reference, status: transaction.status },
        'Paystack verification returned non-success'
      );
      await paymentsRepository.updateStatus(reference, 'FAILED');
      return { received: true };
    }

    // Mark payment as completed
    await paymentsRepository.updateStatus(reference, 'COMPLETED');

    await walletService.creditWallet({
      userId: payment.userId,
      amount: transaction.amount / 100, // kobo to NGN
      type: 'CERTIFICATE_FEE',
      description: `Certificate fee for "${payment.work?.title}"`,
      reference: `CERT-${reference}`,
    });

    logger.info(

      { reference, workId: payment.workId },
      'Payment confirmed — triggering certificate release'
    );

    // Trigger certificate generation pipeline
    if (payment.workId) {
      await certificatesService.triggerCertificatePipeline(
        payment.workId
      );
    }

    return { received: true, processed: true };
  },

  async getPaymentHistory(userId: string) {
    return prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { work: { select: { title: true } } },
    });
  },
};
