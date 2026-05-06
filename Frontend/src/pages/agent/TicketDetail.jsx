import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getTicketById,
  updateStatus,
  assignTicket,
  addMessage,
  getAgents,
  generateInsight,
  editInsight,
  regenerateInsight,
} from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/layout/Navbar";
import {
  StatusBadge,
  PriorityBadge,
  SentimentBadge,
} from "../../components/ui/Badge";
import { PageSpinner } from "../../components/ui/Spinner";
import Spinner from "../../components/ui/Spinner";

const STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
const formatDate = (d) =>
  new Date(d).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
const formatDateShort = (d) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

// ── Message Bubble ────────────────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isCustomer = msg.senderType === "Customer";
  const isInternal = msg.isInternal;

  if (isInternal) {
    return (
      <div className="flex justify-center my-2">
        <div className="max-w-[80%] bg-amber-500/10 border border-amber-500/20 rounded-2xl px-4 py-3 text-sm">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-amber-400 text-xs font-semibold">
              🔒 Internal Note
            </span>
            <span className="text-amber-600 text-xs">·</span>
            <span className="text-amber-600 text-xs">
              {msg.sender?.name || "Agent"}
            </span>
          </div>
          <p className="text-amber-200/80 text-sm leading-relaxed">
            {msg.message}
          </p>
          <p className="text-amber-700 text-xs mt-1.5 text-right">
            {formatDate(msg.createdAt)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex ${isCustomer ? "justify-start" : "justify-end"} mb-3`}
    >
      <div
        className={`max-w-[75%] ${isCustomer ? "bg-white/5 border border-white/10" : "bg-brand-600/30 border border-brand-500/30"} rounded-2xl px-4 py-3`}
      >
        <div className="flex items-center gap-1.5 mb-1">
          <div
            className={`w-4 h-4 rounded-full ${isCustomer ? "bg-gradient-to-br from-purple-500 to-pink-500" : "bg-gradient-to-br from-brand-500 to-cyan-500"} flex items-center justify-center text-white text-[8px] font-bold`}
          >
            {(msg.sender?.name || (isCustomer ? "C" : "A"))[0]}
          </div>
          <span className="text-xs font-medium text-slate-400">
            {msg.sender?.name || (isCustomer ? "Customer" : "Agent")}
          </span>
          <span className="text-slate-600 text-xs">
            · {isCustomer ? "Customer" : "Agent"}
          </span>
        </div>
        <p className="text-slate-200 text-sm leading-relaxed">{msg.message}</p>
        <p className="text-slate-600 text-xs mt-1.5 text-right">
          {formatDate(msg.createdAt)}
        </p>
      </div>
    </div>
  );
}

// ── AI Insight Panel ──────────────────────────────────────────────────────────
function AIInsightPanel({ ticketId, initialInsight, onUpdate }) {
  const [insight, setInsight] = useState(initialInsight);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await generateInsight(ticketId);
      setInsight(data.data);
      onUpdate && onUpdate(data.data);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "AI generation failed. Make sure the AI route is enabled.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await regenerateInsight(ticketId);
      setInsight(data.data);
      onUpdate && onUpdate(data.data);
    } catch (err) {
      setError(err?.response?.data?.message || "Regeneration failed.");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = () => {
    setEditData({
      summary: insight.summary || "",
      sentiment: insight.sentiment || "NEUTRAL",
      suggestedPriority: insight.suggestedPriority || "MEDIUM",
      nextAction: insight.nextAction || "",
    });
    setEditing(true);
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    setError("");
    try {
      const { data } = await editInsight(ticketId, editData);
      setInsight(data.data);
      onUpdate && onUpdate(data.data);
      setEditing(false);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save edits.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-sm p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 border border-violet-500/30 flex items-center justify-center">
            <span className="text-sm">✨</span>
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-200">AI Insight</h3>
            {insight?.generatedAt && (
              <p className="text-xs text-slate-600">
                Generated {formatDateShort(insight.generatedAt)}
              </p>
            )}
          </div>
        </div>
        {insight && !editing && (
          <div className="flex gap-1.5">
            <button
              id="edit-insight-btn"
              onClick={startEdit}
              className="btn-ghost text-xs px-2 py-1"
            >
              ✏️ Edit
            </button>
            <button
              id="regen-insight-btn"
              onClick={handleRegenerate}
              disabled={loading}
              className="btn-ghost text-xs px-2 py-1 text-violet-400 hover:text-violet-300"
            >
              {loading ? <Spinner size="sm" /> : "🔄 Regen"}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
          ⚠️ {error}
        </div>
      )}

      {/* No insight yet */}
      {!insight && (
        <div className="text-center py-6">
          <p className="text-slate-500 text-sm mb-4">
            No AI analysis has been generated for this ticket yet.
          </p>
          <button
            id="generate-insight-btn"
            onClick={handleGenerate}
            disabled={loading}
            className="btn-primary w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 shadow-lg shadow-violet-500/20"
          >
            {loading ? (
              <>
                <Spinner size="sm" /> Generating...
              </>
            ) : (
              <>✨ Generate AI Summary</>
            )}
          </button>
        </div>
      )}

      {/* Insight display */}
      {insight && !editing && (
        <div className="space-y-3">
          <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Summary
            </p>
            <p className="text-sm text-slate-300 leading-relaxed">
              {insight.summary}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Sentiment
              </p>
              <SentimentBadge sentiment={insight.sentiment} />
            </div>
            <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Suggested Priority
              </p>
              <PriorityBadge priority={insight.suggestedPriority} />
            </div>
          </div>
          {insight.nextAction && (
            <div className="bg-brand-500/5 rounded-xl p-3 border border-brand-500/20">
              <p className="text-xs font-semibold text-brand-400 uppercase tracking-wider mb-1">
                Next Action
              </p>
              <p className="text-sm text-slate-300 leading-relaxed">
                {insight.nextAction}
              </p>
            </div>
          )}
          {insight.isEdited && (
            <p className="text-xs text-slate-600 italic text-right">
              Edited by {insight.editedBy?.name || "Agent"} ·{" "}
              {formatDateShort(insight.editedAt)}
            </p>
          )}
        </div>
      )}

      {/* Edit mode */}
      {insight && editing && (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">
              Summary
            </label>
            <textarea
              id="edit-summary-input"
              className="input resize-none text-xs"
              rows={3}
              value={editData.summary}
              onChange={(e) =>
                setEditData((p) => ({ ...p, summary: e.target.value }))
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">
                Sentiment
              </label>
              <select
                id="edit-sentiment-select"
                className="input text-xs"
                value={editData.sentiment}
                onChange={(e) =>
                  setEditData((p) => ({ ...p, sentiment: e.target.value }))
                }
              >
                {["POSITIVE", "NEUTRAL", "NEGATIVE"].map((s) => (
                  <option key={s} value={s} className="bg-slate-900">
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">
                Priority
              </label>
              <select
                id="edit-priority-select"
                className="input text-xs"
                value={editData.suggestedPriority}
                onChange={(e) =>
                  setEditData((p) => ({
                    ...p,
                    suggestedPriority: e.target.value,
                  }))
                }
              >
                {["LOW", "MEDIUM", "HIGH", "URGENT"].map((p) => (
                  <option key={p} value={p} className="bg-slate-900">
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">
              Next Action
            </label>
            <textarea
              id="edit-next-action-input"
              className="input resize-none text-xs"
              rows={2}
              value={editData.nextAction}
              onChange={(e) =>
                setEditData((p) => ({ ...p, nextAction: e.target.value }))
              }
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              id="cancel-edit-insight-btn"
              onClick={() => setEditing(false)}
              className="btn-secondary flex-1 text-xs py-2"
            >
              Cancel
            </button>
            <button
              id="save-edit-insight-btn"
              onClick={handleSaveEdit}
              disabled={saving}
              className="btn-primary flex-1 text-xs py-2"
            >
              {saving ? <Spinner size="sm" /> : null}{" "}
              {saving ? "Saving..." : "Save Edits"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Status History ────────────────────────────────────────────────────────────
function StatusHistory({ history }) {
  if (!history?.length) return null;
  const statusColors = {
    OPEN: "bg-blue-500",
    IN_PROGRESS: "bg-amber-500",
    RESOLVED: "bg-emerald-500",
    CLOSED: "bg-slate-500",
  };
  return (
    <div className="glass-sm p-5">
      <h3 className="font-bold text-sm text-slate-300 mb-4 flex items-center gap-2">
        <span className="text-base">📋</span> Status History
      </h3>
      <div className="relative space-y-0">
        {history.map((h, i) => (
          <div key={h._id || i} className="flex gap-3 pb-4 last:pb-0 relative">
            <div className="flex flex-col items-center shrink-0">
              <div
                className={`w-3 h-3 rounded-full mt-0.5 shrink-0 ${statusColors[h.toStatus] || "bg-slate-500"}`}
              />
              {i < history.length - 1 && (
                <div className="w-px flex-1 bg-white/10 mt-1" />
              )}
            </div>
            <div className="min-w-0 pb-1">
              <p className="text-xs text-slate-300">
                <span className="text-slate-500">{h.fromStatus}</span>
                <span className="text-slate-600 mx-1.5">→</span>
                <span className="font-semibold text-slate-200">
                  {h.toStatus?.replace("_", " ")}
                </span>
              </p>
              {h.reason && (
                <p className="text-xs text-slate-500 mt-0.5 italic">
                  "{h.reason}"
                </p>
              )}
              <p className="text-xs text-slate-600 mt-0.5">
                By {h.changedBy?.name || "Unknown"} ·{" "}
                {formatDateShort(h.createdAt)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const messagesEndRef = useRef(null);

  const [data, setData] = useState(null);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Controls
  const [statusLoading, setStatusLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);

  // Message form
  const [msgText, setMsgText] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [msgLoading, setMsgLoading] = useState(false);

  // Status change form
  const [newStatus, setNewStatus] = useState("");
  const [statusReason, setStatusReason] = useState("");
  const [showStatusPanel, setShowStatusPanel] = useState(false);

  // Assign form
  const [selectedAgent, setSelectedAgent] = useState("");
  const [showAssignPanel, setShowAssignPanel] = useState(false);

  const scrollToBottom = () =>
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [ticketRes, agentsRes] = await Promise.all([
        getTicketById(id),
        getAgents(),
      ]);
      setData(ticketRes?.data.data);
      setAgents(agentsRes?.data.data || []);
      setNewStatus(ticketRes.data.data.ticket.status);
      setSelectedAgent(ticketRes.data.data.ticket.assignedAgent?._id || "");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [id]);
  useEffect(() => {
    if (data?.messages?.length) scrollToBottom();
  }, [data?.messages]);

  const handleStatusChange = async () => {
    if (!newStatus || newStatus === data.ticket.status) return;
    setStatusLoading(true);
    try {
      await updateStatus(id, {
        status: newStatus,
        reason: statusReason || undefined,
      });
      await fetchAll();
      setStatusReason("");
      setShowStatusPanel(false);
    } catch (err) {
      alert(err?.response?.data?.message || "Status update failed.");
    } finally {
      setStatusLoading(false);
    }
  };

  const handleAssign = async () => {
    setAssignLoading(true);
    try {
      await assignTicket(id, { agentId: selectedAgent || null });
      await fetchAll();
      setShowAssignPanel(false);
    } catch (err) {
      alert(err?.response?.data?.message || "Assign failed.");
    } finally {
      setAssignLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!msgText.trim()) return;
    setMsgLoading(true);
    try {
      const { data: res } = await addMessage(id, {
        message: msgText.trim(),
        isInternal,
      });
      setData((prev) => ({
        ...prev,
        messages: [...(prev.messages || []), res.data],
      }));
      setMsgText("");
      setIsInternal(false);
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to send message.");
    } finally {
      setMsgLoading(false);
    }
  };

  if (loading)
    return (
      <>
        <Navbar />
        <PageSpinner />
      </>
    );
  if (!data)
    return (
      <>
        <Navbar />
        <div className="p-8 text-center text-slate-500">Ticket not found.</div>
      </>
    );

  const { ticket, messages, statusHistory, aiInsight } = data;

  return (
    <div className="min-h-screen bg-surface-900 bg-mesh">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-6 animate-fade-in">
        {/* Back */}
        <button
          id="back-btn"
          onClick={() => navigate("/agent")}
          className="btn-ghost text-slate-500 mb-5 pl-0"
        >
          ← Back to Dashboard
        </button>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
          {/* ── LEFT COLUMN ── */}
          <div className="space-y-5 min-w-0">
            {/* Ticket header */}
            <div className="glass p-6">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={ticket.status} />
                  <PriorityBadge priority={ticket.priority} />
                  {ticket.tags?.map((t) => (
                    <span
                      key={t}
                      className="badge bg-brand-500/10 text-brand-300 border border-brand-500/20"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <span className="text-xs text-slate-600">
                  {formatDate(ticket.createdAt)}
                </span>
              </div>
              <h1 className="text-xl font-black text-slate-100 leading-snug mb-4">
                {ticket.title}
              </h1>

              <div className="flex flex-wrap gap-5 text-sm">
                {/* Customer */}
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {ticket.customer?.name?.[0] || "?"}
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Customer</p>
                    <p className="text-slate-200 font-medium">
                      {ticket.customer?.name}
                    </p>
                  </div>
                </div>

                {/* Assigned agent */}
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {ticket.assignedAgent?.name?.[0] || "?"}
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Assigned Agent</p>
                    <p className="text-slate-200 font-medium">
                      {ticket.assignedAgent?.name || "Unassigned"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions row */}
              <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-white/10">
                <button
                  id="toggle-status-panel-btn"
                  onClick={() => {
                    setShowStatusPanel((p) => !p);
                    setShowAssignPanel(false);
                  }}
                  className={`btn-secondary text-sm py-2 ${showStatusPanel ? "border-brand-500/40 text-brand-300" : ""}`}
                >
                  🔄 Change Status
                </button>
                <button
                  id="toggle-assign-panel-btn"
                  onClick={() => {
                    setShowAssignPanel((p) => !p);
                    setShowStatusPanel(false);
                  }}
                  className={`btn-secondary text-sm py-2 ${showAssignPanel ? "border-brand-500/40 text-brand-300" : ""}`}
                >
                  👤 Assign Agent
                </button>
              </div>

              {/* Status change panel */}
              {showStatusPanel && (
                <div className="mt-4 p-4 bg-white/[0.03] rounded-xl border border-white/10 space-y-3 animate-slide-up">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Update Status
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {STATUSES.map((s) => (
                      <button
                        key={s}
                        id={`status-option-${s.toLowerCase().replace("_", "-")}`}
                        onClick={() => setNewStatus(s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          newStatus === s
                            ? "bg-brand-600 border-brand-500 text-white shadow-inner"
                            : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200"
                        } ${s === ticket.status ? "ring-1 ring-slate-600" : ""}`}
                      >
                        {s.replace("_", " ")}
                        {s === ticket.status && (
                          <span className="ml-1 text-slate-500">(current)</span>
                        )}
                      </button>
                    ))}
                  </div>
                  <input
                    id="status-reason-input"
                    type="text"
                    className="input text-xs py-2"
                    placeholder="Reason for change (optional)..."
                    value={statusReason}
                    onChange={(e) => setStatusReason(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button
                      id="cancel-status-btn"
                      onClick={() => setShowStatusPanel(false)}
                      className="btn-secondary text-xs py-2 flex-1"
                    >
                      Cancel
                    </button>
                    <button
                      id="confirm-status-btn"
                      onClick={handleStatusChange}
                      disabled={statusLoading || newStatus === ticket.status}
                      className="btn-primary text-xs py-2 flex-1"
                    >
                      {statusLoading ? <Spinner size="sm" /> : null}
                      {statusLoading ? "Updating..." : "Confirm Update"}
                    </button>
                  </div>
                </div>
              )}

              {/* Assign panel */}
              {showAssignPanel && (
                <div className="mt-4 p-4 bg-white/[0.03] rounded-xl border border-white/10 space-y-3 animate-slide-up">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Assign to Agent
                  </p>
                  <select
                    id="assign-agent-select"
                    value={selectedAgent}
                    onChange={(e) => setSelectedAgent(e.target.value)}
                    className="input"
                  >
                    <option value="" className="bg-slate-900">
                      — Unassign —
                    </option>
                    {agents.map((a) => (
                      <option
                        key={a._id}
                        value={a._id}
                        className="bg-slate-900"
                      >
                        {a.name} ({a.role})
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button
                      id="cancel-assign-btn"
                      onClick={() => setShowAssignPanel(false)}
                      className="btn-secondary text-xs py-2 flex-1"
                    >
                      Cancel
                    </button>
                    <button
                      id="confirm-assign-btn"
                      onClick={handleAssign}
                      disabled={assignLoading}
                      className="btn-primary text-xs py-2 flex-1"
                    >
                      {assignLoading ? <Spinner size="sm" /> : null}
                      {assignLoading ? "Assigning..." : "Confirm Assign"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── Message Thread ── */}
            <div className="glass flex flex-col" style={{ minHeight: "400px" }}>
              <div className="px-5 py-4 border-b border-white/10">
                <h2 className="font-bold text-slate-200 flex items-center gap-2">
                  💬 Message Thread
                  <span className="ml-1 text-xs font-normal text-slate-500">
                    ({messages?.length || 0} messages)
                  </span>
                </h2>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-1 scrollbar-thin max-h-[500px]">
                {messages?.length === 0 && (
                  <p className="text-center text-slate-600 text-sm py-10">
                    No messages yet.
                  </p>
                )}
                {messages?.map((msg) => (
                  <MessageBubble key={msg._id} msg={msg} />
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply form */}
              <div className="border-t border-white/10 p-4">
                <form id="reply-form" onSubmit={handleSendMessage}>
                  {/* Internal toggle */}
                  <div className="flex items-center gap-3 mb-3">
                    <button
                      type="button"
                      id="reply-type-public-btn"
                      onClick={() => setIsInternal(false)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-semibold border transition-all ${!isInternal ? "bg-brand-600 border-brand-500 text-white" : "bg-white/5 border-white/10 text-slate-500 hover:text-slate-300"}`}
                    >
                      💬 Reply
                    </button>
                    <button
                      type="button"
                      id="reply-type-internal-btn"
                      onClick={() => setIsInternal(true)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-semibold border transition-all ${isInternal ? "bg-amber-600/80 border-amber-500 text-white" : "bg-white/5 border-white/10 text-slate-500 hover:text-slate-300"}`}
                    >
                      🔒 Internal Note
                    </button>
                  </div>
                  <div className="flex gap-3">
                    <textarea
                      id="reply-input"
                      className={`input flex-1 resize-none ${isInternal ? "border-amber-500/30 focus:border-amber-500/60 focus:ring-amber-500/20" : ""}`}
                      rows={2}
                      placeholder={
                        isInternal
                          ? "Write an internal note (not visible to customer)..."
                          : "Type your reply..."
                      }
                      value={msgText}
                      onChange={(e) => setMsgText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                    />
                    <button
                      id="send-reply-btn"
                      type="submit"
                      disabled={msgLoading || !msgText.trim()}
                      className={`${isInternal ? "bg-amber-600/80 hover:bg-amber-600" : "btn-primary"} px-4 rounded-xl transition-all self-end disabled:opacity-40`}
                    >
                      {msgLoading ? (
                        <Spinner size="sm" />
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-4 h-4 text-white"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="22" y1="2" x2="11" y2="13" />
                          <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="space-y-5">
            {/* AI Insight */}
            <AIInsightPanel
              ticketId={id}
              initialInsight={aiInsight}
              onUpdate={(updated) =>
                setData((prev) => ({ ...prev, aiInsight: updated }))
              }
            />

            {/* Status History */}
            <StatusHistory history={statusHistory} />

            {/* Ticket meta */}
            <div className="glass-sm p-5 space-y-3">
              <h3 className="font-bold text-sm text-slate-300 flex items-center gap-2">
                <span>ℹ️</span> Ticket Info
              </h3>
              <div className="space-y-2 text-xs">
                {[
                  ["ID", ticket._id?.slice(-8).toUpperCase()],
                  ["Created", formatDateShort(ticket.createdAt)],
                  ["Updated", formatDateShort(ticket.updatedAt)],
                  ["Customer Email", ticket.customer?.email],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex justify-between items-center"
                  >
                    <span className="text-slate-500">{label}</span>
                    <span className="text-slate-300 font-mono text-[11px] text-right max-w-[60%] truncate">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
