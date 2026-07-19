import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../lib/api';
import { ROUTES } from '../lib/routes';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { 
  Loader2, 
  AlertTriangle, 
  Users, 
  Trash2, 
  Plus, 
  Clock, 
  CheckCircle,
  FileText
} from 'lucide-react';

interface Work {
  id: string;
  title: string;
  artistName: string;
}

interface SplitSheetEntry {
  id?: string;
  collaboratorName: string;
  collaboratorEmail: string;
  percentage: number;
  confirmationStatus?: 'PENDING' | 'CONFIRMED' | 'DECLINED';
  confirmedAt?: string | null;
}

interface SplitSheet {
  id: string;
  status: 'DRAFT' | 'PENDING_CONFIRMATION' | 'LOCKED';
  lockedHash?: string;
  lockedAt?: string;
  entries: SplitSheetEntry[];
}

export default function SplitSheetPage() {
  const { workId } = useParams<{ workId: string }>();
  const navigate = useNavigate();

  const [work, setWork] = useState<Work | null>(null);
  const [splitSheet, setSplitSheet] = useState<SplitSheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state for creating split sheet
  const [formEntries, setFormEntries] = useState<SplitSheetEntry[]>([
    { collaboratorName: '', collaboratorEmail: '', percentage: 100 }
  ]);

  const loadData = async () => {
    if (!workId) return;
    try {
      // Load work
      const workRes = await apiClient.get(`/works/${workId}`);
      setWork(workRes.data.data.work);

      // Load split sheet
      try {
        const splitRes = await apiClient.get(`/split-sheets/work/${workId}`);
        setSplitSheet(splitRes.data.data);
      } catch (err: any) {
        // 404 Split sheet not found, set default form with creator name if available
        setSplitSheet(null);
        
        const creatorEmail = useAuthStore.getState().user?.email || '';
        const creatorName = useAuthStore.getState().user?.fullName || '';
        setFormEntries([
          { 
            collaboratorName: creatorName, 
            collaboratorEmail: creatorEmail, 
            percentage: 100 
          }
        ]);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load split sheet details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [workId]);

  const handleAddRow = () => {
    setFormEntries([...formEntries, { collaboratorName: '', collaboratorEmail: '', percentage: 0 }]);
  };

  const handleRemoveRow = (index: number) => {
    const next = [...formEntries];
    next.splice(index, 1);
    setFormEntries(next);
  };

  const handleFieldChange = (index: number, field: keyof SplitSheetEntry, value: any) => {
    const next = [...formEntries];
    if (field === 'percentage') {
      const cleanVal = parseInt(value, 10);
      next[index].percentage = isNaN(cleanVal) ? 0 : cleanVal;
    } else if (field === 'collaboratorName') {
      next[index].collaboratorName = value as string;
    } else if (field === 'collaboratorEmail') {
      next[index].collaboratorEmail = value as string;
    }
    setFormEntries(next);

  };

  const totalPercentage = formEntries.reduce((sum, entry) => sum + entry.percentage, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workId) return;
    if (totalPercentage !== 100) {
      setError('Ownership percentages must sum to exactly 100%.');
      return;
    }

    setSubmitLoading(true);
    setError('');

    try {
      const res = await apiClient.post('/split-sheets', {
        workId,
        entries: formEntries.map(e => ({
          collaboratorName: e.collaboratorName,
          collaboratorEmail: e.collaboratorEmail,
          percentage: e.percentage
        }))
      });
      setSplitSheet(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create split sheet.');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-verse-magenta animate-spin mb-4" />
        <p className="text-verse-muted">Loading split sheet...</p>
      </div>
    );
  }

  if (!work) {
    return (
      <div className="max-w-md mx-auto mt-16 p-8 bg-verse-charcoal border border-white/5 rounded-lg text-center shadow-xl">
        <AlertTriangle className="w-12 h-12 text-verse-orange mx-auto mb-4" />
        <h2 className="font-display text-xl font-bold text-white mb-2">Work Not Found</h2>
        <p className="text-verse-muted text-sm mb-6">The work requested does not exist.</p>
        <Button variant="secondary" onClick={() => navigate(ROUTES.DASHBOARD)}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 font-body space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Split Sheet</h1>
          <p className="text-sm text-verse-slate mt-1 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-verse-magenta" />
            {work.title}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => navigate(`/works/${workId}`)}>
          Back to Work Details
        </Button>
      </div>

      {error && (
        <div className="bg-verse-error/10 border border-verse-error/20 text-verse-error p-4 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* CASE 1: Split sheet is LOCKED */}
      {splitSheet && splitSheet.status === 'LOCKED' && (
        <div className="bg-verse-charcoal rounded-[20px] border border-white/5 overflow-hidden shadow-lg space-y-6 p-6">
          <div className="bg-verse-teal/10 border border-verse-teal/20 text-verse-teal rounded-lg px-4 py-3 flex items-center gap-2 text-sm font-medium">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>✓ LOCKED — Immutable since {splitSheet.lockedAt ? new Date(splitSheet.lockedAt).toLocaleDateString() : ''}</span>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-white">Final Copyright Allocations</h3>
            <div className="space-y-2">
              {splitSheet.entries.map((entry, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-verse-elevated rounded-md border border-white/5 text-sm">
                  <div>
                    <span className="font-bold text-white block">{entry.collaboratorName}</span>
                    <span className="text-xs text-verse-muted block">{entry.collaboratorEmail}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-white text-base">{entry.percentage}%</span>
                    <span className="text-[10px] uppercase font-bold text-verse-teal bg-verse-teal/5 border border-verse-teal/10 px-2 py-0.5 rounded-sm">
                      Confirmed
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {splitSheet.lockedHash && (
              <div className="pt-4 border-t border-white/5 space-y-1">
                <span className="text-[10px] text-verse-muted uppercase font-bold tracking-wider">
                  Splits Sign Hash SHA-256 (Locked Forever)
                </span>
                <p className="font-mono text-xs text-verse-teal bg-verse-teal/5 border border-verse-teal/10 p-3 rounded-md break-all">
                  {splitSheet.lockedHash}
                </p>
              </div>
            )}

            <p className="text-xs text-verse-muted text-center pt-2">
              🔒 Once locked by all parties, a split sheet cannot be edited or modified by anyone.
            </p>
          </div>
        </div>
      )}

      {/* CASE 2: Split sheet is PENDING */}
      {splitSheet && splitSheet.status === 'PENDING_CONFIRMATION' && (
        <div className="bg-verse-charcoal rounded-[20px] border border-white/5 overflow-hidden shadow-lg space-y-6 p-6">
          <div className="bg-verse-orange/10 border border-verse-orange/20 text-verse-orange rounded-lg px-4 py-3 flex items-center gap-2 text-sm font-medium">
            <Clock className="w-4 h-4 flex-shrink-0 animate-pulse" />
            <span>⏳ Awaiting Confirmations from Collaborators</span>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-white">Collaborator Statuses</h3>
              <span className="text-xs text-verse-muted">Confirmation links sent via email</span>
            </div>
            
            <div className="space-y-2">
              {splitSheet.entries.map((entry, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-verse-elevated rounded-md border border-white/5 text-sm">
                  <div>
                    <span className="font-bold text-white block">{entry.collaboratorName}</span>
                    <span className="text-xs text-verse-muted block">{entry.collaboratorEmail}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-white text-base">{entry.percentage}%</span>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm ${
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

            <p className="text-xs text-verse-muted text-center pt-2">
              The splits will be locked and signed on the registry the moment all parties confirm.
            </p>
          </div>
        </div>
      )}

      {/* CASE 3: NO SPLIT SHEET — Create new split sheet */}
      {!splitSheet && (
        <form onSubmit={handleSubmit} className="bg-verse-charcoal rounded-[20px] border border-white/5 p-6 md:p-8 space-y-6 shadow-lg">
          <div className="bg-verse-elevated border border-white/5 rounded-lg p-4 flex gap-3">
            <Users className="w-5 h-5 text-verse-magenta flex-shrink-0 mt-0.5" />
            <p className="text-xs text-verse-slate leading-relaxed">
              Add collaborators and assign copyright splits before distributing your work. Once all collaborators click their confirmation email, this split sheet is hashed, timestamped and locked forever.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-white text-sm">Collaborator Split Allocations</h3>
            
            <div className="space-y-3">
              {formEntries.map((entry, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row items-end gap-3 bg-verse-elevated/50 p-4 rounded-md border border-white/5">
                  <div className="w-full sm:flex-grow grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input 
                      placeholder="Collaborator Name"
                      value={entry.collaboratorName}
                      onChange={(e) => handleFieldChange(idx, 'collaboratorName', e.target.value)}
                      required
                    />
                    <Input 
                      type="email"
                      placeholder="Email Address"
                      value={entry.collaboratorEmail}
                      onChange={(e) => handleFieldChange(idx, 'collaboratorEmail', e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex items-end gap-2 w-full sm:w-auto">
                    <div className="w-[100px]">
                      <Input 
                        type="number"
                        placeholder="%"
                        min={1}
                        max={100}
                        value={entry.percentage || ''}
                        onChange={(e) => handleFieldChange(idx, 'percentage', e.target.value)}
                        required
                        className="text-right pr-6"
                      />
                    </div>
                    
                    {formEntries.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(idx)}
                        className="p-3 bg-verse-elevated hover:bg-verse-error/10 hover:text-verse-error text-verse-slate border border-white/5 rounded-md transition-colors"
                        title="Remove row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="flex items-center gap-1"
              onClick={handleAddRow}
            >
              <Plus className="w-3.5 h-3.5" />
              Add Collaborator
            </Button>
          </div>

          {/* Running total section */}
          <div className="flex items-center justify-between pt-4 border-t border-white/5">
            <div>
              <span className="text-xs text-verse-muted">Splits Total</span>
              <div className={`text-lg font-bold font-display ${totalPercentage === 100 ? 'text-verse-teal' : 'text-verse-error'}`}>
                {totalPercentage}% {totalPercentage === 100 ? '✓' : ' (must equal 100%)'}
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={submitLoading}
              disabled={totalPercentage !== 100 || submitLoading}
            >
              Send for Confirmation
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

// Inline import helper to prevent ts errors
import { useAuthStore } from '../stores/auth.store';
