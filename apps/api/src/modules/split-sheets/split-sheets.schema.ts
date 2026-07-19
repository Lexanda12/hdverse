import { z } from 'zod';

export const createSplitSheetSchema = z.object({
  body: z.object({
    workId: z.string().min(1, 'Work ID required'),
    entries: z.array(z.object({
      collaboratorName: z.string()
        .min(1, 'Collaborator name required')
        .max(255),
      collaboratorEmail: z.string()
        .email('Valid email required'),
      percentage: z.number()
        .int('Percentage must be a whole number')
        .min(1, 'Minimum 1%')
        .max(99, 'Maximum 99% per collaborator'),
    }))
    .min(1, 'At least one collaborator required')
    .max(10, 'Maximum 10 collaborators per split sheet'),
  }).refine(
    (data) => {
      const total = data.entries.reduce(
        (sum, e) => sum + e.percentage, 0
      );
      return total === 100;
    },
    { message: 'Percentages must sum to exactly 100', path: ['entries'] }
  ),
});

export const confirmSplitSchema = z.object({
  params: z.object({
    token: z.string().min(1),
  }),
  body: z.object({
    action: z.enum(['confirm', 'decline']),
  }),
});

export type CreateSplitSheetInput = z.infer<
  typeof createSplitSheetSchema
>['body'];
