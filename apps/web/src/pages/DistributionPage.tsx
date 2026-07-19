import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../lib/api';
import { ROUTES } from '../lib/routes';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { 
  Loader2, 
  AlertTriangle, 
  CheckCircle2, 
  Globe, 
  Sparkles,
  Music
} from 'lucide-react';

interface Work {
  id: string;
  title: string;
  artistName: string;
}

export default function DistributionPage() {
  const { workId } = useParams<{ workId: string }>();
  const navigate = useNavigate();

  const [work, setWork] = useState<Work | null>(null);
  const [eligible, setEligible] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form states
  const [releaseDate, setReleaseDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
  });

  const [platforms, setPlatforms] = useState({
    spotify: true,
    appleMusic: true,
    youtubeMusic: true,
    boomplay: true,
    audiomack: true
  });

  const loadData = async () => {
    if (!workId) return;
    try {
      // Fetch work details
      const workRes = await apiClient.get(`/works/${workId}`);
      setWork(workRes.data.data.work);

      // Fetch distribution check
      try {
        const checkRes = await apiClient.get(
          `/split-sheets/work/${workId}/distribution-check`
        );
        setEligible(checkRes.data.data.eligible);
      } catch (err) {
        setEligible(true); // default to true if split sheet check fails or doesn't exist
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message || 
        'Failed to verify distribution details.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [workId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-verse-magenta animate-spin mb-4" />
        <p className="text-verse-muted">Verifying distribution eligibility...</p>
      </div>
    );
  }

  if (error || !work) {
    return (
      <div className="max-w-md mx-auto mt-16 p-8 bg-verse-charcoal border border-white/5 rounded-lg text-center shadow-xl">
        <AlertTriangle className="w-12 h-12 text-verse-orange mx-auto mb-4" />
        <h2 className="font-display text-xl font-bold text-white mb-2">Verification Failed</h2>
        <p className="text-verse-muted text-sm mb-6">{error || 'Work details not found.'}</p>
        <Button variant="secondary" onClick={() => navigate(ROUTES.DASHBOARD)}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 font-body space-y-6">
      {/* Header */}
      <div className="pb-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Distribute Your Work</h1>
          <p className="text-sm text-verse-slate mt-1 flex items-center gap-1.5">
            <Music className="w-3.5 h-3.5 text-verse-magenta" />
            {work.title}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => navigate(`/works/${workId}`)}>
          Back to Work
        </Button>
      </div>

      {/* 1. Eligibility Banner */}
      {eligible ? (
        <div className="bg-verse-teal/10 border border-verse-teal/20 text-verse-teal rounded-lg px-4 py-3 flex items-center gap-2 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>✓ Your work is ready for distribution</span>
        </div>
      ) : (
        <div className="bg-verse-orange/10 border border-verse-orange/20 text-verse-orange rounded-lg px-4 py-3 flex items-start gap-2.5 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Lock your split sheet before distributing</p>
            <p className="text-xs text-verse-slate mt-1">
              You must confirm and lock the split sheet allocations with all collaborators before publishing.
            </p>
            <Link 
              to={ROUTES.SPLIT_SHEET.replace(':workId', work.id)} 
              className="text-xs text-verse-orange underline font-semibold mt-2 inline-block hover:opacity-85"
            >
              Go to Split Sheet Page →
            </Link>
          </div>
        </div>
      )}

      {/* 2. Distribution Form */}
      <div className={`bg-verse-charcoal border border-white/5 rounded-[20px] p-6 md:p-8 space-y-6 shadow-lg ${
        !eligible ? 'opacity-40 pointer-events-none' : ''
      }`}>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Release type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-verse-muted uppercase font-bold tracking-wider">
              Release Type
            </label>
            <select
              className="w-full px-4 py-3 rounded-md text-sm text-white bg-verse-elevated border border-verse-elevated focus:outline-none"
              disabled
              value="single"
            >
              <option value="single">Single Track Release</option>
            </select>
          </div>

          {/* Release date */}
          <div>
            <Input 
              type="date"
              label="Release Date (Target)"
              value={releaseDate}
              onChange={(e) => setReleaseDate(e.target.value)}
              hint="Minimum 7 days lead time required"
            />
          </div>
        </div>

        {/* Territory selection */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-verse-muted uppercase font-bold tracking-wider">
            Territories
          </span>
          <div className="flex">
            <span className="bg-verse-magenta/15 border border-verse-magenta/20 text-verse-magenta text-xs font-semibold px-4 py-2 rounded-full flex items-center gap-1.5 shadow-sm">
              <Globe className="w-3.5 h-3.5" />
              Worldwide Distribution
            </span>
          </div>
        </div>

        {/* Platform checkboxes */}
        <div className="space-y-3">
          <span className="text-xs text-verse-muted uppercase font-bold tracking-wider block">
            Target Streaming Platforms
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.keys(platforms).map((plat) => (
              <label 
                key={plat}
                className="flex items-center gap-2.5 p-3 bg-verse-elevated/40 border border-white/5 rounded-md text-xs text-white cursor-pointer select-none hover:bg-verse-elevated/80 transition-colors"
              >
                <input 
                  type="checkbox"
                  checked={(platforms as any)[plat]}
                  onChange={(e) => setPlatforms({ ...platforms, [plat]: e.target.checked })}
                  className="rounded text-verse-magenta focus:ring-verse-magenta w-4 h-4 bg-verse-charcoal border-white/10"
                />
                <span className="capitalize">{plat.replace('Music', ' Music')}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Coming Soon Overlay and disabled Submit Button */}
        <div className="pt-6 border-t border-white/5 space-y-4">
          <div className="flex flex-col items-center gap-4 text-center py-4 bg-verse-elevated/40 border border-white/5 rounded-lg">
            <Sparkles className="w-6 h-6 text-verse-magenta animate-bounce" />
            <div>
              <h4 className="text-sm font-bold text-white">Direct Distribution is Coming Soon!</h4>
              <p className="text-xs text-verse-muted max-w-md mx-auto mt-1 px-4 leading-relaxed">
                We're currently scaling our direct integration pipeline powered by Revelator. Join our early waitlist to publish tracks seamlessly.
              </p>
            </div>
            <a 
              href="/pricing"
              className="text-xs text-verse-magenta font-semibold hover:underline flex items-center gap-1"
            >
              Join the waitlist to be first when distribution goes live →
            </a>
          </div>

          <button 
            type="button" 
            disabled 
            className="w-full flex items-center justify-center py-3.5 border-1.5 border-verse-magenta text-verse-magenta font-bold rounded-full cursor-not-allowed bg-transparent text-sm hover:bg-verse-magenta/5 transition-colors"
          >
            Distribution Coming Soon
          </button>
          
          <p className="text-[10px] text-verse-muted text-center leading-relaxed">
            Distribution pipelines are globally powered by Revelator networks. Processing takes 24-72 hours per platform.
          </p>
        </div>
      </div>
    </div>
  );
}
