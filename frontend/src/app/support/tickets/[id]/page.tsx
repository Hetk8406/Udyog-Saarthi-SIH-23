'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supportService } from '@/services/supportService';
import { SupportTicket, SupportMessage } from '@/types/support';

export default function TicketConversationPage() {
  const { id } = useParams() as { id: string };
  const { user } = useAuth();
  const router = useRouter();

  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      loadTicketDetails();
    }
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadTicketDetails() {
    try {
      setLoading(true);
      const data = await supportService.getTicketDetail(id);
      setTicket(data);
      setMessages(data.messages || []);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to load ticket conversation.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!replyText.trim() || sending) return;

    setSending(true);
    try {
      const newMsg = await supportService.sendTicketMessage(id, replyText.trim());
      setMessages((prev) => [...prev, newMsg]);
      setReplyText('');
      // Refresh status if changed to in_progress
      if (ticket && (ticket.status === 'open' || ticket.status === 'assigned')) {
        setTicket({ ...ticket, status: 'in_progress', status_display: 'In Progress' });
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  }

  async function handleUpdateStatus(newStatus: string) {
    if (!ticket) return;
    try {
      const updated = await supportService.updateTicketStatus(ticket.id, newStatus);
      setTicket(updated);
    } catch (err: any) {
      alert('Could not update status: ' + (err.response?.data?.detail || err.message));
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center" aria-live="polite">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-3" />
        <p className="text-slate-600">Loading conversation...</p>
      </div>
    );
  }

  if (errorMsg || !ticket) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-lg text-center">
          <h2 className="text-lg font-bold">Access Restricted</h2>
          <p className="mt-1 text-sm">{errorMsg || 'Ticket not found or permission denied.'}</p>
          <Link
            href="/support"
            className="mt-4 inline-block px-4 py-2 bg-blue-700 text-white rounded text-sm font-semibold hover:bg-blue-800"
          >
            ← Back to Support
          </Link>
        </div>
      </div>
    );
  }

  const isCoachOrAdmin = user?.role === 'coach' || user?.role === 'admin';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Breadcrumb & Action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4 mb-6">
        <div>
          <Link
            href="/support"
            className="inline-flex items-center text-xs font-semibold text-blue-700 hover:underline mb-1 focus:outline-none focus:ring-2 focus:ring-blue-600 rounded"
          >
            ← Back to Support Desk
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {ticket.subject}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-600">
            <span className="font-semibold text-slate-800">Category:</span>
            <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">{ticket.category_display}</span>
            <span>•</span>
            <span>Candidate: <strong>{ticket.candidate_name}</strong></span>
            {ticket.assigned_coach_name && (
              <>
                <span>•</span>
                <span className="text-blue-700 font-semibold">Coach: {ticket.assigned_coach_name}</span>
              </>
            )}
          </div>
        </div>

        {/* Status selector / Close action */}
        <div className="flex items-center gap-2">
          {isCoachOrAdmin ? (
            <div className="flex items-center gap-2">
              <label htmlFor="status-select" className="text-xs font-semibold text-slate-600">Status:</label>
              <select
                id="status-select"
                value={ticket.status}
                onChange={(e) => handleUpdateStatus(e.target.value)}
                className="px-2.5 py-1 text-xs font-semibold rounded border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="open">Open</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          ) : (
            <div>
              {ticket.status !== 'closed' ? (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus('closed')}
                  className="px-3 py-1.5 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  Mark as Resolved & Close
                </button>
              ) : (
                <span className="inline-block px-3 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-700 border border-slate-300">
                  Closed
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Messages Thread Container */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-6 mb-6 min-h-[350px] max-h-[550px] overflow-y-auto space-y-4">
        {messages.length === 0 ? (
          <p className="text-center text-slate-400 py-12 text-sm">No messages yet in this ticket.</p>
        ) : (
          messages.map((m) => {
            const isMe = m.is_me;
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="text-[11px] font-semibold text-slate-500 mb-1 px-1 flex items-center gap-1.5">
                  <span>{m.sender.full_name}</span>
                  <span className="capitalize px-1.5 py-0.2 bg-slate-200 rounded text-slate-700 text-[10px]">
                    {m.sender.role}
                  </span>
                  <span>•</span>
                  <span>
                    {new Date(m.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                    isMe
                      ? 'bg-blue-700 text-white rounded-tr-none'
                      : 'bg-white text-slate-900 border border-slate-200 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.message}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Box */}
      {ticket.status === 'closed' ? (
        <div className="bg-slate-100 border border-slate-300 rounded-lg p-4 text-center text-sm text-slate-600">
          This support request is marked as <strong>Closed</strong>. You can reopen it by posting a new request or contacting your coach.
        </div>
      ) : (
        <form onSubmit={handleSendMessage} className="space-y-3">
          <label htmlFor="reply-box" className="block text-sm font-semibold text-slate-800">
            Write a Reply:
          </label>
          <div className="relative">
            <textarea
              id="reply-box"
              rows={3}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your response or clarification here..."
              required
              className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={sending || !replyText.trim()}
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {sending ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
