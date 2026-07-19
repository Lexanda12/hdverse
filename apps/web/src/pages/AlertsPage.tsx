import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';
import { Loader2, Radio, BellOff, Download, Sparkles } from 'lucide-react';
import Button from '../components/ui/Button';

interface DetectionAlert {
  id: string;
  workId: string;
  platform: string;
  detectedAt: string;
  matchConfidence: number;
  sourceUrl?: string;
  work?: {
    title: string;
  };
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<DetectionAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAlerts = async () => {
    try {
      const res = await apiClient.get('/detection/alerts');
      setAlerts(res.data.data);
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message || 
        'Failed to fetch detection alerts.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleDownloadCert = async (workId: string) => {
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
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-verse-magenta animate-spin mb-4" />
        <p className="text-verse-muted">Scanning global networks for matches...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 font-body space-y-6">
      <div>
        <h1 className="font-display text-[32px] font-bold text-white leading-tight">
          Detection Alerts
        </h1>
        <p className="text-verse-slate mt-1.5 text-sm">
          We monitor your registered works for unauthorized use across global web platforms.
        </p>
      </div>

      {error && (
        <div className="bg-verse-error/10 border border-verse-error/20 text-verse-error p-4 rounded-md text-sm">
          {error}
        </div>
      )}

      {alerts.length === 0 ? (
        /* Empty State */
        <div className="bg-verse-charcoal border border-white/5 rounded-[20px] p-12 text-center relative overflow-hidden shadow-xl">
          {/* Accent glow overlay */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-verse-magenta/10 rounded-full blur-3xl pointer-events-none" />
          
          <BellOff className="w-12 h-12 text-verse-muted mx-auto mb-4" />
          <h3 className="font-display text-lg font-bold text-white mb-2">
            ✦ No alerts yet
          </h3>
          <p className="text-sm text-verse-muted max-w-md mx-auto leading-relaxed">
            We're actively monitoring your tracks. You will receive notifications here and via your email when unauthorized matches are identified.
          </p>
        </div>
      ) : (
        /* Alerts List */
        <div className="space-y-4">
          {alerts.map((alert) => {
            const confidenceLabel = 
              alert.matchConfidence >= 80 ? 'High' : 
              alert.matchConfidence >= 50 ? 'Medium' : 'Low';

            return (
              <div 
                key={alert.id}
                className="bg-verse-charcoal border border-white/5 border-l-[4px] border-l-verse-yellow rounded-[20px] p-6 shadow-md transition-all duration-150 hover:border-white/10 hover:border-l-verse-yellow"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    {/* Yellow badge */}
                    <span className="inline-flex items-center gap-1 bg-verse-yellow/10 border border-verse-yellow/20 text-verse-yellow text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full uppercase mb-2">
                      <Radio className="w-3 h-3 animate-pulse" />
                      ⚠ MATCH DETECTED
                    </span>
                    
                    <h3 className="text-lg font-bold text-white">
                      {alert.work?.title || 'Unknown Work'}
                    </h3>
                    
                    <p className="text-xs text-verse-slate">
                      Detected on <strong className="text-white">{alert.platform}</strong>
                    </p>
                    
                    <p className="text-[11px] text-verse-muted">
                      Matched date: {new Date(alert.detectedAt).toLocaleDateString(undefined, {
                        dateStyle: 'long'
                      })}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-3 justify-between">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] text-verse-muted uppercase block">
                        Match Confidence
                      </span>
                      <span className="text-sm font-semibold text-white">
                        {alert.matchConfidence}% ({confidenceLabel})
                      </span>
                    </div>

                    <Button 
                      variant="secondary"
                      size="sm"
                      className="flex items-center gap-1.5 whitespace-nowrap"
                      onClick={() => handleDownloadCert(alert.workId)}
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download Evidence PDF
                    </Button>
                  </div>
                </div>

                {/* Upgrade prompt inline banner */}
                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-xs">
                  <div className="text-verse-muted flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-verse-magenta" />
                    <span>Get instant weekly monitoring reports & auto takedowns</span>
                  </div>
                  <a 
                    href="/pricing"
                    className="text-verse-magenta font-semibold hover:underline"
                  >
                    Upgrade to Pro →
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
