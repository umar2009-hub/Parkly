import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { dbService } from '../services/dbAdapter';
import { Booking } from '../types';
import { useToast } from '../context/ToastContext';
import { QRCodeSVG } from 'qrcode.react';
import { 
  MapPin, Clock, Car, Navigation, Calendar, XCircle, 
  ArrowLeft, CheckCircle2, ChevronRight, Award, Compass, CreditCard, ShieldCheck 
} from 'lucide-react';

export const BookingConfirmation: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  
  // Kiosk Simulation loading state
  const [simulating, setSimulating] = useState(false);

  const loadBooking = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await dbService.getBookingById(id);
      if (!data) {
        showToast('Booking pass not found.', 'error');
        navigate('/app/bookings');
        return;
      }
      if (data.status === 'COMPLETED') {
        showToast('Parking session completed successfully!', 'success');
      }
      
      setBooking(data);
    } catch (err: any) {
      showToast('Booking not found.', 'error');
      navigate('/app/bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooking();
    
    const handleUpdate = (e: any) => {
      // Only reload if this specific booking was updated
      if (e.detail?.id === id) {
        loadBooking();
      }
    };
    window.addEventListener('booking_updated', handleUpdate);
    return () => window.removeEventListener('booking_updated', handleUpdate);
  }, [id]);

  const handleCancelBooking = async () => {
    if (!booking) return;
    const confirm = window.confirm('Are you sure you want to cancel this booking? You will receive a full refund.');
    if (!confirm) return;

    try {
      setCancelling(true);
      await dbService.cancelBooking(booking.id, booking.user_id);
      showToast('Reservation successfully cancelled and refunded.', 'success');
      loadBooking();
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel reservation.', 'error');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="skeleton-shimmer h-96 w-full rounded-2xl max-w-lg mx-auto mt-6"></div>
    );
  }

  if (!booking || !booking.location || !booking.slot || !booking.vehicle) {
    return (
      <div className="p-8 text-center mt-20 text-white space-y-4">
        <XCircle className="mx-auto text-error" size={48} />
        <h2 className="text-xl font-bold">Booking Data Incomplete</h2>
        <p className="text-brand-text-muted">
          Missing relations:
          {!booking && " Booking"}
          {booking && !booking.location && " Location"}
          {booking && !booking.slot && " Slot"}
          {booking && !booking.vehicle && " Vehicle"}
        </p>
        <Link to="/app/bookings" className="text-brand-lime font-bold block mt-4">Return to Bookings</Link>
      </div>
    );
  }

  const isConfirmed = booking.status === 'CONFIRMED';
  const isActive = booking.status === 'ACTIVE';
  const isCompleted = booking.status === 'COMPLETED';
  const isCancelled = booking.status === 'CANCELLED';

  // Badge layouts
  let badgeColor = 'bg-brand-lime/10 border-brand-lime/30 text-brand-lime';
  if (isActive) badgeColor = 'bg-info/10 border-info/30 text-info animate-pulse';
  if (isCompleted) badgeColor = 'bg-success/10 border-success/30 text-success';
  if (isCancelled) badgeColor = 'bg-error/10 border-error/30 text-error';

  return (
    <div className="max-w-lg mx-auto space-y-6 pb-12 animate-fade-in">
      
      {/* Top back links */}
      <div className="flex justify-between items-center text-xs">
        <Link to="/app/bookings" className="flex items-center space-x-1.5 text-brand-text-muted hover:text-white transition-colors">
          <ArrowLeft size={14} />
          <span>My reservations</span>
        </Link>
        <span className="text-brand-text-muted font-mono text-[10px]">ID: {booking.id.split('-')[1]}</span>
      </div>

      {/* Greeting Header */}
      {isConfirmed && (
        <div className="bg-brand-surface/40 border border-brand-surface-hover rounded-xl p-4 flex items-center space-x-3 text-xs leading-relaxed">
          <CheckCircle2 size={20} className="text-brand-lime shrink-0" />
          <span><b>You're all set!</b> Your parking space is secured and ready for arrival.</span>
        </div>
      )}

      {/* DIGITAL PASS VIEW */}
      <div className="bg-brand-surface border border-brand-surface-hover rounded-2xl shadow-2xl overflow-hidden relative">
        {/* Pass header */}
        <div className="bg-brand-surface-hover/50 px-6 py-4 border-b border-brand-surface-hover flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded bg-brand-lime flex items-center justify-center text-black font-black text-sm">P</div>
            <span className="text-sm font-bold tracking-tight text-white">Digital Parking Pass</span>
          </div>
          <span className={`text-[9px] font-mono border px-2 py-0.5 rounded font-bold uppercase tracking-wider ${badgeColor}`}>
            {booking.status}
          </span>
        </div>

        {/* QR Code section */}
        <div className="bg-brand-charcoal py-8 flex flex-col items-center justify-center border-b border-brand-surface-hover relative group">
          {/* Hologram details */}
          <div className="absolute top-2 left-2 text-[8px] font-mono text-brand-text-muted/40 uppercase">Secured by Parkly RLS</div>
          
          <div className="bg-white p-4 rounded-xl shadow-lg relative">
            <QRCodeSVG 
              value={booking.exit_qr_token || booking.qr_code_token} 
              size={144}
              level="H"
              bgColor="#FFFFFF"
              fgColor="#0A0A0B"
            />
            {/* Hologram scanner line for active states */}
            {isActive && (
              <div className="absolute inset-x-4 top-4 h-0.5 bg-brand-lime animate-scan opacity-80 pointer-events-none"></div>
            )}
          </div>

          <span className={`text-sm font-bold font-mono tracking-widest mt-4 px-4 py-1.5 rounded-lg shadow-sm border ${
            booking.exit_qr_token 
              ? 'bg-brand-lime text-black border-brand-lime animate-pulse' 
              : 'text-brand-lime bg-brand-surface/80 border-brand-surface-hover'
          }`}>
            {booking.exit_qr_token ? 'EXIT QR' : 'ENTRY QR'}
          </span>
          <span className="text-[10px] text-brand-text-muted mt-1 tracking-widest font-mono">
            {booking.exit_qr_token || booking.qr_code_token}
          </span>
          <p className="text-[10px] text-brand-text-muted mt-1.5">
            {booking.exit_qr_token ? 'Show this at the gate to exit' : 'Present at the lot entry kiosk'}
          </p>
        </div>

        {/* Pass Details Info items */}
        <div className="p-6 space-y-4">
          <div className="space-y-1">
            <span className="text-[9px] font-mono text-brand-text-muted uppercase tracking-wider block">FACILITY</span>
            <span className="text-sm font-bold text-white block">{booking.location.name}</span>
            <span className="text-xs text-brand-text-muted leading-tight block">{booking.location.address}</span>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-brand-surface-hover">
            <div className="space-y-1">
              <span className="text-[9px] font-mono text-brand-text-muted uppercase tracking-wider block">ASSIGNED BAY</span>
              <span className="text-xs font-bold text-brand-lime flex items-center space-x-1">
                <MapPin size={12} />
                <span>Slot {booking.slot.slot_number} ({booking.slot.floor})</span>
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-mono text-brand-text-muted uppercase tracking-wider block">VEHICLE CODE</span>
              <span className="text-xs font-bold text-white flex items-center space-x-1">
                <Car size={12} className="text-brand-lime" />
                <span className="font-mono">{booking.vehicle.registration_number}</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-brand-surface-hover">
            <div className="space-y-1">
              <span className="text-[9px] font-mono text-brand-text-muted uppercase tracking-wider block">CHECK-IN</span>
              <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                <Clock size={12} className="text-brand-lime" />
                <span>{new Date(booking.start_time).toLocaleDateString([], { month: 'short', day: 'numeric' })} @ {new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-mono text-brand-text-muted uppercase tracking-wider block">CHECK-OUT</span>
              <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                <Clock size={12} className="text-brand-lime" />
                <span>{new Date(booking.end_time).toLocaleDateString([], { month: 'short', day: 'numeric' })} @ {new Date(booking.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-brand-surface-hover flex justify-between items-center">
            <div>
              <span className="text-[9px] font-mono text-brand-text-muted block uppercase">TOTAL AMOUNT (PAID)</span>
              <span className="text-base font-extrabold text-white font-mono">₹{booking.total_price}</span>
            </div>
            <span className="bg-brand-lime/10 text-brand-lime text-[10px] border border-brand-lime/20 px-2 py-0.5 rounded-lg flex items-center space-x-1 font-semibold">
              <ShieldCheck size={12} />
              <span>Paid Sim UPI</span>
            </span>
          </div>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="grid grid-cols-2 gap-4">
        {/* Navigation Directions */}
        {/* Navigation Directions */}
        <a 
          href={`https://www.google.com/maps/search/?api=1&query=${booking.location.latitude},${booking.location.longitude}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-brand-surface hover:bg-brand-surface-hover border border-brand-surface-hover py-2.5 rounded-xl text-xs font-semibold text-white transition-colors flex items-center justify-center space-x-2"
        >
          <Navigation size={14} className="text-brand-lime" />
          <span>Get Navigation</span>
        </a>

      </div>

      {booking.status === 'PENDING_PAYMENT' && (
        <div className="bg-brand-surface border border-error/50 rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-error uppercase tracking-wider">Payment Required to Exit</span>
            <span className="text-lg font-extrabold text-white">₹{booking.final_amount || booking.total_price}</span>
          </div>

          {(() => {
            const ms = new Date(booking.end_time).getTime() - new Date(booking.start_time).getTime();
            const hours = Math.max(1, Math.ceil(ms / (1000 * 60 * 60)));
            return (
              <div className="bg-[#0F0F10] rounded-lg p-4 space-y-2 mt-2 border border-brand-surface-hover">
                <div className="flex justify-between text-[11px] text-brand-text-muted">
                  <span>Total Time Parked</span>
                  <span className="font-mono">{hours} Hour{hours > 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between text-[11px] text-brand-text-muted">
                  <span>Hourly Rate</span>
                  <span className="font-mono">₹{booking.slot.price_per_hour}/hr</span>
                </div>
                {booking.entry_fee > 0 && (
                  <div className="flex justify-between text-[11px] text-brand-text-muted">
                    <span>Base Fee Paid</span>
                    <span className="font-mono line-through">₹{booking.entry_fee}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs text-white font-bold pt-2 border-t border-brand-surface-hover mt-2">
                  <span>Final Amount Due</span>
                  <span className="font-mono text-error">₹{booking.final_amount || booking.total_price}</span>
                </div>
              </div>
            );
          })()}

          <p className="text-xs text-brand-text-muted">
            You must clear your outstanding balance before the exit gate will open.
          </p>
          <button
            onClick={async () => {
              try {
                setSimulating(true);
                await dbService.payWalkinFinalAmount(booking.id, 'UPI');
                showToast('Payment successful! You can now scan the EXIT QR.', 'success');
                loadBooking();
              } catch (err: any) {
                showToast(err.message || 'Payment failed.', 'error');
              } finally {
                setSimulating(false);
              }
            }}
            disabled={simulating}
            className="w-full bg-brand-lime hover:bg-brand-lime-hover text-black py-2.5 rounded-xl text-xs font-bold shadow-lg transition-all"
          >
            {simulating ? 'Processing Payment...' : 'Pay via UPI Now'}
          </button>
        </div>
      )}



      {/* Cancellation controls */}
      {isConfirmed && (
        <button
          onClick={handleCancelBooking}
          disabled={cancelling}
          className="w-full border border-brand-surface-hover hover:border-error/40 hover:text-error text-brand-text-muted py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center space-x-1.5"
        >
          <XCircle size={14} />
          <span>{cancelling ? 'Cancelling...' : 'Cancel reservation (Refundable)'}</span>
        </button>
      )}

    </div>
  );
};
