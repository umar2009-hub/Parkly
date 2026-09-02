import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbAdapter';
import { ParkingLocation } from '../types';
import { useToast } from '../context/ToastContext';
import { 
  Building2, MapPin, Clock, Key, Shield, Zap, 
  Check, X, AlertCircle, RefreshCw, Compass 
} from 'lucide-react';

export const AdminParking: React.FC = () => {
  const { showToast } = useToast();

  const [pendingLocs, setPendingLocs] = useState<ParkingLocation[]>([]);
  const [loading, setLoading] = useState(true);

  // Rejection Form states
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadPendingParking = async () => {
    try {
      setLoading(true);
      const all = await dbService.getParkingLocations();
      // Filter for DRAFT or PENDING_REVIEW
      setPendingLocs(all.filter(l => l.status === 'PENDING_REVIEW'));
    } catch (err: any) {
      showToast('Error loading review queues.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingParking();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      setSubmitting(true);
      await dbService.approveParkingLocation(id, true, '', 'admin-1', 'Vikram Singh');
      showToast('Parking location approved and published live!', 'success');
      loadPendingParking();
    } catch (err: any) {
      showToast('Failed to approve property.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectId || !reason) return;

    try {
      setSubmitting(true);
      await dbService.approveParkingLocation(rejectId, false, reason, 'admin-1', 'Vikram Singh');
      showToast('Parking location listing rejected. Owner notified.', 'info');
      setRejectId(null);
      setReason('');
      loadPendingParking();
    } catch (err: any) {
      showToast('Failed to reject property.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Title */}
      <div className="flex justify-between items-center border-b border-brand-surface-hover pb-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Parking Approvals</h1>
          <p className="text-xs text-brand-text-muted mt-1 font-sans">Audit and authorize newly registered parking spaces layout structures</p>
        </div>
        <button onClick={loadPendingParking}><RefreshCw size={14} className="text-brand-text-muted hover:text-white" /></button>
      </div>

      {/* Pending lists */}
      <div className="space-y-6">
        {loading ? (
          Array.from({ length: 2 }).map((_, idx) => (
            <div key={idx} className="border border-brand-surface-hover rounded-xl p-6 skeleton-shimmer h-32"></div>
          ))
        ) : pendingLocs.length === 0 ? (
          <div className="bg-brand-surface border border-brand-surface-hover rounded-2xl p-12 text-center max-w-lg mx-auto space-y-3">
            <Building2 className="mx-auto text-brand-surface-hover" size={36} />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">No pending reviews.</h3>
            <p className="text-xs text-brand-text-muted max-w-xs mx-auto leading-relaxed">
              All properties are approved or archived. New listings will automatically appear in this pipeline.
            </p>
          </div>
        ) : (
          pendingLocs.map(loc => (
            <div 
              key={loc.id}
              className="bg-brand-surface border border-brand-surface-hover rounded-2xl p-6 space-y-6 shadow-lg"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-white">{loc.name}</h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-brand-text-muted font-mono">
                    <span className="flex items-center space-x-1">
                      <MapPin size={13} className="text-brand-lime" />
                      <span>{loc.address}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Clock size={13} className="text-brand-lime" />
                      <span>{loc.opening_hours.open} - {loc.opening_hours.close}</span>
                    </span>
                  </div>
                </div>

                {/* Audit approvals quick triggers */}
                <div className="flex items-center space-x-3 shrink-0">
                  <button
                    onClick={() => handleApprove(loc.id)}
                    disabled={submitting}
                    className="bg-brand-lime hover:bg-brand-lime-hover text-black px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-[0_0_10px_rgba(132,204,22,0.15)] flex items-center space-x-1"
                  >
                    <Check size={14} />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => setRejectId(loc.id)}
                    disabled={submitting}
                    className="bg-brand-charcoal hover:bg-error/15 border border-brand-surface-hover hover:border-error/30 text-brand-text-muted hover:text-error px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1"
                  >
                    <X size={14} />
                    <span>Reject</span>
                  </button>
                </div>
              </div>

              {/* Specs previews */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono text-brand-text-muted bg-[#0F0F10] p-4 rounded-xl border border-brand-surface-hover">
                <div className="space-y-1">
                  <span className="text-[9px] text-brand-text-muted uppercase font-bold block">DESCRIPTION</span>
                  <p className="font-sans leading-relaxed text-white">{loc.description}</p>
                </div>
                <div className="space-y-2">
                  <span className="text-[9px] text-brand-text-muted uppercase font-bold block">AMENITIES PROVIDED</span>
                  <div className="flex flex-wrap gap-2 pt-1 text-[9px] text-white">
                    {loc.amenities.map(am => (
                      <span key={am} className="bg-brand-surface border border-brand-surface-hover px-2 py-0.5 rounded">
                        {am.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ==========================================
          REJECTION FORM MODAL
         ========================================== */}
      {rejectId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form 
            onSubmit={handleRejectSubmit}
            className="bg-brand-surface border border-brand-surface-hover rounded-2xl w-full max-w-md p-6 relative animate-slide-up space-y-5"
          >
            <button 
              type="button" 
              onClick={() => setRejectId(null)}
              className="absolute top-4 right-4 text-brand-text-muted hover:text-white"
            >
              <X size={18} />
            </button>

            <div className="text-center pb-2 border-b border-brand-surface-hover">
              <h3 className="text-base font-bold text-white flex items-center justify-center space-x-1.5">
                <AlertCircle size={16} className="text-error" />
                <span>Specify Rejection Reason</span>
              </h3>
              <p className="text-[10px] text-brand-text-muted mt-1 font-mono">Owner will receive an automated alert details</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-mono text-brand-text-muted uppercase">Notes/Comments</label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="e.g. Invalid coordinates provided, physical facility address mismatch..."
                  rows={4}
                  className="w-full bg-[#0F0F10] border border-brand-surface-hover hover:border-brand-lime/20 focus:border-brand-lime rounded-lg p-3 text-xs outline-none transition-all resize-none"
                  required
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-error hover:bg-error/80 text-white py-2 rounded-lg text-xs font-bold transition-colors"
              >
                {submitting ? 'Rejecting...' : 'Reject Property Listing'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
