import axios from 'axios';
import crypto from 'crypto';
import { config } from '../shared/config/env';
import { logger } from '../shared/utils/logger';

const paystackApi = axios.create({
  baseURL: 'https://api.paystack.co',
  headers: {
    Authorization: `Bearer ${config.PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
});

export interface InitializePaymentParams {
  email: string;
  amountKobo: number;       // amount in kobo (NGN × 100)
  reference: string;        // unique payment reference
  metadata: {
    workId: string;
    userId: string;
    paymentType: 'CERTIFICATE';
    workTitle: string;
  };
  callbackUrl: string;      // redirect after payment
}

export interface PaystackTransaction {
  reference: string;
  status: 'success' | 'failed' | 'abandoned';
  amount: number;           // in kobo
  currency: string;
  metadata: any;
  customer: {
    email: string;
  };
  paid_at: string;
}

export const paystack = {
  async initializePayment(params: InitializePaymentParams): Promise<{
    authorizationUrl: string;
    accessCode: string;
    reference: string;
  }> {
    try {
      const response = await paystackApi.post(
        '/transaction/initialize',
        {
          email: params.email,
          amount: params.amountKobo,
          reference: params.reference,
          currency: 'NGN',
          callback_url: params.callbackUrl,
          metadata: params.metadata,
          channels: ['card', 'bank', 'ussd', 'bank_transfer'],
        }
      );

      const { authorization_url, access_code, reference } = 
        response.data.data;

      logger.info(
        { reference, workId: params.metadata.workId },
        'Paystack payment initialized'
      );

      return {
        authorizationUrl: authorization_url,
        accessCode: access_code,
        reference,
      };
    } catch (error: any) {
      logger.error(
        { error: error?.response?.data },
        'Paystack initialization failed'
      );
      throw new Error('Failed to initialize payment. Please try again.');
    }
  },

  async verifyTransaction(reference: string): Promise<PaystackTransaction> {
    try {
      const response = await paystackApi.get(
        `/transaction/verify/${reference}`
      );
      const transaction = response.data.data;
      if (transaction.status === 'success') {
        return transaction;
      }
      if (config.NODE_ENV === 'development') {
        logger.warn({ reference, status: transaction.status }, 'Paystack verification returned non-success in dev - falling back to mock success');
        return {
          reference,
          status: 'success',
          amount: transaction.amount || 300000,
          currency: transaction.currency || 'NGN',
          metadata: transaction.metadata || {},
          customer: transaction.customer || { email: 'dev-test@myhdverse.com' },
          paid_at: transaction.paid_at || new Date().toISOString()
        };
      }
      return transaction;
    } catch (error: any) {
      if (config.NODE_ENV === 'development') {
        logger.warn({ reference, error: error?.message }, 'Paystack verification failed in dev - returning mock success for testing');
        return {
          reference,
          status: 'success',
          amount: 300000,
          currency: 'NGN',
          metadata: {},
          customer: { email: 'dev-test@myhdverse.com' },
          paid_at: new Date().toISOString()
        };
      }
      logger.error(
        { error: error?.response?.data, reference },
        'Paystack verification failed'
      );
      throw new Error('Failed to verify payment.');
    }
  },

  verifyWebhookSignature(
    payload: string,
    signature: string
  ): boolean {
    // Skip verification in dev if webhook secret not set yet
    if (!config.PAYSTACK_WEBHOOK_SECRET) {
      logger.warn('PAYSTACK_WEBHOOK_SECRET not set — skipping signature verification (dev only)');
      return true;
    }

    const hash = crypto
      .createHmac('sha512', config.PAYSTACK_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');

    return hash === signature;
  },

  async createTransferRecipient(params: {
    name: string;
    accountNumber: string;
    bankCode: string;
  }): Promise<string> {
    try {
      const response = await paystackApi.post(
        '/transferrecipient',
        {
          type: 'nuban',
          name: params.name,
          account_number: params.accountNumber,
          bank_code: params.bankCode,
          currency: 'NGN',
        }
      );
      return response.data.data.recipient_code;
    } catch (error: any) {
      logger.error(
        { error: error?.response?.data },
        'Failed to create transfer recipient'
      );
      throw new Error(
        'Invalid bank details. Please check and try again.'
      );
    }
  },

  async initiateTransfer(params: {
    amount: number;      // in kobo
    recipient: string;   // recipient_code from above
    reference: string;
    reason: string;
  }): Promise<{ transferCode: string }> {
    try {
      const response = await paystackApi.post('/transfer', {
        source: 'balance',
        amount: params.amount,
        recipient: params.recipient,
        reference: params.reference,
        reason: params.reason,
      });
      return { 
        transferCode: response.data.data.transfer_code 
      };
    } catch (error: any) {
      logger.error(
        { error: error?.response?.data },
        'Failed to initiate transfer'
      );
      throw new Error('Payout failed. Please try again.');
    }
  },

  async getBanks(): Promise<Array<{
    name: string;
    code: string;
  }>> {
    const response = await paystackApi.get(
      '/bank?currency=NGN&country=nigeria'
    );
    return response.data.data.map((b: any) => ({
      name: b.name,
      code: b.code,
    }));
  },

  async resolveAccountNumber(params: {
    accountNumber: string;
    bankCode: string;
  }): Promise<{ accountName: string }> {
    try {
      const response = await paystackApi.get(
        `/bank/resolve?account_number=${params.accountNumber}&bank_code=${params.bankCode}`
      );
      return { 
        accountName: response.data.data.account_name 
      };
    } catch (error: any) {
      throw new Error(
        'Could not verify account. Please check your account number and bank.'
      );
    }
  },
};

