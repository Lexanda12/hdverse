import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { ROUTES } from '../lib/routes';
import Button from '../components/ui/Button';
import { 
  CheckCircle, 
  Download, 
  Copy, 
  Check, 
  Plus, 
  QrCode, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';

interface Certificate {
  id: string;
  certificateNumber: string;
  s3Key: string;
  verificationUrl: string;
  issuedAt: string;
  work: {
    title: string;
    artistName: string;
    isrc: string;
    genre?: string;
    yearCreated?: number;
    coCreators?: string;
    fileHash: string;
    timestampedAt?: string;
    fingerprintStatus: string;
  };
}

export default function CertificatePage() {
  const { workId } = useParams<{ workId: string }>();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [animate, setAnimate] = useState(false);

  const { data: cert, isLoading, isError } = useQuery({
    queryKey: ['certificate', workId],
    queryFn: async () => {
      const res = await apiClient.get(`/certificates/work/${workId}`);
      return res.data.data as Certificate;
    },
    enabled: !!workId,
  });

  useEffect(() => {
    if (!isLoading && cert) {
      const timer = setTimeout(() => setAnimate(true), 50);
      return () => clearTimeout(timer);
    }
  }, [isLoading, cert]);

  const handleDownload = async () => {
    if (!workId) return;
    try {
      const res = await apiClient.get(`/certificates/work/${workId}/download`);
      if (res.data?.data?.downloadUrl) {
        window.open(res.data.data.downloadUrl, '_blank');
      }
    } catch (err) {
      console.error('Failed to download certificate', err);
    }
  };

  const handleCopyLink = () => {
    if (!cert?.verificationUrl) return;
    navigator.clipboard.writeText(cert.verificationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-verse-magenta animate-spin mb-4" />
        <p className="text-verse-muted">Loading certificate details...</p>
      </div>
    );
  }

  if (isError || !cert) {
    return (
      <div className="max-w-md mx-auto mt-16 p-8 bg-verse-charcoal border border-verse-error/30 rounded-lg text-center shadow-xl">
        <AlertCircle className="w-12 h-12 text-verse-error mx-auto mb-4" />
        <h2 className="font-display text-xl font-bold text-white mb-2">
          Certificate Unreachable
        </h2>
        <p className="text-verse-muted text-sm mb-6">
          The certificate for this work is not issued yet or is unavailable.
        </p>
        <Button variant="secondary" onClick={() => navigate(ROUTES.DASHBOARD)}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const truncatedHash = cert.work.fileHash.slice(0, 16) + '...' + cert.work.fileHash.slice(-16);

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 font-body">
      {/* Success banner */}
      <div className="bg-verse-teal/10 border border-verse-teal/20 text-verse-teal rounded-lg px-4 py-3 mb-8 flex items-center gap-2 text-sm font-medium shadow-sm">
        <CheckCircle className="w-4 h-4 flex-shrink-0" />
        <span>✦ Your work is now protected and certified on the blockchain.</span>
      </div>

      {/* Certificate Card container with ease-in-up animation */}
      <div 
        className={`bg-verse-charcoal rounded-lg border border-white/5 overflow-hidden shadow-2xl transition-all duration-500 ease-out transform ${
          animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        {/* Top brand accent bar */}
        <div className="h-2 bg-gradient-to-r from-verse-magenta to-verse-magenta-mid" />
        
        <div className="p-8 md:p-12">
          {/* Certificate header */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-white/5 pb-8 mb-8">
            <div>
              <span className="text-[10px] font-bold text-verse-magenta uppercase tracking-widest">
                HD VERSE IP RECORD
              </span>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-white mt-1">
                Certificate of Ownership
              </h1>
              <p className="text-xs text-verse-muted mt-2">
                This document certifies that the creative work detailed below has been formally registered.
              </p>
            </div>
            
            <div className="flex flex-col items-end gap-1.5">
              <span className="text-[10px] text-verse-muted uppercase tracking-wider">
                CERTIFICATE NUMBER
              </span>
              <span className="font-mono text-sm text-verse-teal font-semibold bg-verse-teal/5 border border-verse-teal/10 px-3 py-1 rounded-sm">
                {cert.certificateNumber}
              </span>
            </div>
          </div>

          {/* Details grid */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-6">
              <DetailField label="WORK TITLE" value={cert.work.title} />
              <DetailField label="CREATOR / ARTIST" value={cert.work.artistName} />
              <DetailField label="ISRC CODE" value={cert.work.isrc} isMono isTeal />
              {cert.work.genre && <DetailField label="GENRE" value={cert.work.genre} />}
            </div>

            <div className="space-y-6">
              <DetailField label="REGISTRATION DATE" value={new Date(cert.issuedAt).toUTCString()} />
              <DetailField label="SHA-256 FILE HASH" value={truncatedHash} isMono />
              
              <div>
                <span className="text-[10px] font-bold text-verse-muted uppercase tracking-wider block mb-1">
                  BLOCKCHAIN TIMESTAMP
                </span>
                <span className="text-xs text-verse-orange bg-verse-orange/5 border border-verse-orange/10 px-2 py-0.5 rounded-sm font-mono font-medium">
                  {cert.work.timestampedAt 
                    ? `RFC 3161 SECURE TIMESTAMP (VERIFIED)`
                    : 'TIMESTAMP PENDING'}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-verse-muted uppercase tracking-wider block mb-1">
                  FINGERPRINT REGISTRY
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-sm font-medium ${
                  cert.work.fingerprintStatus === 'REGISTERED' 
                    ? 'text-verse-teal bg-verse-teal/5 border border-verse-teal/10'
                    : 'text-verse-orange bg-verse-orange/5 border border-verse-orange/10'
                }`}>
                  {cert.work.fingerprintStatus === 'REGISTERED' 
                    ? 'ACRCLOUD AUDIO FINGERPRINT'
                    : 'PROCESSING AUDIO FINGERPRINT'}
                </span>
              </div>
            </div>
          </div>

          {/* Verification section & QR code */}
          <div className="bg-verse-elevated border border-white/5 rounded-lg p-6 flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <div className="space-y-2 flex-grow">
              <h3 className="text-sm font-semibold text-white">Immutable Verification Link</h3>
              <p className="text-xs text-verse-muted max-w-md">
                Anyone can verify the authenticity of this certificate at any time by scanning the QR code or visiting the URL.
              </p>
              
              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="text" 
                  readOnly 
                  value={cert.verificationUrl}
                  className="bg-verse-charcoal border border-white/5 text-xs text-verse-slate rounded-md px-3 py-2 w-full max-w-sm focus:outline-none"
                />
                <button 
                  onClick={handleCopyLink}
                  className="p-2 bg-verse-charcoal border border-white/5 hover:border-verse-magenta rounded-md text-verse-slate hover:text-white transition-colors"
                  title="Copy link"
                >
                  {copied ? <Check className="w-4 h-4 text-verse-teal" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Styled QR Code Box placeholder */}
            <div className="flex flex-col items-center justify-center p-3 bg-white rounded-md flex-shrink-0">
              <QrCode className="w-24 h-24 text-verse-ink" />
              <span className="text-[9px] text-verse-ink font-bold mt-1 tracking-wider uppercase">
                SCAN TO VERIFY
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-between pt-4 border-t border-white/5">
            <Button variant="secondary" className="flex items-center gap-2" onClick={() => navigate(ROUTES.UPLOAD)}>
              <Plus className="w-4 h-4" />
              Register Another Work
            </Button>

            <Button variant="primary" className="flex items-center gap-2" onClick={handleDownload}>
              <Download className="w-4 h-4" />
              Download PDF Evidence
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailField({ 
  label, 
  value, 
  isMono = false,
  isTeal = false 
}: { 
  label: string; 
  value: string; 
  isMono?: boolean;
  isTeal?: boolean;
}) {
  return (
    <div>
      <span className="text-[10px] font-bold text-verse-muted uppercase tracking-wider block mb-1">
        {label}
      </span>
      <span className={`text-sm font-medium ${isTeal ? 'text-verse-teal' : 'text-white'} ${isMono ? 'font-mono' : ''}`}>
        {value}
      </span>
    </div>
  );
}
