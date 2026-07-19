import { z } from 'zod';

const ALLOWED_MIME_TYPES = [
  'audio/mpeg',       // .mp3
  'audio/wav',        // .wav
  'audio/x-wav',      // .wav variant
  'audio/flac',       // .flac
  'audio/aac',        // .aac
  'audio/ogg',        // .ogg
  'audio/mp4',        // .m4a
  'video/mp4',        // .mp4
] as const;

const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024; // 500MB

export const initiateUploadSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200),
    artistName: z.string().min(1).max(200),
    genre: z.string().max(100).optional(),
    yearCreated: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
    coCreators: z.string().max(500).optional(),
    fileName: z.string().min(1).max(255),
    mimeType: z.enum(ALLOWED_MIME_TYPES, {
      errorMap: () => ({ message: 'File type not supported' }),
    }),
    fileSizeBytes: z
      .number()
      .int()
      .positive()
      .max(MAX_FILE_SIZE_BYTES, 'File size exceeds 500MB limit'),
  }),
});

export const confirmUploadSchema = z.object({
  params: z.object({
    workId: z.string().cuid('Invalid work ID'),
  }),
  body: z.object({
    fileHash: z.string().length(64, 'Invalid SHA-256 hash — must be 64 hex characters'),
  }),
});

export type InitiateUploadInput = z.infer<typeof initiateUploadSchema>['body'];
export type ConfirmUploadInput = z.infer<typeof confirmUploadSchema>['body'];
