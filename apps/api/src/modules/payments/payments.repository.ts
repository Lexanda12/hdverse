import { prisma } from '../../lib/prisma';
import { PaymentStatus, PaymentType } from '@prisma/client';

export const paymentsRepository = {
  async create(data: {
    userId: string;
    workId: string;
    paystackRef: string;
    amount: number;
    currency: string;
    type: PaymentType;
  }) {
    // Map paystackRef to flutterwaveRef field in schema
    // (field was named flutterwaveRef — we use it for 
    // any payment reference)
    return prisma.payment.create({
      data: {
        userId: data.userId,
        workId: data.workId,
        flutterwaveRef: data.paystackRef,
        amount: data.amount,
        currency: data.currency,
        type: data.type,
        status: 'PENDING',
      },
    });
  },

  async findByReference(paystackRef: string) {
    return prisma.payment.findUnique({
      where: { flutterwaveRef: paystackRef },
      include: { work: true, user: true },
    });
  },

  async updateStatus(
    paystackRef: string, 
    status: PaymentStatus
  ) {
    return prisma.payment.update({
      where: { flutterwaveRef: paystackRef },
      data: { status },
    });
  },

  async findByWorkId(workId: string) {
    return prisma.payment.findFirst({
      where: { workId, status: 'COMPLETED' },
    });
  },
};
