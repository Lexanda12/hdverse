import { cn } from '../../lib/utils';

type Status = 'PROCESSING' | 'ACTIVE' | 'FAILED' | 'PENDING' |
              'REGISTERED' | 'NOTIFIED' | 'NEW' | 'REVIEWED';

const STATUS_CONFIG: Record<Status, { label: string; className: string }> = {
  ACTIVE:      { label: 'Protected',   className: 'bg-verse-teal/10 text-verse-teal border-verse-teal/30' },
  PROCESSING:  { label: 'Processing',  className: 'bg-verse-magenta/10 text-verse-magenta border-verse-magenta/30' },
  FAILED:      { label: 'Failed',      className: 'bg-verse-error/10 text-verse-error border-verse-error/30' },
  PENDING:     { label: 'Pending',     className: 'bg-verse-muted/10 text-verse-muted border-verse-muted/30' },
  REGISTERED:  { label: 'Fingerprinted', className: 'bg-verse-teal/10 text-verse-teal border-verse-teal/30' },
  NOTIFIED:    { label: 'Notified',    className: 'bg-verse-orange/10 text-verse-orange border-verse-orange/30' },
  NEW:         { label: 'New Alert',   className: 'bg-verse-yellow/10 text-verse-yellow border-verse-yellow/30' },
  REVIEWED:    { label: 'Reviewed',    className: 'bg-verse-muted/10 text-verse-muted border-verse-muted/30' },
};

export default function StatusBadge({ status }: { status: Status }) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    className: 'bg-verse-muted/10 text-verse-muted border-verse-muted/30',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        config.className
      )}
    >
      {config.label}
    </span>
  );
}
