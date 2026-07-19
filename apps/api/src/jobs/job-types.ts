export interface CertificatePipelineJobData {
  workId: string;
  userId: string;
  s3Key: string;
  fileHash: string;
  isrc: string;
}

export interface DetectionCheckJobData {
  workId: string;
  acrcloudId: string;
}

export interface EmailNotificationJobData {
  type: 'CERTIFICATE_READY' | 'DETECTION_ALERT';
  userId: string;
  workId: string;
  recipientEmail: string;
  recipientName: string;
  payload: Record<string, unknown>;
}
