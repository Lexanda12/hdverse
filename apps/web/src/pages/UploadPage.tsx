import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Music, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '../stores/auth.store';
import { useInitiateUpload, useConfirmUpload, useWork } from '../hooks/useWorks';
import { sha256File } from '../lib/hash';
import { ROUTES } from '../lib/routes';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import axios from 'axios';

type UploadStep = 'metadata' | 'file' | 'processing' | 'complete' | 'error';

const ACCEPTED_TYPES = [
  'audio/mpeg',
  'audio/wav',
  'audio/x-wav',
  'audio/flac',
  'audio/aac',
  'audio/ogg',
  'audio/mp4',
  'video/mp4',
];

export default function UploadPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<UploadStep>('metadata');
  const [workId, setWorkId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const [metadata, setMetadata] = useState({
    title: '',
    artistName: user?.fullName || '',
    genre: '',
    yearCreated: new Date().getFullYear().toString(),
    coCreators: '',
  });
  const [metaErrors, setMetaErrors] = useState<Record<string, string>>({});

  const initiateUpload = useInitiateUpload();
  const confirmUpload = useConfirmUpload();
  const { data: work } = useWork(workId);

  // Watch pipeline status and transition steps
  useEffect(() => {
    if (!workId || step !== 'processing') return;
    if (work?.status === 'ACTIVE') setStep('complete');
    if (work?.status === 'FAILED') {
      setErrorMessage('Certificate generation failed. Please try again.');
      setStep('error');
    }
  }, [work?.status, workId, step]);

  // ── Step 1: Metadata ─────────────────────────────────────────
  const validateMetadata = () => {
    const errs: Record<string, string> = {};
    if (!metadata.title.trim()) errs.title = 'Work title is required';
    if (!metadata.artistName.trim()) errs.artistName = 'Artist name is required';
    setMetaErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleMetadataNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateMetadata()) setStep('file');
  };

  // ── Step 2: File upload ──────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setErrorMessage('File type not supported. Please upload an audio file.');
      return;
    }
    if (file.size > 500 * 1024 * 1024) {
      setErrorMessage('File must be under 500MB.');
      return;
    }
    setErrorMessage('');
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setErrorMessage('');

    try {
      // 1. Initiate upload — get presigned URL
      const { workId: id, uploadUrl } = await initiateUpload.mutateAsync({
        title: metadata.title,
        artistName: metadata.artistName,
        genre: metadata.genre || undefined,
        yearCreated: metadata.yearCreated
          ? parseInt(metadata.yearCreated)
          : undefined,
        coCreators: metadata.coCreators || undefined,
        fileName: selectedFile.name,
        mimeType: selectedFile.type,
        fileSizeBytes: selectedFile.size,
      });
      setWorkId(id);

      // 2. Upload binary to S3 / mock S3
      setUploadProgress(10);
      await axios.put(uploadUrl, selectedFile, {
        headers: { 'Content-Type': selectedFile.type },
        onUploadProgress: (e) => {
          const pct = Math.round(((e.loaded || 0) / (e.total || 1)) * 80);
          setUploadProgress(10 + pct);
        },
      });
      setUploadProgress(90);

      // 3. Compute SHA-256 hash and confirm
      const fileHash = await sha256File(selectedFile);
      await confirmUpload.mutateAsync({ workId: id, fileHash });
      setUploadProgress(100);

      // 4. Transition — React Query polling takes over from here
      setStep('processing');
    } catch (err: unknown) {
      const apiErr = err as {
        response?: { data?: { error?: { message?: string } } };
        message?: string;
      };
      const msg =
        apiErr.response?.data?.error?.message ||
        apiErr.message ||
        'Upload failed. Please try again.';
      setErrorMessage(msg);
      setStep('error');
    }
  };

  // ── Success ──────────────────────────────────────────────────
  if (step === 'complete' && work?.certificate) {
    return (
      <div className="max-w-lg mx-auto mt-12">
        <div className="bg-verse-charcoal rounded-xl border border-verse-elevated p-8 text-center shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-verse-teal/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-verse-teal" />
          </div>
          <h2 className="font-display text-2xl font-bold text-white mb-2">
            Certificate issued
          </h2>
          <p className="text-verse-muted text-sm mb-6">
            Your ownership has been timestamped and recorded on the blockchain.
          </p>

          <div className="bg-verse-elevated rounded-lg p-4 mb-6 text-left space-y-3">
            <div>
              <p className="text-xs text-verse-muted uppercase tracking-wide">Work</p>
              <p className="text-white font-medium">{work.title}</p>
            </div>
            <div>
              <p className="text-xs text-verse-muted uppercase tracking-wide">ISRC</p>
              <p className="text-verse-teal font-mono text-sm">{work.isrc}</p>
            </div>
            <div>
              <p className="text-xs text-verse-muted uppercase tracking-wide">
                Certificate No.
              </p>
              <p className="text-verse-teal font-mono text-sm">
                {work.certificate.certificateNumber}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              size="lg"
              onClick={() =>
                navigate(ROUTES.CERTIFICATE.replace(':workId', work.id))
              }
            >
              View Certificate
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={() => navigate(ROUTES.DASHBOARD)}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Processing ───────────────────────────────────────────────
  if (step === 'processing') {
    return (
      <div className="max-w-lg mx-auto mt-12">
        <div className="bg-verse-charcoal rounded-xl border border-verse-elevated p-8 text-center shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-verse-magenta/10 flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 text-verse-magenta animate-spin" />
          </div>
          <h2 className="font-display text-xl font-bold text-white mb-2">
            Generating your certificate
          </h2>
          <p className="text-verse-muted text-sm">
            Verifying file integrity, timestamping your work, and registering
            your audio fingerprint...
          </p>
          <div className="mt-6 bg-verse-elevated rounded-full h-1.5 overflow-hidden">
            <div className="bg-verse-magenta h-1.5 rounded-full animate-pulse w-3/4" />
          </div>
          <p className="text-xs text-verse-muted mt-4">
            This usually takes 5–15 seconds
          </p>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────
  if (step === 'error') {
    return (
      <div className="max-w-lg mx-auto mt-12">
        <div className="bg-verse-charcoal rounded-xl border border-verse-error/30 p-8 text-center shadow-2xl">
          <AlertCircle className="w-12 h-12 text-verse-error mx-auto mb-4" />
          <h2 className="font-display text-xl font-bold text-white mb-2">
            Something went wrong
          </h2>
          <p className="text-verse-muted text-sm mb-6">{errorMessage}</p>
          <Button
            onClick={() => {
              setStep('metadata');
              setWorkId(null);
              setUploadProgress(0);
              setSelectedFile(null);
              setErrorMessage('');
            }}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // ── Main form ────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-white">
          Protect your work
        </h1>
        <p className="text-verse-muted mt-2">
          Upload your beat or track and receive a timestamped ownership
          certificate.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-8">
        {(['metadata', 'file'] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                step === s
                  ? 'bg-verse-magenta text-white'
                  : step === 'file' && i === 0
                  ? 'bg-verse-teal text-verse-ink'
                  : 'bg-verse-elevated text-verse-muted'
              }`}
            >
              {step === 'file' && i === 0 ? '✓' : i + 1}
            </div>
            <span
              className={`text-sm ${step === s ? 'text-white' : 'text-verse-muted'}`}
            >
              {i === 0 ? 'Work details' : 'Upload file'}
            </span>
            {i === 0 && <div className="w-8 h-px bg-verse-elevated" />}
          </div>
        ))}
      </div>

      <div className="bg-verse-charcoal rounded-xl border border-verse-elevated p-8 shadow-2xl">
        {/* ── Step 1: Metadata ─────────────────────────────── */}
        {step === 'metadata' && (
          <form onSubmit={handleMetadataNext} className="flex flex-col gap-5" noValidate>
            <Input
              label="Work Title *"
              placeholder="e.g. Midnight Afrobeats Vol. 3"
              value={metadata.title}
              onChange={(e) =>
                setMetadata((p) => ({ ...p, title: e.target.value }))
              }
              error={metaErrors.title}
              autoFocus
            />
            <Input
              label="Artist / Creator Name *"
              placeholder="Your name or producer tag"
              value={metadata.artistName}
              onChange={(e) =>
                setMetadata((p) => ({ ...p, artistName: e.target.value }))
              }
              error={metaErrors.artistName}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Genre"
                placeholder="e.g. Afrobeats"
                value={metadata.genre}
                onChange={(e) =>
                  setMetadata((p) => ({ ...p, genre: e.target.value }))
                }
              />
              <Input
                label="Year Created"
                type="number"
                placeholder={new Date().getFullYear().toString()}
                value={metadata.yearCreated}
                onChange={(e) =>
                  setMetadata((p) => ({ ...p, yearCreated: e.target.value }))
                }
              />
            </div>
            <Input
              label="Co-Creators"
              placeholder="Other artists or producers (optional)"
              value={metadata.coCreators}
              onChange={(e) =>
                setMetadata((p) => ({ ...p, coCreators: e.target.value }))
              }
              hint="Add names of any collaborators on this work"
            />
            <div className="mt-2">
              <Button type="submit" size="lg">
                Continue to Upload →
              </Button>
            </div>
          </form>
        )}

        {/* ── Step 2: File ─────────────────────────────────── */}
        {step === 'file' && (
          <div className="flex flex-col gap-6">
            {/* Drop zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
                transition-colors duration-150 select-none
                ${
                  selectedFile
                    ? 'border-verse-teal bg-verse-teal/5'
                    : 'border-verse-elevated hover:border-verse-magenta hover:bg-verse-magenta/5'
                }
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES.join(',')}
                onChange={handleFileChange}
                className="hidden"
              />
              {selectedFile ? (
                <div className="flex flex-col items-center gap-3">
                  <Music className="w-10 h-10 text-verse-teal" />
                  <div>
                    <p className="text-white font-medium break-all">
                      {selectedFile.name}
                    </p>
                    <p className="text-verse-muted text-sm mt-1">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <p className="text-verse-teal text-xs">
                    Click to change file
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <Upload className="w-10 h-10 text-verse-muted" />
                  <div>
                    <p className="text-white font-medium">
                      Click to select your file
                    </p>
                    <p className="text-verse-muted text-sm mt-1">
                      MP3, WAV, FLAC, AAC, OGG, M4A, MP4 · Max 500MB
                    </p>
                  </div>
                </div>
              )}
            </div>

            {errorMessage && (
              <p className="text-sm text-verse-error">{errorMessage}</p>
            )}

            {/* Upload progress bar */}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div>
                <div className="flex justify-between text-xs text-verse-muted mb-1">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="bg-verse-elevated rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-verse-magenta h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setStep('metadata')}
                disabled={initiateUpload.isPending || confirmUpload.isPending}
              >
                ← Back
              </Button>
              <Button
                size="lg"
                onClick={handleUpload}
                loading={initiateUpload.isPending || confirmUpload.isPending}
                disabled={!selectedFile}
                className="flex-1"
              >
                Upload & Protect
              </Button>
            </div>

            <p className="text-xs text-verse-muted text-center">
              🔒 Your file is encrypted in transit and stored securely on AWS
              S3
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
