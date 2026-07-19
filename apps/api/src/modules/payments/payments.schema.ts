import { z } from 'zod';

export const initiatePaymentSchema = z.object({
  body: z.object({
    workId: z.string().min(1, 'Work ID is required'),
  }),
});

export type InitiatePaymentInput = z.infer<
  typeof initiatePaymentSchema
>['body'];
