import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../lib/api';
import { ROUTES } from '../lib/routes';
import Button from '../components/ui/Button';
import { 
  Loader2, 
  Shield, 
  Download, 
  Users, 
  Radio, 
  AlertTriangle, 
  Music, 
  Globe,
  CheckCircle2
} from 'lucide-react';

interface Work {
  id: string;
  title: string;
  artistName: string;
  genre?: string;
  yearCreated?: number;
  coCreators?: string;
  fileHash: string;
  isrc: string;
  status: 'PROCESSING' | 'ACTIVE' | 'FAILED';
  fingerprintStatus: 'PENDING' | 'REGISTERED' | 'FAILED';
  createdAt: string;
}

interface Certificate {
  id: string;
  certificateNumber: string;
}

interface SplitSheetEntry {
  id: string;
  collaboratorName: string;
  collaboratorEmail: string;
  percentage: number;
  confirmationStatus: 'PENDING' | 'CONFIRMED' | 'DECLINED';
}

interface SplitSheet {
  id: string;
  status: 'DRAFT' | 'PENDING_CONFIRMATION' | 'LOCKED';
  lockedHash?: string;
  lockedAt?: string;
  entries: SplitSheetEntry[];
}

interface DetectionAlert {
  id: string;
  platform: string;
  detectedAt: string;
  matchConfidence: string;
  sourceUrl?: string;
}

