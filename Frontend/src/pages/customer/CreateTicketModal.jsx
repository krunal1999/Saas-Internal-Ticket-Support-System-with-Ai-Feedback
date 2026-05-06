import { useState } from 'react';
import { createTicket } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export default function CreateTicketModal({ isOpen, onClose, onCreated }) {
  const { user } = useAuth();
  const [title, setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await createTicket({
        title,
        description,
        priority,
        customerId: user._id,
      });
      onCreated(data.data);
      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create ticket.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🎫 Create New Support Ticket" maxWidth="max-w-2xl">
      <form id="create-ticket-form" onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1.5">
            Ticket Title <span className="text-red-400">*</span>
          </label>
          <input
            id="ticket-title-input"
            type="text"
            className="input"
            placeholder="Brief summary of your issue..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={120}
          />
          <p className="text-xs text-slate-600 mt-1">{title.length}/120 characters</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1.5">
            Describe your issue <span className="text-red-400">*</span>
          </label>
          <textarea
            id="ticket-description-input"
            className="input resize-none"
            rows={6}
            placeholder="Please describe your issue in detail. Include any error messages, steps to reproduce, etc."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            minLength={10}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">Priority</label>
          <div className="flex gap-2">
            {PRIORITIES.map((p) => {
              const colors = {
                LOW:    priority === p ? 'bg-slate-500 text-white' : 'bg-slate-500/10 text-slate-400 border-slate-500/20',
                MEDIUM: priority === p ? 'bg-sky-500 text-white' : 'bg-sky-500/10 text-sky-400 border-sky-500/20',
                HIGH:   priority === p ? 'bg-orange-500 text-white' : 'bg-orange-500/10 text-orange-400 border-orange-500/20',
                URGENT: priority === p ? 'bg-red-500 text-white' : 'bg-red-500/10 text-red-400 border-red-500/20',
              };
              return (
                <button
                  key={p}
                  type="button"
                  id={`priority-btn-${p.toLowerCase()}`}
                  onClick={() => setPriority(p)}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all duration-200 ${colors[p]}`}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            ⚠️ {error}
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <button
            id="cancel-create-ticket-btn"
            type="button"
            className="btn-secondary flex-1"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            id="submit-create-ticket-btn"
            type="submit"
            className="btn-primary flex-1"
            disabled={loading}
          >
            {loading && <Spinner size="sm" />}
            {loading ? 'Creating...' : 'Create Ticket'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
