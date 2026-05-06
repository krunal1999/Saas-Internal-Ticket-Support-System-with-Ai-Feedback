import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTickets } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/layout/Navbar';
import { StatusBadge, PriorityBadge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import CreateTicketModal from './CreateTicketModal';

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [tickets, setTickets]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [stats, setStats]       = useState({ open: 0, inProgress: 0, resolved: 0, closed: 0 });

  const fetchTickets = async () => {
    try {
      const { data } = await getTickets({ customer: user._id, limit: 50 });
      const list = data.data || [];
      setTickets(list);
      setStats({
        open:       list.filter(t => t.status === 'OPEN').length,
        inProgress: list.filter(t => t.status === 'IN_PROGRESS').length,
        resolved:   list.filter(t => t.status === 'RESOLVED').length,
        closed:     list.filter(t => t.status === 'CLOSED').length,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, []);

  const handleCreated = (ticket) => {
    setTickets(prev => [ticket, ...prev]);
    setStats(prev => ({ ...prev, open: prev.open + 1 }));
  };

  if (loading) return <><Navbar /><PageSpinner /></>;

  const statCards = [
    { label: 'Open', value: stats.open, color: 'from-blue-500/20 to-blue-600/10 border-blue-500/20', dot: 'bg-blue-400' },
    { label: 'In Progress', value: stats.inProgress, color: 'from-amber-500/20 to-amber-600/10 border-amber-500/20', dot: 'bg-amber-400' },
    { label: 'Resolved', value: stats.resolved, color: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/20', dot: 'bg-emerald-400' },
    { label: 'Closed', value: stats.closed, color: 'from-slate-500/20 to-slate-600/10 border-slate-500/20', dot: 'bg-slate-400' },
  ];

  return (
    <div className="min-h-screen bg-surface-900 bg-mesh">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-slate-500 text-sm mb-1">Welcome back,</p>
            <h1 className="text-3xl font-black text-slate-100">
              {user?.name?.split(' ')[0]} <span className="gradient-text">👋</span>
            </h1>
            <p className="text-slate-500 text-sm mt-1">Here are all your support tickets</p>
          </div>
          <button
            id="new-ticket-btn"
            onClick={() => setShowModal(true)}
            className="btn-primary px-6 py-3 text-base shadow-lg shadow-brand-500/20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Ticket
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {statCards.map((s) => (
            <div key={s.label} className={`rounded-2xl border bg-gradient-to-br ${s.color} p-4 flex flex-col gap-1`}>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                <span className="text-xs text-slate-400 font-medium">{s.label}</span>
              </div>
              <p className="text-3xl font-black text-slate-100">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Ticket list */}
        {tickets.length === 0 ? (
          <div className="glass flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center text-3xl mb-4">🎫</div>
            <h3 className="text-lg font-bold text-slate-300 mb-1">No tickets yet</h3>
            <p className="text-slate-500 text-sm mb-6">Create your first support ticket to get started</p>
            <button id="empty-new-ticket-btn" onClick={() => setShowModal(true)} className="btn-primary">
              Create Ticket
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <Link
                key={ticket._id}
                to={`/customer/tickets/${ticket._id}`}
                id={`ticket-row-${ticket._id}`}
                className="glass-sm p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-white/[0.08] hover:scale-[1.01] transition-all duration-200"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3 mb-2">
                    <div>
                      <h3 className="font-semibold text-slate-100 text-sm leading-snug line-clamp-1">{ticket.title}</h3>
                      <p className="text-slate-500 text-xs mt-0.5 line-clamp-2">{ticket.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={ticket.status} />
                    <PriorityBadge priority={ticket.priority} />
                    {ticket.tags?.map(tag => (
                      <span key={tag} className="badge bg-brand-500/10 text-brand-300 border border-brand-500/20">{tag}</span>
                    ))}
                  </div>
                </div>
                <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-1 shrink-0">
                  <p className="text-xs text-slate-500">{formatDate(ticket.createdAt)}</p>
                  {ticket.assignedAgent ? (
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-white text-[9px] font-bold">
                        {ticket.assignedAgent.name?.[0] || 'A'}
                      </div>
                      <span className="text-xs text-slate-400">{ticket.assignedAgent.name}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-600 italic">Unassigned</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <CreateTicketModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}
