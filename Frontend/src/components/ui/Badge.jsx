// Status badge colors
const STATUS_STYLES = {
  OPEN:        'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  IN_PROGRESS: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  RESOLVED:    'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  CLOSED:      'bg-slate-500/20 text-slate-400 border border-slate-500/30',
};

const PRIORITY_STYLES = {
  LOW:    'bg-slate-500/20 text-slate-400 border border-slate-500/30',
  MEDIUM: 'bg-sky-500/20 text-sky-300 border border-sky-500/30',
  HIGH:   'bg-orange-500/20 text-orange-300 border border-orange-500/30',
  URGENT: 'bg-red-500/20 text-red-400 border border-red-500/30',
};

const SENTIMENT_STYLES = {
  POSITIVE: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  NEUTRAL:  'bg-sky-500/20 text-sky-300 border border-sky-500/30',
  NEGATIVE: 'bg-red-500/20 text-red-400 border border-red-500/30',
};

const STATUS_DOTS = {
  OPEN: 'bg-blue-400',
  IN_PROGRESS: 'bg-amber-400',
  RESOLVED: 'bg-emerald-400',
  CLOSED: 'bg-slate-500',
};

export function StatusBadge({ status }) {
  return (
    <span className={`badge ${STATUS_STYLES[status] || 'bg-slate-500/20 text-slate-400'}`}>
      <span className={`w-1.5 h-1.5 rounded-full inline-block ${STATUS_DOTS[status] || 'bg-slate-500'}`} />
      {status?.replace('_', ' ')}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const p = priority?.toUpperCase();
  return (
    <span className={`badge ${PRIORITY_STYLES[p] || 'bg-slate-500/20 text-slate-400'}`}>
      {p}
    </span>
  );
}

export function SentimentBadge({ sentiment }) {
  const s = sentiment?.toUpperCase();
  return (
    <span className={`badge ${SENTIMENT_STYLES[s] || 'bg-slate-500/20 text-slate-400'}`}>
      {s === 'POSITIVE' ? '😊' : s === 'NEGATIVE' ? '😟' : '😐'} {s}
    </span>
  );
}
