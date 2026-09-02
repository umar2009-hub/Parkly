import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dbService } from '../services/dbAdapter';
import { Booking, Review } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  History, Calendar, MapPin, Clock, FileText, Star, 
  X, CheckCircle, Award, Compass, MessageSquareCode, ShieldCheck, Eye, Trash2
} from 'lucide-react';

export const DriverHistory: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [pastBookings, setPastBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]); // all user reviews
  const [loading, setLoading] = useState(true);

  // Modal active states
  const [selectedReceipt, setSelectedReceipt] = useState<Booking | null>(null);
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);

  // Review Form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [cleanliness, setCleanliness] = useState(5);
  const [security, setSecurity] = useState(5);
  const [location, setLocation] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [clearing, setClearing] = useState(false);

  const handleClearHistory = async () => {
    if (!user) return;
    const confirm = window.confirm("Are you sure you want to permanently delete your past bookings history? This action cannot be undone.");
    if (!confirm) return;

    try {
      setClearing(true);
      await dbService.clearDriverHistory(user.id);
      showToast('History cleared successfully.', 'success');
      loadHistory();
    } catch (err: any) {
      showToast(err.message || 'Failed to clear history.', 'error');
    } finally {
      setClearing(false);
    }
  };

  const loadHistory = async () => {
    if (user) {
      try {
        setLoading(true);
        const data = await dbService.getBookings('DRIVER', user.id);
        
        // Filter past completed/cancelled/expired
        const past = data.filter(b => b.status === 'COMPLETED' || b.status === 'CANCELLED' || b.status === 'EXPIRED');
        setPastBookings(past.sort((a,b) => new Date(b.end_time).getTime() - new Date(a.end_time).getTime()));

        // Load reviews to cross check which bookings have already been reviewed
        if (past.length > 0) {
          // Check reviews matching this user
          // For local emulation mode, we will fetch reviews for each location
          // Represented simply:
          const locIds = Array.from(new Set(past.map(b => b.slot?.location_id || '')));
          let allReviewsList: Review[] = [];
          for (const lid of locIds) {
            if (lid) {
              const revs = await dbService.getReviews(lid);
              allReviewsList = [...allReviewsList, ...revs];
            }
          }
          setReviews(allReviewsList.filter(r => r.user_id === user.id));
        }
      } catch (err: any) {
        showToast('Error loading booking archives.', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadHistory();
  }, [user]);

  const hasBeenReviewed = (bookingId: string) => {
    return reviews.some(r => r.booking_id === bookingId);
  };

  const handleOpenReviewModal = (booking: Booking) => {
    setReviewBooking(booking);
    setRating(5);
    setComment('');
    setCleanliness(5);
    setSecurity(5);
    setLocation(5);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !reviewBooking || !reviewBooking.slot) return;

    if (!comment) {
      showToast('Please type a feedback comment.', 'warning');
      return;
    }

    try {
      setSubmittingReview(true);
      
      const newReview = await dbService.addReview({
        booking_id: reviewBooking.id,
        user_id: user.id,
        parking_id: reviewBooking.slot.location_id,
        rating,
        comment,
        cleanliness,
        security,
        location: location
      });

      showToast('Review submitted successfully!', 'success');
      
      // Trigger canvas confetti animation dynamically
      import('canvas-confetti').then((conf) => {
        conf.default({ particleCount: 50, spread: 50 });
      });

      setReviewBooking(null);
      loadHistory();
    } catch (err: any) {
      showToast(err.message || 'Failed to submit review.', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="print:hidden">
        {/* Header title */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Booking History</h1>
            <p className="text-xs text-brand-text-muted mt-1">Review past transactions, invoices and write ratings feedback</p>
          </div>
          {pastBookings.length > 0 && (
            <button
              onClick={handleClearHistory}
              disabled={clearing}
              className="bg-brand-surface border border-error/20 hover:bg-error/10 text-error px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all"
            >
              <Trash2 size={14} />
              <span>{clearing ? 'Clearing...' : 'Clear History'}</span>
            </button>
          )}
        </div>

        {/* Cards past logs */}
        <div className="space-y-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="border border-brand-surface-hover rounded-xl p-5 skeleton-shimmer h-24"></div>
            ))
          ) : pastBookings.length === 0 ? (
            <div className="bg-brand-surface border border-brand-surface-hover rounded-2xl p-12 text-center max-w-lg mx-auto space-y-4">
              <History className="mx-auto text-brand-surface-hover" size={40} />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">No past bookings.</h3>
              <p className="text-xs text-brand-text-muted max-w-xs mx-auto leading-relaxed">
                Your completed or cancelled bookings will show up here as a historical log.
              </p>
            </div>
          ) : (
          pastBookings.map(b => {
            const reviewed = hasBeenReviewed(b.id);
            let statusColor = 'bg-brand-surface-hover border-brand-surface text-brand-text-muted';
            if (b.status === 'COMPLETED') statusColor = 'bg-success/10 border-success/30 text-success';
            if (b.status === 'CANCELLED') statusColor = 'bg-error/10 border-error/30 text-error';

            return (
              <div
                key={b.id}
                className="bg-brand-surface border border-brand-surface-hover rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-brand-lime/10 transition-all"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className={`text-[8px] font-mono border px-2 py-0.5 rounded font-bold uppercase tracking-wider ${statusColor}`}>
                      {b.status}
                    </span>
                    <span className="text-[10px] text-brand-text-muted font-mono">{b.qr_code_token}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white truncate">{b.location?.name}</h4>
                  
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-brand-text-muted font-mono">
                    <span className="flex items-center space-x-1">
                      <MapPin size={12} className="text-brand-lime" />
                      <span>Slot {b.slot?.slot_number} ({b.slot?.floor})</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Clock size={12} className="text-brand-lime" />
                      <span>{new Date(b.start_time).toLocaleDateString()} @ {new Date(b.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 pt-3 md:pt-0 border-t border-brand-surface-hover md:border-none">
                  {/* Receipt Trigger */}
                  <button
                    onClick={() => setSelectedReceipt(b)}
                    className="bg-brand-surface-hover hover:text-brand-lime border border-brand-surface-hover px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5"
                  >
                    <FileText size={13} />
                    <span>Receipt</span>
                  </button>
                  
                  {/* Show Pass Trigger */}
                  {b.status === 'COMPLETED' && (
                    <button
                      onClick={() => navigate(`/app/bookings/${b.id}`)}
                      className="bg-brand-surface-hover hover:text-brand-lime border border-brand-surface-hover px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5"
                    >
                      <Eye size={13} />
                      <span>Pass</span>
                    </button>
                  )}

                  {/* Review Action */}
                  {b.status === 'COMPLETED' && (
                    reviewed ? (
                      <span className="bg-brand-lime/10 text-brand-lime border border-brand-lime/20 px-3 py-2 rounded-lg text-xs font-bold font-mono">
                        ✓ Reviewed
                      </span>
                    ) : (
                      <button
                        onClick={() => handleOpenReviewModal(b)}
                        className="bg-brand-lime hover:bg-brand-lime-hover text-black px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-[0_0_10px_rgba(132,204,22,0.1)] flex items-center space-x-1.5"
                      >
                        <MessageSquareCode size={13} />
                        <span>Rate Slot</span>
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>

      {/* ==========================================
          INVOICE RECEIPT MODAL
         ========================================== */}
      {selectedReceipt && selectedReceipt.location && selectedReceipt.slot && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 print:bg-white print:p-0">
          <div className="bg-brand-surface border border-brand-surface-hover rounded-2xl w-full max-w-md p-6 relative animate-slide-up print:border-none print:bg-white print:text-black print:shadow-none">
            <button 
              onClick={() => setSelectedReceipt(null)}
              className="absolute top-4 right-4 text-brand-text-muted hover:text-white print:hidden"
            >
              <X size={18} />
            </button>

            <div className="space-y-6">
              {/* Receipt Header */}
              <div className="text-center pb-4 border-b border-brand-surface-hover">
                <div className="w-10 h-10 rounded bg-brand-lime flex items-center justify-center text-black font-extrabold text-xl mx-auto mb-2 print:border">P</div>
                <h3 className="text-base font-bold uppercase tracking-widest font-mono text-white print:text-black">PARKLY RECEIPT</h3>
                <span className="text-[10px] text-brand-text-muted font-mono">Transaction Code: {selectedReceipt.id.split('-')[1].toUpperCase()}</span>
              </div>

              {/* Items details */}
              <div className="space-y-4 text-xs">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-brand-text-muted block uppercase">Parking Lot</span>
                  <span className="font-bold text-white print:text-black text-sm block">{selectedReceipt.location.name}</span>
                  <span className="text-brand-text-muted block">{selectedReceipt.location.address}</span>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-brand-surface-hover pt-3">
                  <div>
                    <span className="text-[9px] font-mono text-brand-text-muted block uppercase font-bold">Slot</span>
                    <span className="text-white print:text-black font-bold">Slot {selectedReceipt.slot.slot_number} ({selectedReceipt.slot.floor})</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-brand-text-muted block uppercase font-bold">Vehicle</span>
                    <span className="text-white print:text-black font-mono">REG: {selectedReceipt.qr_code_token}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-brand-surface-hover pt-3">
                  <div>
                    <span className="text-[9px] font-mono text-brand-text-muted block uppercase font-bold">Checked In</span>
                    <span className="text-white print:text-black font-mono">{new Date(selectedReceipt.start_time).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-brand-text-muted block uppercase font-bold">Checked Out</span>
                    <span className="text-white print:text-black font-mono">{new Date(selectedReceipt.end_time).toLocaleString()}</span>
                  </div>
                </div>

                {/* Total pricing calculation */}
                <div className="border-t border-brand-surface-hover pt-4 space-y-2 text-brand-text-muted font-mono">
                  <div className="flex justify-between">
                    <span>Base Fare:</span>
                    <span className="text-white print:text-black">₹{Math.ceil(selectedReceipt.total_price * 0.95)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform Service Fee:</span>
                    <span className="text-white print:text-black">₹{Math.ceil(selectedReceipt.total_price * 0.05)}</span>
                  </div>
                  <div className="flex justify-between border-t border-brand-surface-hover pt-2 text-sm font-bold">
                    <span className="text-brand-lime print:text-black uppercase">Paid Total:</span>
                    <span className="text-white print:text-black">₹{selectedReceipt.total_price}</span>
                  </div>
                </div>
              </div>

              {/* Print action button */}
              <div className="flex justify-between items-center gap-4 pt-4 border-t border-brand-surface-hover print:hidden">
                <span className="text-[10px] text-brand-text-muted font-mono flex items-center space-x-1.5">
                  <ShieldCheck size={14} className="text-brand-lime" />
                  <span>Verified Sim Payment</span>
                </span>
                <button
                  onClick={handlePrintReceipt}
                  className="bg-brand-lime hover:bg-brand-lime-hover text-black px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-[0_0_10px_rgba(132,204,22,0.1)]"
                >
                  Print Receipt
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          WRITE REVIEW MODAL
         ========================================== */}
      {reviewBooking && reviewBooking.slot && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form 
            onSubmit={handleReviewSubmit}
            className="bg-brand-surface border border-brand-surface-hover rounded-2xl w-full max-w-md p-6 relative animate-slide-up space-y-6"
          >
            <button 
              type="button"
              onClick={() => setReviewBooking(null)}
              className="absolute top-4 right-4 text-brand-text-muted hover:text-white"
            >
              <X size={18} />
            </button>

            <div className="text-center pb-2 border-b border-brand-surface-hover">
              <h3 className="text-base font-bold text-white flex items-center justify-center space-x-1.5">
                <Star size={16} className="text-brand-lime fill-brand-lime" />
                <span>Rate Parking Experience</span>
              </h3>
              <p className="text-[11px] text-brand-text-muted mt-1 truncate">{reviewBooking.location?.name}</p>
            </div>

            <div className="space-y-4">
              {/* Star selector (1-5 stars) */}
              <div className="space-y-1.5 text-center">
                <label className="text-[10px] font-mono text-brand-text-muted uppercase tracking-widest block">Overall Rating</label>
                <div className="flex justify-center space-x-2 pt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="text-brand-lime hover:scale-110 transition-transform"
                    >
                      <Star size={24} fill={star <= rating ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Sliders for category ratings (Cleanliness, Security, Location) */}
              <div className="space-y-3 bg-[#0F0F10] border border-brand-surface-hover p-4 rounded-xl text-xs font-mono text-brand-text-muted">
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span>CLEANLINESS</span>
                    <span className="text-white font-bold">{cleanliness}/5</span>
                  </div>
                  <input
                    type="range" min="1" max="5" value={cleanliness}
                    onChange={e => setCleanliness(Number(e.target.value))}
                    className="w-full h-1 bg-brand-charcoal rounded accent-brand-lime cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span>SECURITY</span>
                    <span className="text-white font-bold">{security}/5</span>
                  </div>
                  <input
                    type="range" min="1" max="5" value={security}
                    onChange={e => setSecurity(Number(e.target.value))}
                    className="w-full h-1 bg-brand-charcoal rounded accent-brand-lime cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span>LOCATION ACCESSIBILITY</span>
                    <span className="text-white font-bold">{location}/5</span>
                  </div>
                  <input
                    type="range" min="1" max="5" value={location}
                    onChange={e => setLocation(Number(e.target.value))}
                    className="w-full h-1 bg-brand-charcoal rounded accent-brand-lime cursor-pointer"
                  />
                </div>
              </div>

              {/* Comment Feedback text area */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-brand-text-muted uppercase tracking-widest block">Review Details</label>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Tell others about the slot accessibility, pricing, safety..."
                  rows={3}
                  className="w-full bg-[#0F0F10] border border-brand-surface-hover hover:border-brand-lime/20 focus:border-brand-lime rounded-lg p-3 text-xs outline-none transition-all resize-none"
                  required
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={submittingReview}
                className="w-full bg-brand-lime hover:bg-brand-lime-hover text-black py-2.5 rounded-lg text-xs font-bold transition-all shadow-[0_0_15px_rgba(132,204,22,0.15)] flex items-center justify-center space-x-1"
              >
                {submittingReview ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span>Submit Review</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
