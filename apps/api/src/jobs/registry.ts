import { Queue } from 'bullmq';
import { redis } from '../lib/redis';
import { QUEUE_NAMES } from './queues';

const connection = redis;

export const certificatePipelineQueue = new Queue(
  QUEUE_NAMES.CERTIFICATE_PIPELINE,
  { connection }
);

export const detectionCheckQueue = new Queue(
  QUEUE_NAMES.DETECTION_CHECK,
  { connection }
);

export const emailNotificationQueue = new Queue(
  QUEUE_NAMES.EMAIL_NOTIFICATION,
  { connection }
);

export const queues = {
  certificatePipeline: certificatePipelineQueue,
  detectionCheck: detectionCheckQueue,
  emailNotification: emailNotificationQueue,
};
