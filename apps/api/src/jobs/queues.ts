export const QUEUE_NAMES = {
  CERTIFICATE_PIPELINE: 'certificate-pipeline',
  DETECTION_CHECK: 'detection-check',
  EMAIL_NOTIFICATION: 'email-notification',
} as const;

export type QueueName = typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES];
