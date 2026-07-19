import { config } from './shared/config/env';
import { logger } from './shared/utils/logger';
import { prisma } from './lib/prisma';
import { queues } from './jobs/registry';
import { startCertificateWorker } from './jobs/workers/certificate-pipeline.worker';
import app from './app';

const PORT = config.PORT;

async function bootstrap() {
  try {
    await prisma.$connect();
    logger.info('Database connected');

    // Initialize job queues (establishes Redis connection)
    logger.info(`Job queues ready: ${Object.keys(queues).join(', ')}`);

    const certWorker = startCertificateWorker();

    const server = app.listen(PORT, () => {
      logger.info(`HD Verse API running on port ${PORT}`);
    });

    const shutdown = async () => {
      logger.info('Shutting down...');
      await certWorker.close();
      await Promise.all([
        queues.certificatePipeline.close(),
        queues.detectionCheck.close(),
        queues.emailNotification.close(),
      ]);
      await prisma.$disconnect();
      server.close(() => process.exit(0));
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
}

bootstrap();

