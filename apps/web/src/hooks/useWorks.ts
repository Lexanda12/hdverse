import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

export interface Work {
  id: string;
  title: string;
  artistName: string;
  genre?: string;
  isrc: string;
  status: 'PROCESSING' | 'ACTIVE' | 'FAILED';
  fingerprintStatus: string;
  timestampedAt?: string;
  certificateS3Key?: string;
  createdAt: string;
  certificate?: {
    id: string;
    certificateNumber: string;
    verificationUrl: string;
    issuedAt: string;
  };
}

export function useWork(workId: string | null) {
  return useQuery({
    queryKey: ['work', workId],
    queryFn: async () => {
      const res = await apiClient.get(`/works/${workId}`);
      return res.data.data.work as Work;
    },
    enabled: !!workId,
    refetchInterval: (query) => {
      const work = query.state.data;
      if (!work) return 2000;
      if (work.status === 'PROCESSING') return 2000;
      return false;
    },
  });
}

export function useWorks() {
  return useQuery({
    queryKey: ['works'],
    queryFn: async () => {
      const res = await apiClient.get('/works');
      return res.data.data.works as Work[];
    },
  });
}

export function useInitiateUpload() {
  return useMutation({
    mutationFn: async (data: {
      title: string;
      artistName: string;
      genre?: string;
      yearCreated?: number;
      coCreators?: string;
      fileName: string;
      mimeType: string;
      fileSizeBytes: number;
    }) => {
      const res = await apiClient.post('/works/upload/initiate', data);
      return res.data.data as {
        workId: string;
        uploadUrl: string;
        s3Key: string;
        isrc: string;
        expiresInSeconds: number;
      };
    },
  });
}

export function useConfirmUpload() {
  return useMutation({
    mutationFn: async ({
      workId,
      fileHash,
    }: {
      workId: string;
      fileHash: string;
    }) => {
      const res = await apiClient.post(`/works/${workId}/confirm`, {
        fileHash,
      });
      return res.data.data;
    },
  });
}
