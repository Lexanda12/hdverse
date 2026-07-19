import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import fs from 'fs';
import path from 'path';
import { config } from './shared/config/env';
import { logger } from './shared/utils/logger';
import authRouter from './modules/auth/auth.router';
import worksRouter from './modules/works/works.router';
import detectionRouter from './modules/detection/detection.router';
import certificatesRouter from './modules/certificates/certificates.routes';
import paymentsRouter from './modules/payments/payments.routes';
import splitSheetsRouter from './modules/split-sheets/split-sheets.routes';
import walletRouter from './modules/wallet/wallet.routes';



const app = express();


// Apply pino-http logger
app.use(
  pinoHttp({
    level: config.NODE_ENV === 'production' ? 'info' : 'debug',
    // Do not log healthcheck requests to keep logs cleaner
    autoLogging: {
      ignore: (req) => req.url === '/health' || req.url === '/health/',
    },
  })
);

// Apply security middleware
app.use(helmet());
app.use(
  cors({
    origin: config.FRONTEND_URL,
    credentials: true,
  })
);

// Parsers
app.use(cookieParser());
app.use(express.json());

// Local mock S3 upload endpoint for development with dummy credentials
if (config.AWS_ACCESS_KEY_ID === 'dummy_aws_key') {
  app.put('/api/mock-s3/works/:userId/:filename', express.raw({ type: '*/*', limit: '500mb' }), (req: Request, res: Response) => {
    const { userId, filename } = req.params;
    const mockS3Dir = path.join(process.cwd(), 'mock-s3', 'works', userId);
    fs.mkdirSync(mockS3Dir, { recursive: true });
    fs.writeFileSync(path.join(mockS3Dir, filename), req.body as Buffer);
    res.sendStatus(200);
  });
}


// Health Check Endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date(),
  });
});

// Mount routes
app.use('/api/auth', authRouter);
app.use('/api/works', worksRouter);
app.use('/api/detection', detectionRouter);
app.use('/api/certificates', certificatesRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/split-sheets', splitSheetsRouter);
app.use('/api/wallet', walletRouter);



// 404 handler
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Cannot ${req.method} ${req.url}`,
    },
  });
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error({ err, path: req.path }, 'Unhandled error');
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
});

export default app;
