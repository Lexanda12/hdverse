import { Link, useNavigate } from 'react-router-dom';
import { Music, Shield, Bell, Plus, ChevronRight, Loader2 } from 'lucide-react';
import { useAuthStore } from '../stores/auth.store';
import { useWorks } from '../hooks/useWorks';
import { ROUTES } from '../lib/routes';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { data: works, isLoading, isError } = useWorks();

  const activeWorks = works?.filter((w) => w.status === 'ACTIVE') ?? [];
  const processingWorks = works?.filter((w) => w.status === 'PROCESSING') ?? [];

  return (
    <div className="flex flex-col gap-8">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">
            Hey, {user?.fullName?.split(' ')[0]} 👋
          </h1>
          <p className="text-verse-muted mt-1">
            Here's the status of your protected works.
          </p>
        </div>
        <Button onClick={() => navigate(ROUTES.UPLOAD)}>
          <Plus className="w-4 h-4 mr-2" />
          Protect a Work
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          icon={<Music className="w-5 h-5 text-verse-magenta" />}
          label="Total Works"
          value={works?.length ?? 0}
          loading={isLoading}
        />
        <StatCard
          icon={<Shield className="w-5 h-5 text-verse-teal" />}
          label="Certificates"
          value={activeWorks.length}
          loading={isLoading}
        />
        <StatCard
          icon={<Bell className="w-5 h-5 text-verse-orange" />}
          label="Detection Alerts"
          value={0}
          loading={isLoading}
          onClick={() => navigate(ROUTES.ALERTS)}
        />
      </div>

      {/* Processing banner */}
      {processingWorks.length > 0 && (
        <div className="bg-verse-magenta/10 border border-verse-magenta/30 rounded-lg px-5 py-4 flex items-center gap-3">
          <Loader2 className="w-4 h-4 text-verse-magenta animate-spin flex-shrink-0" />
          <p className="text-sm text-verse-slate">
            <span className="font-medium text-verse-magenta">
              {processingWorks.length} work{processingWorks.length > 1 ? 's' : ''} processing
            </span>
            {' '}— Generating {processingWorks.length > 1 ? 'certificates' : 'certificate'}...
            This usually takes under 30 seconds.
          </p>
        </div>
      )}

      {/* Works list */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold text-white">
            Your Works
          </h2>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-verse-magenta animate-spin" />
          </div>
        )}

        {isError && (
          <div className="bg-verse-error/10 border border-verse-error/30 rounded-lg p-6 text-center">
            <p className="text-verse-error text-sm">Failed to load works. Please refresh.</p>
          </div>
        )}

        {!isLoading && !isError && works?.length === 0 && (
          <EmptyState onUpload={() => navigate(ROUTES.UPLOAD)} />
        )}

        {!isLoading && !isError && works && works.length > 0 && (
          <div className="flex flex-col gap-3">
            {works.map((work) => (
              <Link
                key={work.id}
                to={ROUTES.WORK.replace(':workId', work.id)}
                className="block bg-verse-charcoal border border-verse-elevated rounded-xl p-5
                           hover:border-verse-magenta/50 transition-colors duration-150 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <p className="text-white font-medium truncate">{work.title}</p>
                      <StatusBadge status={work.status} />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-verse-muted">
                      <span>{work.artistName}</span>
                      <span className="font-mono text-verse-teal">{work.isrc}</span>
                      {work.certificate && (
                        <span className="font-mono">
                          {work.certificate.certificateNumber}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-verse-muted">
                      {new Date(work.createdAt).toLocaleDateString('en-NG', {
                        year: 'numeric', month: 'short', day: 'numeric',
                      })}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-verse-muted group-hover:text-verse-magenta
                                           transition-colors ml-4 flex-shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  loading,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  loading: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-verse-charcoal border border-verse-elevated rounded-xl p-5
                  ${onClick ? 'cursor-pointer hover:border-verse-magenta/50 transition-colors' : ''}`}
    >
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className="text-xs text-verse-muted uppercase tracking-wide">{label}</span>
      </div>
      {loading ? (
        <div className="h-8 w-12 bg-verse-elevated rounded animate-pulse" />
      ) : (
        <p className="text-3xl font-display font-bold text-white">{value}</p>
      )}
    </div>
  );
}

function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="bg-verse-charcoal border border-dashed border-verse-elevated
                    rounded-xl p-12 text-center">
      <div className="w-16 h-16 rounded-full bg-verse-magenta/10 flex items-center
                      justify-center mx-auto mb-4">
        <Music className="w-8 h-8 text-verse-magenta" />
      </div>
      <h3 className="font-display text-lg font-semibold text-white mb-2">
        No works protected yet
      </h3>
      <p className="text-verse-muted text-sm mb-6 max-w-sm mx-auto">
        Upload your first beat or track to receive a timestamped
        ownership certificate.
      </p>
      <Button onClick={onUpload}>
        <Plus className="w-4 h-4 mr-2" />
        Protect Your First Work
      </Button>
    </div>
  );
}
