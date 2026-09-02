import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbAdapter';
import { Booking } from '../types';
import { useToast } from '../context/ToastContext';
import { 
  Calendar, MapPin, Clock, Car, Navigation, Eye, 
  ArrowRight, Compass, Ticket, CheckSquare, Sparkles, CreditCard, XCircle, RefreshCcw
} from 'lucide-react';

export const DriverBookings: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'active'>('upcoming');
  const [loading, setLoading] = useState(true);

  const loadBookings = async () => {
    if (user) {
      try {
        setLoading(true);
        const data = await dbService.getBookings('DRIVER', user.id);
        
        // Filter out completed/cancelled/expired
        const filtered = data.filter(b => ['CONFIRMED', 'PENDING_ENTRY', 'ACTIVE', 'PENDING_PAYMENT'].includes(b.status));
        setBookings(filtered);
      } catch (err: any) {
        showToast('Error loading reservations.', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadBookings();
    
    const handleUpdate = () => loadBookings();
    window.addEventListener('booking_created', handleUpdate);
    window.addEventListener('booking_updated', handleUpdate);
    
    return () => {
      window.removeEventListener('booking_created', handleUpdate);
      window.removeEventListener('booking_updated', handleUpdate);
    };
  }, [user]);

  // Tab Filtering
  const displayedBookings = bookings.filter(b => {
    if (activeTab === 'active') return ['ACTIVE', 'PENDING_PAYMENT'].includes(b.status);
    return ['CONFIRMED', 'PENDING_ENTRY'].includes(b.status);
  });

  const [payingId, setPayingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const handleCancelBooking = async (b: Booking) => {
    const confirm = window.confirm('Cancel this reservation? You will be fully refunded.');
    if (!confirm) return;

    try {
      setCancellingId(b.id);
      await dbService.cancelBooking(b.id, b.user_id);
      showToast('Reservation cancelled successfully.', 'success');
      loadBookings();
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel reservation.', 'error');
    } finally {
      setCancellingId(null);
    }
  };

  const handlePayWalkin = async (bookingId: string) => {
    try {
      setPayingId(bookingId);
      await dbService.payWalkinFinalAmount(bookingId, 'UPI');
      showToast('Payment successful. Exit confirmed.', 'success');
      loadBookings();
    } catch (err: any) {
      showToast(err.message || 'Payment failed.', 'error');
    } finally {
      setPayingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Header title */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Active Reservations</h1>
        <p className="text-xs text-brand-text-muted mt-1">Manage and access your current digital parking passes</p>
      </div>

      {/* Tab Switcher Grid */}
      <div className="grid grid-cols-2 gap-2 bg-[#0F0F10] p-1 border border-brand-surface-hover rounded-xl max-w-md">
        <button
          type="button"
          onClick={() => setActiveTab('upcoming')}
          className={`py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
            activeTab === 'upcoming'
              ? 'bg-brand-lime text-black font-bold shadow-sm'
              : 'text-brand-text-muted hover:text-white'
          }`}
        >
          Upcoming ({bookings.filter(b => ['CONFIRMED', 'PENDING_ENTRY'].includes(b.status)).length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('active')}
          className={`py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
            activeTab === 'active'
              ? 'bg-brand-lime text-black font-bold shadow-sm'
              : 'text-brand-text-muted hover:text-white'
          }`}
        >
          Currently Parked ({bookings.filter(b => ['ACTIVE', 'PENDING_PAYMENT'].includes(b.status)).length})
        </button>
      </div>

      {/* Bookings Cards Listing */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 2 }).map((_, idx) => (
            <div key={idx} className="border border-brand-surface-hover rounded-xl p-6 skeleton-shimmer h-32"></div>
          ))
        ) : displayedBookings.length === 0 ? (
          <div className="bg-brand-surface border border-brand-surface-hover rounded-2xl p-12 text-center max-w-lg mx-auto space-y-4">
            <Ticket className="mx-auto text-brand-surface-hover" size={40} />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">No bookings yet.</h3>
            <p className="text-xs text-brand-text-muted max-w-xs mx-auto leading-relaxed">
              Find a parking spot to get started. You can rent slots by the hour.
            </p>
            <button
              onClick={() => navigate('/app/find')}
              className="bg-brand-lime hover:bg-brand-lime-hover text-black px-6 py-2.5 rounded-lg text-xs font-bold transition-all shadow-[0_0_15px_rgba(132,204,22,0.15)] inline-flex items-center space-x-1.5"
            >
              <Compass size={14} />
              <span>Find Parking Now</span>
            </button>
          </div>
        ) : (
          displayedBookings.map(b => (
            <div
              key={b.id}
              className="bg-brand-surface border border-brand-surface-hover rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-brand-lime/25 transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className={`text-[8px] font-mono border px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                    ['ACTIVE', 'PENDING_PAYMENT'].includes(b.status)
                      ? 'bg-info/10 border-info/30 text-info animate-pulse' 
                      : 'bg-brand-lime/10 border-brand-lime/30 text-brand-lime'
                  }`}>
                    {b.status}
                  </span>
                  <span className="text-[10px] text-brand-text-muted font-mono">Pass: {b.qr_code_token}</span>
                </div>
                <h4 className="text-base font-bold text-white">{b.location?.name}</h4>
                
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-brand-text-muted font-mono pt-1">
                  <span className="flex items-center space-x-1">
                    <MapPin size={13} className="text-brand-lime" />
                    <span>Slot {b.slot?.slot_number} ({b.slot?.floor})</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Clock size={13} className="text-brand-lime" />
                    <span>
                      {new Date(b.start_time).toLocaleDateString([], {month: 'short', day: 'numeric'})} @ {new Date(b.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Car size={13} className="text-brand-lime" />
                    <span>{b.vehicle?.brand_model}</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-3 md:pt-0 border-t border-brand-surface-hover md:border-none">
                {b.status === 'PENDING_PAYMENT' ? (
                  <button
                    onClick={() => handlePayWalkin(b.id)}
                    disabled={payingId === b.id}
                    className="bg-brand-warning hover:bg-brand-warning-hover text-black px-4 py-2.5 rounded-lg text-xs font-bold transition-all shadow-[0_0_10px_rgba(234,179,8,0.15)] flex items-center space-x-1.5"
                  >
                    <CreditCard size={13} />
                    <span>Pay ₹{b.final_amount} to Exit</span>
                  </button>
                ) : (
                  <div className="flex items-center space-x-2">
                    {(b.status === 'CONFIRMED' || b.status === 'PENDING_ENTRY') && (
                      <button
                        onClick={() => handleCancelBooking(b)}
                        disabled={cancellingId === b.id}
                        title="Cancel Reservation"
                        className="bg-[#0A0A0B] hover:bg-error/20 text-brand-text-muted hover:text-error px-3 py-2.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-center border border-brand-surface-hover hover:border-error/30"
                      >
                        {cancellingId === b.id ? (
                          <RefreshCcw size={13} className="animate-spin" />
                        ) : (
                          <XCircle size={13} />
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/app/bookings/${b.id}`)}
                      className="bg-brand-lime hover:bg-brand-lime-hover text-black px-4 py-2.5 rounded-lg text-xs font-bold transition-all shadow-[0_0_10px_rgba(132,204,22,0.1)] flex items-center space-x-1.5"
                    >
                      <Eye size={13} />
                      <span>Open Pass</span>
                    </button>
                  </div>
                )}
                
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${b.location?.latitude},${b.location?.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-brand-surface-hover hover:text-brand-lime border border-brand-surface-hover px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5"
                >
                  <Navigation size={13} />
                  <span>Directions</span>
                </a>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
