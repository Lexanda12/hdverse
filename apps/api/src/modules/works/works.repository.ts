import { prisma } from '../../lib/prisma';

export const worksRepository = {
  async findById(id: string, userId: string) {
    return prisma.work.findFirst({
      where: { id, userId },
    });
  },
};
