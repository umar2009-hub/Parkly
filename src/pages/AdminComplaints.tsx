import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbAdapter';
import { Complaint } from '../types';
import { useToast } from '../context/ToastContext';
import { 
  ShieldAlert, RefreshCw, X, CheckCircle, 
  MessageSquare, AlertCircle, Compass, Search 
} from 'lucide-react';

export const AdminComplaints: React.FC = () => {
  const { showToast } = useToast();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  // Active resolution modal state
  const [selectedTicket, setSelectedTicket] = useState<Complaint | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadComplaints = async () => {
    try {
      setLoading(true);
      const data = await dbService.getComplaints();
      setComplaints(data);
    } catch (err: any) {
      showToast('Error loading tickets.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !notes.trim()) return;

    try {
      setSubmitting(true);
      await dbService.resolveComplaint(selectedTicket.id, notes);
      showToast('Complaint ticket resolved and closed successfully.', 'success');
      setSelectedTicket(null);
      setNotes('');
      loadComplaints();
    } catch (err: any) {
      showToast('Failed to resolve complaint.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Title */}
      <div className="flex justify-between items-center border-b border-brand-surface-hover pb-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Complaint Tickets</h1>
          <p className="text-xs text-brand-text-muted mt-1">Audit safety logs, resolve pricing disputes, add internal notes</p>
        </div>
        <button onClick={loadComplaints}><RefreshCw size={14} className="text-brand-text-muted hover:text-white" /></button>
      </div>

      {/* Tickets table */}
      <div className="bg-brand-surface border border-brand-surface-hover rounded-2xl p-5 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="border-b border-brand-surface-hover/30 skeleton-shimmer h-12 mb-2"></div>
            ))
          ) : (
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-brand-surface-hover text-brand-text-muted uppercase text-[10px] font-mono">
                  <th className="py-2.5">Ticket ID</th>
                  <th className="py-2.5">Driver</th>
                  <th className="py-2.5">Category</th>
                  <th className="py-2.5">Subject</th>
                  <th className="py-2.5">Date</th>
                  <th className="py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map(c => (
                  <tr key={c.id} className="border-b border-brand-surface-hover/50 text-brand-text-muted hover:text-white transition-colors">
                    <td className="py-3 font-mono font-bold text-white">#{c.id.split('-')[1].toUpperCase()}</td>
                    <td className="py-3">{c.driver_name}</td>
                    <td className="py-3 uppercase font-mono text-[10px]">{c.category}</td>
                    <td className="py-3 truncate max-w-[150px]">{c.subject}</td>
                    <td className="py-3">{new Date(c.created_at).toLocaleDateString()}</td>
                    <td className="py-3 text-right">
                      {c.status === 'OPEN' ? (
                        <button
                          onClick={() => { setSelectedTicket(c); setNotes(''); }}
                          className="bg-brand-lime hover:bg-brand-lime-hover text-black px-2.5 py-1 rounded text-[10px] font-bold transition-all shadow-[0_0_10px_rgba(132,204,22,0.1)]"
                        >
                          Resolve
                        </button>
                      ) : (
                        <span className="bg-success/10 text-success border border-success/20 px-2.5 py-1 rounded text-[10px] font-bold font-mono">
                          RESOLVED
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {complaints.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-brand-text-muted">No tickets filed.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ==========================================
          RESOLVE TICKET MODAL
         ========================================== */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form 
            onSubmit={handleResolveSubmit}
            className="bg-brand-surface border border-brand-surface-hover rounded-2xl w-full max-w-md p-6 relative animate-slide-up space-y-5"
          >
            <button 
              type="button" 
              onClick={() => setSelectedTicket(null)}
              className="absolute top-4 right-4 text-brand-text-muted hover:text-white"
            >
              <X size={18} />
            </button>

            <div className="text-center pb-2 border-b border-brand-surface-hover">
              <h3 className="text-base font-bold text-white flex items-center justify-center space-x-1.5">
                <ShieldAlert size={16} className="text-brand-lime" />
                <span>Ticket Resolution Console</span>
              </h3>
              <p className="text-[10px] text-brand-text-muted mt-1 font-mono">Ticket ID: #{selectedTicket.id.split('-')[1].toUpperCase()}</p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1 bg-[#0F0F10] p-3 rounded-lg border border-brand-surface-hover">
                <span className="text-[9px] text-brand-text-muted uppercase font-bold block">SUBJECT</span>
                <span className="text-white font-bold block mb-1">{selectedTicket.subject}</span>
                <span className="text-[9px] text-brand-text-muted uppercase font-bold block mt-2">DESCRIPTION</span>
                <p className="font-sans leading-relaxed text-brand-text-muted">{selectedTicket.description}</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-brand-text-muted uppercase">Resolution Note / Action Taken</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Explain resolution details (e.g. rate adjusted, owner contacted, refund processed)..."
                  rows={4}
                  className="w-full bg-[#0F0F10] border border-brand-surface-hover hover:border-brand-lime/20 focus:border-brand-lime rounded-lg p-3 text-xs outline-none transition-all resize-none"
                  required
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-brand-lime hover:bg-brand-lime-hover text-black py-2.5 rounded-lg text-xs font-bold transition-all shadow-[0_0_15px_rgba(132,204,22,0.15)] flex items-center justify-center space-x-1"
              >
                {submitting ? 'Processing...' : 'Mark Ticket Resolved'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
