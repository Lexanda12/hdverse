import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Shield, CheckCircle, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { apiClient } from '../lib/api';
import { ROUTES } from '../lib/routes';

interface CertificateVerification {
  id: string;
  certificateNumber: string;
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
    status: string;
  };
}

export default function VerifyPage() {
  const { certificateId } = useParams<{ certificateId: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['verify', certificateId],
    queryFn: async () => {
      const res = await apiClient.get(
        `/certificates/${certificateId}/verify`
      );
      return res.data.data.certificate as CertificateVerification;
    },
    enabled: !!certificateId,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto mt-16 text-center">
        <Loader2 className="w-8 h-8 text-verse-magenta animate-spin mx-auto mb-4" />
        <p className="text-verse-muted">Verifying certificate...</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="max-w-2xl mx-auto mt-16">
        <div className="bg-verse-charcoal border border-verse-error/30 rounded-xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-verse-error mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold text-white mb-2">
            Certificate Not Found
          </h1>
          <p className="text-verse-muted text-sm mb-6">
            This certificate ID does not exist or has been revoked.
          </p>
          <Link
            to={ROUTES.HOME}
            className="text-verse-magenta hover:text-verse-magenta-mid text-sm transition-colors"
          >
            ← Return to HD Verse
          </Link>
        </div>
      </div>
    );
  }

  const hashDisplay =
    data.work.fileHash.substring(0, 16) +
    '...' +
    data.work.fileHash.substring(48);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Verified header */}
      <div className="text-center mb-8 mt-4">
        <div className="w-20 h-20 rounded-full bg-verse-teal/10 border border-verse-teal/30
                        flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-verse-teal" />
        </div>
        <h1 className="font-display text-3xl font-bold text-white mb-2">
          Certificate Verified
        </h1>
        <p className="text-verse-muted">
          This work has been timestamped and its ownership recorded by HD Verse.
        </p>
      </div>

      {/* Certificate card */}
      <div className="bg-verse-charcoal border border-verse-elevated rounded-xl overflow-hidden">
        {/* Top accent */}
        <div className="h-1.5 bg-gradient-to-r from-verse-magenta to-verse-magenta-deep" />

        <div className="p-6">
          {/* Cert number + badge */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs text-verse-muted uppercase tracking-wide mb-1">
                Certificate No.
              </p>
              <p className="font-mono text-verse-teal font-semibold">
                {data.certificateNumber}
              </p>
            </div>
            <div className="flex items-center gap-2 bg-verse-teal/10 border border-verse-teal/30
                            rounded-full px-3 py-1.5">
              <Shield className="w-3.5 h-3.5 text-verse-teal" />
              <span className="text-xs text-verse-teal font-medium">Authentic</span>
            </div>
          </div>

          {/* Work details grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Field label="Work Title" value={data.work.title} />
            <Field label="Artist / Creator" value={data.work.artistName} />
            <Field label="ISRC" value={data.work.isrc} mono teal />
            {data.work.genre && (
              <Field label="Genre" value={data.work.genre} />
            )}
            {data.work.yearCreated && (
              <Field label="Year Created" value={data.work.yearCreated.toString()} />
            )}
            {data.work.coCreators && (
              <Field label="Co-Creators" value={data.work.coCreators} />
            )}
          </div>

          {/* Timestamp section */}
          <div className="bg-verse-elevated rounded-lg p-4 mb-4">
            <p className="text-xs text-verse-muted uppercase tracking-wide mb-3">
              Ownership Proof
            </p>
            <div className="flex flex-col gap-2">
              {data.work.timestampedAt && (
                <div className="flex items-start justify-between gap-4">
                  <span className="text-xs text-verse-muted flex-shrink-0">RFC 3161 Timestamp</span>
                  <span className="text-xs text-white font-mono text-right">
                    {new Date(data.work.timestampedAt).toISOString().replace('T', ' ').slice(0, 19)} UTC
                  </span>
                </div>
              )}
              <div className="flex items-start justify-between gap-4">
                <span className="text-xs text-verse-muted flex-shrink-0">SHA-256 Hash</span>
                <span className="text-xs text-verse-slate font-mono text-right">{hashDisplay}</span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-xs text-verse-muted flex-shrink-0">Fingerprint</span>
                <span className={`text-xs font-medium ${
                  data.work.fingerprintStatus === 'REGISTERED'
                    ? 'text-verse-teal'
                    : 'text-verse-muted'
                }`}>
                  {data.work.fingerprintStatus === 'REGISTERED'
                    ? 'Registered with ACRCloud'
                    : 'Pending registration'}
                </span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-xs text-verse-muted flex-shrink-0">Issued</span>
                <span className="text-xs text-white">
                  {new Date(data.issuedAt).toDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-verse-muted">
              Verified by HD Verse · myhdverse.com
            </p>
            <Link
              to={ROUTES.REGISTER}
              className="flex items-center gap-1 text-xs text-verse-magenta
                         hover:text-verse-magenta-mid transition-colors"
            >
              Protect your music
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Bottom accent */}
        <div className="h-1.5 bg-gradient-to-r from-verse-magenta to-verse-magenta-deep" />
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  mono = false,
  teal = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  teal?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-verse-muted uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-sm font-medium ${teal ? 'text-verse-teal' : 'text-white'} ${mono ? 'font-mono' : ''}`}>
        {value}
      </p>
    </div>
  );
}
