import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getTicketById, addMessage } from "../../api/axios";
import Navbar from "../../components/layout/Navbar";
import { StatusBadge, PriorityBadge } from "../../components/ui/Badge";
import { PageSpinner } from "../../components/ui/Spinner";
import Spinner from "../../components/ui/Spinner";

function MessageBubble({ msg }) {
  const isCustomer = msg.senderType === "Customer";
  
  return (
    <div className={`flex ${isCustomer ? "justify-end" : "justify-start"} mb-3`}>
      <div className={`max-w-[85%] sm:max-w-[75%] ${isCustomer ? "bg-brand-600/30 border border-brand-500/30" : "bg-white/5 border border-white/10"} rounded-2xl px-4 py-3`}>
        <div className="flex items-center gap-1.5 mb-1">
          <div className={`w-4 h-4 rounded-full ${isCustomer ? "bg-gradient-to-br from-brand-500 to-cyan-500" : "bg-gradient-to-br from-purple-500 to-pink-500"} flex items-center justify-center text-white text-[8px] font-bold shrink-0`}>
            {(msg.sender?.name || (isCustomer ? "C" : "A"))[0]}
          </div>
          <span className="text-xs font-medium text-slate-300">
            {msg.sender?.name || (isCustomer ? "You" : "Support")}
          </span>
          <span className="text-slate-500 text-xs">
            · {isCustomer ? "You" : "Support"}
          </span>
        </div>
        <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
        <p className="text-slate-600 text-xs mt-1.5 text-right">
          {new Date(msg.createdAt).toLocaleString("en-IN", {
            day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
          })}
        </p>
      </div>
    </div>
  );
}

export default function CustomerTicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [msgText, setMsgText] = useState("");
  const [msgLoading, setMsgLoading] = useState(false);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const { data: res } = await getTicketById(id);
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();
  }, [id]);

  useEffect(() => {
    if (data?.messages?.length) scrollToBottom();
  }, [data?.messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!msgText.trim()) return;
    setMsgLoading(true);
    try {
      const { data: res } = await addMessage(id, {
        message: msgText.trim(),
        isInternal: false,
      });
      setData((prev) => ({
        ...prev,
        messages: [...(prev.messages || []), res.data],
      }));
      setMsgText("");
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to send message.");
    } finally {
      setMsgLoading(false);
    }
  };

  if (loading) return <><Navbar /><PageSpinner /></>;
  if (!data || !data.ticket) return <><Navbar /><div className="p-8 text-center text-slate-500">Ticket not found.</div></>;

  const { ticket, messages } = data;

  return (
    <div className="min-h-screen bg-surface-900 bg-mesh">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-6 animate-fade-in">
        <button
          onClick={() => navigate("/customer")}
          className="btn-ghost text-slate-500 mb-5 pl-0 hover:text-slate-300 transition-colors"
        >
          ← Back to Dashboard
        </button>

        <div className="space-y-6">
          {/* Ticket Header */}
          <div className="glass p-6">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={ticket.status} />
                <PriorityBadge priority={ticket.priority} />
              </div>
              <span className="text-xs font-medium text-slate-500 bg-white/5 px-3 py-1 rounded-full">
                Opened {new Date(ticket.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric", month: "short", year: "numeric"
                })}
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-100 leading-snug mb-3">{ticket.title}</h1>
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
            </div>
          </div>

          {/* Messages */}
          <div className="glass flex flex-col h-[600px]">
            <div className="px-5 py-4 border-b border-white/10 bg-white/[0.02]">
              <h2 className="font-bold text-slate-200 flex items-center gap-2">
                💬 Conversation
                <span className="text-xs font-normal text-slate-500 bg-white/10 px-2 py-0.5 rounded-full">
                  {messages?.length || 0}
                </span>
              </h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-1 scrollbar-thin">
              {messages?.length === 0 && (
                <p className="text-center text-slate-600 text-sm py-10">No messages yet. We will reply shortly.</p>
              )}
              {messages?.map((msg) => (
                <MessageBubble key={msg._id} msg={msg} />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply form */}
            <div className="border-t border-white/10 p-4 bg-white/[0.02]">
              {ticket.status === "CLOSED" ? (
                <div className="text-center py-3 text-slate-500 text-sm">
                  This ticket has been closed. You cannot send new messages.
                </div>
              ) : (
                <form onSubmit={handleSendMessage}>
                  <div className="flex gap-3">
                    <textarea
                      className="input flex-1 resize-none"
                      rows={2}
                      placeholder="Type your reply to support..."
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
                      type="submit"
                      disabled={msgLoading || !msgText.trim()}
                      className="btn-primary self-end py-3 px-6 h-[46px] mt-auto"
                    >
                      {msgLoading ? <Spinner size="sm" /> : "Send"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
