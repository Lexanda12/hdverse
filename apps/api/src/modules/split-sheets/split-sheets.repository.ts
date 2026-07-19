import { prisma } from '../../lib/prisma';
import { SplitSheetStatus, ConfirmationStatus } from '@prisma/client';

export const splitSheetsRepository = {
  async create(data: {
    workId: string;
    entries: Array<{
      collaboratorName: string;
      collaboratorEmail: string;
      collaboratorId?: string;
      percentage: number;
    }>;
  }) {
    const total = data.entries.reduce(
      (sum, e) => sum + e.percentage, 0
    );

    return prisma.splitSheet.create({
      data: {
        workId: data.workId,
        totalPercentage: total,
        status: 'DRAFT',
        entries: {
          create: data.entries.map(entry => ({
            collaboratorName: entry.collaboratorName,
            collaboratorEmail: entry.collaboratorEmail,
            collaboratorId: entry.collaboratorId,
            percentage: entry.percentage,
            confirmationStatus: 'PENDING',
          })),
        },
      },
      include: { entries: true },
    });
  },

  async findByWorkId(workId: string) {
    return prisma.splitSheet.findUnique({
      where: { workId },
      include: { entries: true },
    });
  },

  async findById(id: string) {
    return prisma.splitSheet.findUnique({
      where: { id },
      include: { entries: true, work: true },
    });
  },

  async findEntryByToken(token: string) {
    return prisma.splitSheetEntry.findUnique({
      where: { confirmationToken: token },
      include: { splitSheet: { include: { work: true } } },
    });
  },

  async confirmEntry(
    token: string, 
    action: 'CONFIRMED' | 'DECLINED'
  ) {
    return prisma.splitSheetEntry.update({
      where: { confirmationToken: token },
      data: {
        confirmationStatus: action,
        confirmedAt: new Date(),
      },
    });
  },

  async updateStatus(
    splitSheetId: string, 
    status: SplitSheetStatus
  ) {
    return prisma.splitSheet.update({
      where: { id: splitSheetId },
      data: { status },
    });
  },

  async lockSplitSheet(
    splitSheetId: string, 
    lockedHash: string
  ) {
    return prisma.splitSheet.update({
      where: { id: splitSheetId },
      data: {
        status: 'LOCKED',
        lockedAt: new Date(),
        lockedHash,
      },
    });
  },

  async checkAllConfirmed(splitSheetId: string): 
    Promise<boolean> {
    const pending = await prisma.splitSheetEntry.count({
      where: {
        splitSheetId,
        confirmationStatus: 'PENDING',
      },
    });
    return pending === 0;
  },
};
