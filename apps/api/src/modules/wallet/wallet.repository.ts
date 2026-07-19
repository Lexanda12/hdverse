import { prisma } from '../../lib/prisma';
import { 
  WalletTransactionType, 
  TransactionDirection,
  WalletTxStatus 
} from '@prisma/client';

export const walletRepository = {
  async getBalance(userId: string): Promise<number> {
    // Balance = sum of credits - sum of debits (completed only)
    const result = await prisma.walletTransaction.groupBy({
      by: ['direction'],
      where: { 
        userId,
        status: 'COMPLETED',
      },
      _sum: { amount: true },
    });

    let credits = 0;
    let debits = 0;

    for (const row of result) {
      const amount = Number(row._sum.amount ?? 0);
      if (row.direction === 'CREDIT') credits = amount;
      if (row.direction === 'DEBIT') debits = amount;
    }

    return Math.max(0, credits - debits);
  },

  async getTransactions(
    userId: string,
    page: number,
    limit: number
  ) {
    const [items, total] = await Promise.all([
      prisma.walletTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.walletTransaction.count({ where: { userId } }),
    ]);
    return { items, total };
  },

  async createCredit(data: {
    userId: string;
    amount: number;
    type: WalletTransactionType;
    description: string;
    reference?: string;
  }) {
    return prisma.walletTransaction.create({
      data: {
        userId: data.userId,
        type: data.type,
        direction: 'CREDIT',
        amount: data.amount,
        currency: 'NGN',
        description: data.description,
        reference: data.reference,
        status: 'COMPLETED',
      },
    });
  },

  async createDebit(data: {
    userId: string;
    amount: number;
    type: WalletTransactionType;
    description: string;
    reference: string;
    bankCode: string;
    accountNumber: string;
    accountName: string;
  }) {
    return prisma.walletTransaction.create({
      data: {
        userId: data.userId,
        type: data.type,
        direction: 'DEBIT',
        amount: data.amount,
        currency: 'NGN',
        description: data.description,
        reference: data.reference,
        bankCode: data.bankCode,
        accountNumber: data.accountNumber,
        accountName: data.accountName,
        status: 'PENDING',
      },
    });
  },

  async updateTransactionStatus(
    reference: string,
    status: WalletTxStatus,
    paystackTransferCode?: string
  ) {
    return prisma.walletTransaction.update({
      where: { reference },
      data: { 
        status,
        ...(paystackTransferCode && { paystackTransferCode }),
      },
    });
  },

  async findByReference(reference: string) {
    return prisma.walletTransaction.findUnique({
      where: { reference },
    });
  },
};
