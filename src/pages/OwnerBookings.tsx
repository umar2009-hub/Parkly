import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbAdapter';
import { Booking } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  CalendarCheck, Compass, Clock, Car, MapPin, 
  Smartphone, CheckCircle, RefreshCw, XCircle, Search, AlertCircle 
} from 'lucide-react';

export const OwnerBookings: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  
  // QR scanner simulator state
  const [qrInput, setQrInput] = useState('');
  const [scanning, setScanning] = useState(false);

  const loadReservations = async () => {
    if (user) {
      try {
        setLoading(true);
        const data = await dbService.getBookings('OWNER', user.id);
        // Sort active & confirmed first, then date descending
        setBookings(
          data.sort((a,b) => {
            const activeStates = ['CONFIRMED', 'ACTIVE'];
            if (activeStates.includes(a.status) && !activeStates.includes(b.status)) return -1;
            if (!activeStates.includes(a.status) && activeStates.includes(b.status)) return 1;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          })
        );
      } catch (err: any) {
        showToast('Error loading reservations feed.', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadReservations();
  }, [user]);

  // Simulate scanning code
  const handleQrScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrInput.trim()) return;

    try {
      setScanning(true);
      const cleanToken = qrInput.toUpperCase().trim();
      
      const { booking, error } = await dbService.checkInDriver(cleanToken, user?.id || 'system');
      if (error) {
        showToast(error, 'error');
      } else {
        showToast(`Scan Success! Driver ${booking.driver?.full_name || ''} checked in to Slot ${booking.slot?.slot_number || ''}.`, 'success');
        setQrInput('');
        loadReservations();
      }
    } catch (err: any) {
      showToast('Scan processing failed.', 'error');
    } finally {
      setScanning(false);
    }
  };

  // Quick Action Check-in
  const handleQuickCheckin = async (qrToken: string) => {
    try {
      const { error } = await dbService.checkInDriver(qrToken, user?.id || 'system');
      if (error) {
        showToast(error, 'error');
      } else {
        showToast('Check-in processed successfully.', 'success');
        loadReservations();
      }
    } catch (err: any) {
      showToast('Check-in failed.', 'error');
    }
  };

  // Quick Action Check-out
  const handleQuickCheckout = async (bookingId: string) => {
    try {
      const { overstayCharge } = await dbService.checkOutDriver(bookingId, user?.id || 'system');
      if (overstayCharge > 0) {
        showToast(`Check-out success. Overstay penalty charged: ₹${overstayCharge}`, 'warning');
      } else {
        showToast('Check-out processed successfully.', 'success');
      }
      loadReservations();
    } catch (err: any) {
      showToast('Check-out failed.', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Reservations & Scanner</h1>
        <p className="text-xs text-brand-text-muted mt-1 font-sans">Audit active driver bookings, process entrance scans and checkout billing</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ==========================================
            LEFT COLUMN: RESERVATION FEEDS LIST
           ========================================== */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex justify-between items-center border-b border-brand-surface-hover pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-brand-lime flex items-center space-x-1.5 font-mono">
              <CalendarCheck size={16} />
              <span>Stays log feed</span>
            </h3>
            <button 
              onClick={loadReservations}
              className="text-[10px] text-brand-text-muted hover:text-brand-lime flex items-center space-x-1"
            >
              <RefreshCw size={11} />
              <span>Refresh feed</span>
            </button>
          </div>

          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="border border-brand-surface-hover rounded-xl p-5 skeleton-shimmer h-24"></div>
              ))
            ) : bookings.length === 0 ? (
              <p className="text-xs text-brand-text-muted text-center py-10 bg-brand-surface/40 border border-brand-surface-hover rounded-2xl">
                No reservations received yet.
              </p>
            ) : (
              bookings.map(b => {
                let badge = 'bg-brand-lime/10 border-brand-lime/30 text-brand-lime';
                if (b.status === 'ACTIVE') badge = 'bg-info/10 border-info/30 text-info animate-pulse';
                if (b.status === 'COMPLETED') badge = 'bg-success/10 border-success/30 text-success';
                if (b.status === 'CANCELLED' || b.status === 'EXPIRED') badge = 'bg-error/10 border-error/30 text-error';

                return (
                  <div
                    key={b.id}
                    className="bg-brand-surface border border-brand-surface-hover hover:border-brand-lime/10 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
                  >
                    <div className="space-y-2 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className={`text-[8px] font-mono border px-2 py-0.5 rounded font-bold uppercase tracking-wider ${badge}`}>
                          {b.status}
                        </span>
                        <span className="text-[10px] text-brand-text-muted font-mono">Pass: {b.qr_code_token}</span>
                      </div>
                      
                      <h4 className="text-sm font-bold text-white truncate">{b.driver?.full_name || 'Driver Account'}</h4>
                      
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-brand-text-muted font-mono">
                        <span className="flex items-center space-x-1">
                          <MapPin size={12} className="text-brand-lime" />
                          <span>Slot {b.slot?.slot_number} ({b.slot?.floor})</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock size={12} className="text-brand-lime" />
                          <span>{new Date(b.start_time).toLocaleDateString()} @ {new Date(b.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Car size={12} className="text-brand-lime" />
                          <span>{b.vehicle?.brand_model} ({b.vehicle?.registration_number})</span>
                        </span>
                      </div>
                    </div>

                    {/* Quick actions for simulator */}
                    <div className="flex items-center space-x-3 pt-3 md:pt-0 border-t border-brand-surface-hover md:border-none">
                      {b.status === 'CONFIRMED' && (
                        <button
                          onClick={() => handleQuickCheckin(b.qr_code_token)}
                          className="bg-brand-lime hover:bg-brand-lime-hover text-black px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-[0_0_10px_rgba(132,204,22,0.1)]"
                        >
                          Check-in
                        </button>
                      )}
                      
                      {b.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleQuickCheckout(b.id)}
                          className="bg-[#0F0F10] hover:bg-brand-lime/10 border border-brand-surface-hover hover:border-brand-lime text-brand-lime text-xs font-bold py-1.5 px-3 rounded-lg transition-colors"
                        >
                          Checkout
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ==========================================
            RIGHT COLUMN: SCANNER SIMULATOR PANEL
           ========================================== */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-brand-surface border border-brand-surface-hover rounded-2xl p-6 space-y-5 shadow-xl">
            <h3 className="text-sm font-bold uppercase tracking-wider text-brand-lime flex items-center space-x-1.5 border-b border-brand-surface-hover pb-3">
              <Smartphone size={16} />
              <span>Simulated QR Scanner</span>
            </h3>

            <form onSubmit={handleQrScanSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-brand-text-muted uppercase tracking-widest block">Input Pass Token</label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-lime" size={16} />
                  <input
                    type="text"
                    placeholder="e.g. PKG-11B34"
                    value={qrInput}
                    onChange={e => setQrInput(e.target.value)}
                    className="w-full bg-[#0F0F10] border border-brand-surface-hover focus:border-brand-lime rounded-lg pl-10 pr-3 py-2.5 text-xs outline-none transition-all font-mono font-bold uppercase tracking-wider"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={scanning}
                className="w-full bg-brand-lime hover:bg-brand-lime-hover text-black py-2.5 rounded-lg text-xs font-bold transition-all shadow-[0_0_10px_rgba(132,204,22,0.15)] flex items-center justify-center space-x-1.5"
              >
                {scanning ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Search size={14} />
                    <span>Scan Kiosk Pass</span>
                  </>
                )}
              </button>
            </form>

            <div className="bg-[#0F0F10] border border-brand-surface-hover p-4 rounded-xl text-[10px] text-brand-text-muted font-mono leading-relaxed space-y-1">
              <span className="font-bold text-white block">HOW TO SIMULATE:</span>
              <p>1. Copy the "Pass Code" (e.g. <b>PKG-XXXXX</b>) from any CONFIRMED reservation.</p>
              <p>2. Paste and submit it above.</p>
              <p>3. The driver will be checked into their assigned slot.</p>
            </div>
          </div>
        </aside>

      </div>

    </div>
  );
};
