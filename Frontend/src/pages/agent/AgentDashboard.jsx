import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTickets } from '../../api/axios';
import Navbar from '../../components/layout/Navbar';
import { StatusBadge, PriorityBadge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';

const STATUSES   = ['', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
const PRIORITIES = ['', 'LOW', 'MEDIUM', 'HIGH', 'URGENT'];

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AgentDashboard() {
  const navigate = useNavigate();

  const [tickets, setTickets]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]         = useState(0);

  // Filters
  const [search, setSearch]       = useState('');
  const [status, setStatus]       = useState('');
  const [priority, setPriority]   = useState('');
  const [searchInput, setSearchInput] = useState('');

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (status)   params.status   = status;
      if (priority) params.priority = priority;
      if (search)   params.search   = search;
      const { data } = await getTickets(params);
      setTickets(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, [page, status, priority, search]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };
  const clearFilters = () => {
    setStatus(''); setPriority(''); setSearch(''); setSearchInput(''); setPage(1);
  };

  const hasFilters = status || priority || search;

  const statColors = {
    OPEN:        'bg-blue-500/10 text-blue-300 border border-blue-500/20',
    IN_PROGRESS: 'bg-amber-500/10 text-amber-300 border border-amber-500/20',
    RESOLVED:    'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20',
    CLOSED:      'bg-slate-500/10 text-slate-400 border border-slate-500/20',
  };

  return (
    <div className="min-h-screen bg-surface-900 bg-mesh">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-100">
              Support <span className="gradient-text">Dashboard</span>
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {total} ticket{total !== 1 ? 's' : ''} {hasFilters ? 'matching your filters' : 'total'}
            </p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="glass-sm p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search */}
            <form id="search-form" onSubmit={handleSearch} className="flex gap-2 flex-1">
              <input
                id="search-input"
                type="text"
                className="input flex-1"
                placeholder="Search tickets by title or description..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <button id="search-btn" type="submit" className="btn-primary px-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </button>
            </form>

            {/* Status filter */}
            <select
              id="status-filter"
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="input w-44"
            >
              {STATUSES.map(s => (
                <option key={s} value={s} className="bg-slate-900">
                  {s || 'All Status'}
                </option>
              ))}
            </select>

            {/* Priority filter */}
            <select
              id="priority-filter"
              value={priority}
              onChange={(e) => { setPriority(e.target.value); setPage(1); }}
              className="input w-44"
            >
              {PRIORITIES.map(p => (
                <option key={p} value={p} className="bg-slate-900">
                  {p || 'All Priority'}
                </option>
              ))}
            </select>

            {hasFilters && (
              <button id="clear-filters-btn" onClick={clearFilters} className="btn-secondary whitespace-nowrap">
                ✕ Clear
              </button>
            )}
          </div>
        </div>

        {/* Ticket table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-brand-500/20 border-t-brand-400 animate-spin" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="glass flex flex-col items-center justify-center py-20 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-lg font-bold text-slate-300 mb-1">No tickets found</h3>
            <p className="text-slate-500 text-sm">Try adjusting your filters</p>
            {hasFilters && (
              <button onClick={clearFilters} className="btn-secondary mt-4">Clear Filters</button>
            )}
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="glass overflow-hidden">
              {/* Header */}
              <div className="hidden lg:grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 px-5 py-3 border-b border-white/10 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <span>Ticket</span>
                <span>Customer</span>
                <span>Status</span>
                <span>Priority</span>
                <span>Agent / Date</span>
              </div>

              <div className="divide-y divide-white/5">
                {tickets.map((ticket) => (
                  <div
                    key={ticket._id}
                    id={`ticket-row-${ticket._id}`}
                    onClick={() => navigate(`/agent/tickets/${ticket._id}`)}
                    className="grid grid-cols-1 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-3 lg:gap-4 px-5 py-4 hover:bg-white/[0.04] cursor-pointer transition-all duration-150 group"
                  >
                    {/* Title */}
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-200 text-sm group-hover:text-white transition-colors line-clamp-1">
                        {ticket.title}
                      </p>
                      <p className="text-slate-600 text-xs mt-0.5 line-clamp-1">{ticket.description}</p>
                    </div>

                    {/* Customer */}
                    <div className="flex items-center gap-2 lg:block">
                      <span className="text-xs text-slate-500 lg:hidden font-medium">Customer:</span>
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                          {ticket.customer?.name?.[0] || '?'}
                        </div>
                        <span className="text-sm text-slate-300 truncate">{ticket.customer?.name || 'Unknown'}</span>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-2 lg:block">
                      <span className="text-xs text-slate-500 lg:hidden font-medium">Status:</span>
                      <StatusBadge status={ticket.status} />
                    </div>

                    {/* Priority */}
                    <div className="flex items-center gap-2 lg:block">
                      <span className="text-xs text-slate-500 lg:hidden font-medium">Priority:</span>
                      <PriorityBadge priority={ticket.priority} />
                    </div>

                    {/* Agent / Date */}
                    <div className="text-xs text-slate-500">
                      {ticket.assignedAgent ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                            {ticket.assignedAgent.name?.[0] || 'A'}
                          </div>
                          <span className="truncate">{ticket.assignedAgent.name}</span>
                        </div>
                      ) : (
                        <span className="italic text-slate-600">Unassigned</span>
                      )}
                      <p className="mt-0.5 text-slate-600">{formatDate(ticket.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-5">
                <span className="text-sm text-slate-500">
                  Page {page} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    id="prev-page-btn"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn-secondary px-4"
                  >
                    ← Prev
                  </button>
                  <button
                    id="next-page-btn"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="btn-secondary px-4"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