export default function WorkDetailPage() {
  const { workId } = useParams<{ workId: string }>();
  const navigate = useNavigate();
  
  const [work, setWork] = useState<Work | null>(null);
  const [cert, setCert] = useState<Certificate | null>(null);
  const [splitSheet, setSplitSheet] = useState<SplitSheet | null>(null);
  const [alerts, setAlerts] = useState<DetectionAlert[]>([]);
  const [distributionEligible, setDistributionEligible] = useState<boolean>(true);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    if (!workId) return;
    try {
      // 1. Fetch work
      const workRes = await apiClient.get(`/works/${workId}`);
      setWork(workRes.data.data.work);

      // 2. Fetch certificate
      try {
        const certRes = await apiClient.get(`/certificates/work/${workId}`);
        setCert(certRes.data.data);
      } catch (err: any) {
        // 404 is expected if processing
        setCert(null);
      }

      // 3. Fetch split sheet
      try {
        const splitRes = await apiClient.get(`/split-sheets/work/${workId}`);
        setSplitSheet(splitRes.data.data);
      } catch (err: any) {
        // 404 split sheet not found
        setSplitSheet(null);
      }

      // 4. Fetch alerts
      try {
        const alertsRes = await apiClient.get('/detection/alerts');
        // Filter alerts for this work
        const filteredAlerts = alertsRes.data.data.filter(
          (a: any) => a.workId === workId
        );
        setAlerts(filteredAlerts);
      } catch (err) {
        setAlerts([]);
      }

      // 5. Fetch eligibility
      try {
        const eligibleRes = await apiClient.get(
          `/split-sheets/work/${workId}/distribution-check`
        );
        setDistributionEligible(eligibleRes.data.data.eligible);
      } catch (err) {
        setDistributionEligible(true);
      }

    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load work details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [workId]);

  const handleDownloadCert = async () => {
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-verse-magenta animate-spin mb-4" />
        <p className="text-verse-muted">Loading work details...</p>
      </div>
    );
  }

  if (error || !work) {
    return (
      <div className="max-w-md mx-auto mt-16 p-8 bg-verse-charcoal border border-white/5 rounded-lg text-center shadow-xl">
        <AlertTriangle className="w-12 h-12 text-verse-orange mx-auto mb-4" />
        <h2 className="font-display text-xl font-bold text-white mb-2">Error Loading Work</h2>
        <p className="text-verse-muted text-sm mb-6">{error || 'Work not found.'}</p>
        <Button variant="secondary" onClick={() => navigate(ROUTES.DASHBOARD)}>
          Back to Dashboard
        </Button>
      </div>
    );
  }


  return (
    <div className="max-w-4xl mx-auto py-8 px-4 font-body space-y-8">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl font-bold text-white">
              {work.title}
            </h1>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium uppercase ${
              work.status === 'ACTIVE' 
                ? 'bg-verse-teal/10 text-verse-teal' 
                : work.status === 'PROCESSING' 
                ? 'bg-verse-orange/10 text-verse-orange animate-pulse'
                : 'bg-verse-error/10 text-verse-error'
            }`}>
              {work.status}
            </span>
          </div>
          <p className="text-verse-slate mt-1.5 flex items-center gap-1.5 text-sm">
            <Music className="w-3.5 h-3.5 text-verse-magenta" />
            {work.artistName}
          </p>
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => navigate(ROUTES.DASHBOARD)}>
            Dashboard
          </Button>
          
          {distributionEligible ? (
            <Button 
              variant="primary" 
              className="flex items-center gap-2"
              onClick={() => navigate(ROUTES.DISTRIBUTE.replace(':workId', work.id))}
            >
              <Globe className="w-4 h-4" />
              Distribute Work
            </Button>
          ) : (
            <div className="text-xs text-verse-muted max-w-[200px] text-right">
              Awaiting collaborator splits lock before distribution.
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Left Column — Metadata card */}
        <div className="md:col-span-2 space-y-8">
          
          {/* Metadata Card */}
          <div className="bg-verse-charcoal border border-white/5 rounded-lg p-6 shadow-sm">
            <h2 className="font-display text-lg font-bold text-white mb-4">Metadata & Registry</h2>
            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
              <MetadataItem label="Genre" value={work.genre || 'Not specified'} />
              <MetadataItem label="Year Created" value={work.yearCreated?.toString() || 'Not specified'} />
              <MetadataItem label="ISRC Assignment" value={work.isrc} isMono />
              <MetadataItem 
                label="Registration Date" 
                value={new Date(work.createdAt).toLocaleDateString(undefined, { 
                  dateStyle: 'medium' 
                })} 
              />
              <div className="col-span-2">
                <MetadataItem label="SHA-256 File Hash" value={work.fileHash} isMono />
              </div>
            </div>
          </div>

          {/* Split Sheet section */}
          <div className="bg-verse-charcoal border border-white/5 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
              <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-verse-magenta" />
                Ownership Split Sheet
              </h2>

              {splitSheet && (
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium uppercase ${
                  splitSheet.status === 'LOCKED' 
                    ? 'bg-verse-teal/10 text-verse-teal' 
                    : 'bg-verse-orange/10 text-verse-orange'
                }`}>
                  {splitSheet.status}
                </span>
              )}
            </div>

            {!splitSheet ? (
              <div className="text-center py-6">
                <p className="text-sm text-verse-muted mb-4">
                  Solo work — no split sheet has been created yet.
                </p>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => navigate(ROUTES.SPLIT_SHEET.replace(':workId', work.id))}
                >
                  Create Split Sheet
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3">
                  {splitSheet.entries.map((entry) => (
                    <div 
                      key={entry.id} 
                      className="flex items-center justify-between p-3 bg-verse-elevated rounded-md border border-white/5"
                    >
                      <div>
                        <p className="text-sm font-semibold text-white">{entry.collaboratorName}</p>
                        <p className="text-xs text-verse-muted">{entry.collaboratorEmail}</p>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-bold text-white">{entry.percentage}%</span>
                        <span className={`text-xs px-2 py-0.5 rounded-sm font-medium ${
                          entry.confirmationStatus === 'CONFIRMED' 
                            ? 'text-verse-teal bg-verse-teal/5 border border-verse-teal/10'
                            : entry.confirmationStatus === 'DECLINED'
                            ? 'text-verse-error bg-verse-error/5 border border-verse-error/10'
                            : 'text-verse-orange bg-verse-orange/5 border border-verse-orange/10'
                        }`}>
                          {entry.confirmationStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {splitSheet.status === 'LOCKED' && splitSheet.lockedHash && (
                  <div className="pt-2">
                    <p className="text-[10px] text-verse-muted uppercase tracking-wider block mb-1">
                      Locked Splits Cryptographic Sign Hash
                    </p>
                    <p className="text-xs font-mono text-verse-teal bg-verse-teal/5 border border-verse-teal/10 p-2 rounded-md break-all">
                      {splitSheet.lockedHash}
                    </p>
                  </div>
                )}

                {splitSheet.status !== 'LOCKED' && (
                  <div className="flex justify-end pt-2">
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => navigate(ROUTES.SPLIT_SHEET.replace(':workId', work.id))}
                    >
                      Manage Split Sheet
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column — Certificate and Detections */}
        <div className="space-y-8">
          
          {/* Certificate Card */}
          <div className="bg-verse-charcoal border border-white/5 rounded-lg p-6 shadow-sm space-y-4">
            <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-verse-teal" />
              IP Protection
            </h2>

            {cert ? (
              <div className="space-y-3">
                <div className="text-verse-teal font-medium text-sm flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Certificate Issued ✓
                </div>
                
                <div className="flex flex-col gap-2 pt-2">
                  <Button 
                    variant="primary" 
                    size="sm"
                    className="w-full flex items-center justify-center gap-2"
                    onClick={handleDownloadCert}
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </Button>
                  
                  <Link 
                    to={ROUTES.CERTIFICATE.replace(':workId', work.id)}
                    className="text-xs text-verse-magenta hover:underline text-center"
                  >
                    View details & QR Code
                  </Link>
                </div>
              </div>
            ) : work.status === 'PROCESSING' ? (
              <div className="py-4 text-center space-y-2">
                <Loader2 className="w-6 h-6 text-verse-orange animate-spin mx-auto" />
                <p className="text-xs text-verse-orange font-medium">Processing Certificate...</p>
                <p className="text-[11px] text-verse-muted">Typically takes less than a minute.</p>
              </div>
            ) : (
              <div className="py-4 text-center space-y-2">
                <p className="text-xs text-verse-error font-medium">Certification Failed</p>
                <p className="text-[11px] text-verse-muted">Check your transaction logs.</p>
              </div>
            )}
          </div>

          {/* Detection alerts section */}
          <div className="bg-verse-charcoal border border-white/5 rounded-lg p-6 shadow-sm space-y-4">
            <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-verse-yellow animate-pulse" />
              Active Monitoring
            </h2>

            {work.fingerprintStatus === 'REGISTERED' ? (
              <div className="space-y-4">
                <div className="text-verse-teal text-xs font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Monitoring Active (ACRCloud)
                </div>

                <div className="border-t border-white/5 pt-3">
                  <span className="text-[10px] text-verse-muted uppercase font-bold tracking-wider">
                    Infringements
                  </span>
                  
                  {alerts.length === 0 ? (
                    <p className="text-xs text-verse-slate mt-2">
                      No unauthorized matches detected yet.
                    </p>
                  ) : (
                    <div className="space-y-2 mt-2">
                      {alerts.map((alert) => (
                        <div 
                          key={alert.id}
                          className="bg-verse-elevated border-l-2 border-verse-yellow p-2 rounded-sm text-xs"
                        >
                          <div className="flex justify-between font-semibold text-white">
                            <span>{alert.platform}</span>
                            <span className="text-verse-yellow">{alert.matchConfidence}% confidence</span>
                          </div>
                          <span className="text-[10px] text-verse-muted block mt-1">
                            {new Date(alert.detectedAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-2 text-left">
                <p className="text-xs text-verse-muted">
                  Audio fingerprint registration is processing. Once verified, active web detection will initiate.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

function MetadataItem({ 
  label, 
  value, 
  isMono = false 
}: { 
  label: string; 
  value: string; 
  isMono?: boolean;
}) {
  return (
    <div>
      <span className="text-[10px] font-bold text-verse-muted uppercase tracking-wider block mb-1">
        {label}
      </span>
      <span className={`text-sm font-semibold text-white break-all ${isMono ? 'font-mono text-xs' : ''}`}>
        {value}
      </span>
    </div>
  );
}
