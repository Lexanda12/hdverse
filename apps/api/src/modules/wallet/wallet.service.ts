import { v4 as uuidv4 } from 'uuid';
import { walletRepository } from './wallet.repository';
import { prisma } from '../../lib/prisma';
import { paystack } from '../../lib/paystack';
import { logger } from '../../shared/utils/logger';
import { WalletTransactionType } from '@prisma/client';

const MINIMUM_PAYOUT_NGN = 1000; // ₦1,000 minimum

export const walletService = {
  async getWallet(userId: string) {
    const [balance, { items: transactions, total }] = 
      await Promise.all([
        walletRepository.getBalance(userId),
        walletRepository.getTransactions(userId, 1, 20),
      ]);

    return {
      balance,
      currency: 'NGN',
      transactions,
      total,
    };
  },

  async creditWallet(data: {
    userId: string;
    amount: number;
    type: WalletTransactionType;
    description: string;
    reference?: string;
  }) {
    const tx = await walletRepository.createCredit(data);
    logger.info(
      { userId: data.userId, amount: data.amount, type: data.type },
      'Wallet credited'
    );
    return tx;
  },

  async requestPayout(
    userId: string,
    input: {
      amount: number;
      bankCode: string;
      accountNumber: string;
      accountName: string;
    }
  ) {
    // 1. KYC check
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        kycStatus: true, 
        email: true, 
        fullName: true 
      },
    });

    if (!user || user.kycStatus !== 'VERIFIED') {
      throw Object.assign(
        new Error(
          'Identity verification required before payouts. Please verify your phone number.'
        ),
        { code: 'KYC_REQUIRED', statusCode: 403 }
      );
    }

    // 2. Balance check
    const balance = await walletRepository.getBalance(userId);

    if (input.amount > balance) {
      throw Object.assign(
        new Error(
          `Insufficient balance. Available: ₦${balance.toFixed(2)}`
        ),
        { code: 'INSUFFICIENT_BALANCE', statusCode: 422 }
      );
    }

    if (input.amount < MINIMUM_PAYOUT_NGN) {
      throw Object.assign(
        new Error(
          `Minimum payout is ₦${MINIMUM_PAYOUT_NGN}.`
        ),
        { code: 'BELOW_MINIMUM', statusCode: 422 }
      );
    }

    // 3. Generate payout reference
    const reference = `PAYOUT-${uuidv4().replace(/-/g,'').slice(0,16).toUpperCase()}`;

    // 4. Create debit record (PENDING)
    await walletRepository.createDebit({
      userId,
      amount: input.amount,
      type: 'PAYOUT',
      description: `Payout to ${input.accountName} (${input.accountNumber})`,
      reference,
      bankCode: input.bankCode,
      accountNumber: input.accountNumber,
      accountName: input.accountName,
    });

    // 5. Create Paystack transfer recipient
    let recipientCode: string;
    try {
      recipientCode = await paystack.createTransferRecipient({
        name: input.accountName,
        accountNumber: input.accountNumber,
        bankCode: input.bankCode,
      });
    } catch (error) {
      // Rollback the debit record
      await walletRepository.updateTransactionStatus(
        reference, 'FAILED'
      );
      throw error;
    }

    // 6. Initiate Paystack transfer
    try {
      const transfer = await paystack.initiateTransfer({
        amount: input.amount * 100, // NGN to kobo
        recipient: recipientCode,
        reference,
        reason: `HD Verse payout for ${user.fullName}`,
      });

      await walletRepository.updateTransactionStatus(
        reference,
        'PENDING',
        transfer.transferCode
      );

      logger.info(
        { userId, amount: input.amount, reference },
        'Payout initiated via Paystack'
      );

      return {
        reference,
        amount: input.amount,
        status: 'PENDING',
        message: 'Payout initiated. Funds will arrive in 1-2 business days.',
      };

    } catch (error) {
      await walletRepository.updateTransactionStatus(
        reference, 'FAILED'
      );
      throw error;
    }
  },

  async handleTransferWebhook(
    payload: string,
    signature: string
  ) {
    // Verify signature (same as payment webhook)
    const isValid = paystack.verifyWebhookSignature(
      payload, signature
    );
    if (!isValid) {
      throw Object.assign(
        new Error('Invalid webhook signature'),
        { code: 'INVALID_SIGNATURE', statusCode: 401 }
      );
    }

    const event = JSON.parse(payload);

    if (event.event === 'transfer.success') {
      const { reference } = event.data;
      await walletRepository.updateTransactionStatus(
        reference, 'COMPLETED'
      );
      logger.info({ reference }, 'Payout completed');
    }

    if (event.event === 'transfer.failed' || 
        event.event === 'transfer.reversed') {
      const { reference } = event.data;

      // Mark as failed
      await walletRepository.updateTransactionStatus(
        reference, 'FAILED'
      );

      // Reverse the debit — credit back to wallet
      const tx = await walletRepository
        .findByReference(reference);
      if (tx) {
        await walletRepository.createCredit({
          userId: tx.userId,
          amount: Number(tx.amount),
          type: 'REFUND',
          description: `Failed payout reversal (${reference})`,
          reference: `REFUND-${reference}`,
        });
      }

      logger.warn({ reference, event: event.event }, 
        'Payout failed — balance reversed'
      );
    }

    return { received: true };
  },
};
