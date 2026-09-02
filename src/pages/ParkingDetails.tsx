import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dbService } from '../services/dbAdapter';
import { ParkingLocation, ParkingSlot, Vehicle, Review } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  Zap, Shield, Clock, Compass, Star, ChevronLeft, MapPin, 
  AlertTriangle, CreditCard, Award, Info, AlertCircle, Calendar 
} from 'lucide-react';

export const ParkingDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [location, setLocation] = useState<ParkingLocation | null>(null);
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]); // list of location ids

  // Active Floor Selection
  const [activeFloor, setActiveFloor] = useState<string>('');
  
  // Selected slot state
  const [selectedSlot, setSelectedSlot] = useState<ParkingSlot | null>(null);
  
  // Form Booking parameters
  const [bookingMode, setBookingMode] = useState<'ADVANCE' | 'WALKIN'>('ADVANCE');
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [arrivalTime, setArrivalTime] = useState('10:00');
  const [arrivalHour, setArrivalHour] = useState('10');
  const [arrivalMinute, setArrivalMinute] = useState('00');
  const [arrivalPeriod, setArrivalPeriod] = useState('AM');
  const [durationHours, setDurationHours] = useState(2);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');

  // Loading/Saving states
  const [loading, setLoading] = useState(true);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);

  // Load details
  const loadDetails = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const loc = await dbService.getParkingLocationById(id);
      if (!loc) {
        showToast('Parking location not found.', 'error');
        navigate('/app');
        return;
      }
      setLocation(loc);

      // Fetch slots
      const locSlots = await dbService.getParkingSlots(id);
      setSlots(locSlots);
      
      // Determine unique floors
      const floors = Array.from(new Set(locSlots.map(s => s.floor)));
      if (floors.length > 0) setActiveFloor(floors[0]);

      // Fetch reviews
      const locReviews = await dbService.getReviews(id);
      setReviews(locReviews);

      // Fetch user profile vehicles
      if (user) {
        const userVehicles = await dbService.getVehicles(user.id);
        setVehicles(userVehicles);
        if (userVehicles.length > 0) {
          const def = userVehicles.find(v => v.is_default) || userVehicles[0];
          setSelectedVehicleId(def.id);
        }

        // Fetch favorites
        const favs = await dbService.getFavorites(user.id);
        setFavorites(favs.map(f => f.parking_id));
      }
    } catch (err: any) {
      showToast('Error loading parking details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
    
    const handleUpdate = () => loadDetails();
    window.addEventListener('slot_status_changed', handleUpdate);
    
    return () => {
      window.removeEventListener('slot_status_changed', handleUpdate);
    };
  }, [id, user]);

  const handleFavoriteToggle = async () => {
    if (!user || !location) return;
    try {
      const added = await dbService.toggleFavorite(user.id, location.id);
      if (added) {
        setFavorites(prev => [...prev, location.id]);
        showToast('Added to favorites!', 'success');
      } else {
        setFavorites(prev => prev.filter(fid => fid !== location.id));
        showToast('Removed from favorites.', 'info');
      }
    } catch (err: any) {
      showToast('Failed to edit favorites list.', 'error');
    }
  };

  // Submit Reservation
  const handleReserveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('You must log in to reserve.', 'warning');
      navigate('/login');
      return;
    }
    if (!selectedSlot) {
      showToast('Please pick a slot from the layout floor grid.', 'warning');
      return;
    }
    if (!selectedVehicleId) {
      showToast('Please add and select a vehicle registration code.', 'warning');
      return;
    }

    try {
      setBookingSubmitting(true);
      
      // Format start and end date/time using the custom 12-hour inputs
      const convertTo24Hour = (h: string, m: string, p: string) => {
        let hour = Number(h);
        if (p === 'PM' && hour < 12) hour += 12;
        if (p === 'AM' && hour === 12) hour = 0;
        return `${hour.toString().padStart(2, '0')}:${m}`;
      };

      const finalArrivalTime = convertTo24Hour(arrivalHour, arrivalMinute, arrivalPeriod);
      const startTimeStr = `${bookingDate}T${finalArrivalTime}:00`;
      const startMs = new Date(startTimeStr).getTime();
      const endMs = startMs + (durationHours * 3600 * 1000);
      const endTimeStr = new Date(endMs).toISOString();

      const booking = await dbService.createBooking(
        user.id,
        selectedSlot.id,
        selectedVehicleId,
        new Date(startMs).toISOString(),
        endTimeStr,
        paymentMethod
      );

      showToast('Reservation processing successful!', 'success');
      
      // Trigger canvas confetti animation dynamically
      import('canvas-confetti').then((conf) => {
        conf.default({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      });

      // Route to confirmation / pass details page
      setTimeout(() => {
        navigate('/app/bookings');
      }, 2000);

    } catch (err: any) {
      showToast(err.message || 'Booking failed', 'error');
    } finally {
      setBookingSubmitting(false);
    }
  };

  const handleWalkinSubmit = async () => {
    if (!user) {
      showToast('You must log in to reserve.', 'warning');
      navigate('/login');
      return;
    }
    if (!selectedSlot) {
      showToast('Please pick a slot from the layout floor grid.', 'warning');
      return;
    }
    if (!selectedVehicleId) {
      showToast('Please add and select a vehicle registration code.', 'warning');
      return;
    }

    try {
      setBookingSubmitting(true);
      
      const booking = await dbService.createWalkinBooking(
        user.id,
        selectedSlot.id,
        selectedVehicleId,
        paymentMethod
      );

      showToast('Walk-in Entry Reserved!', 'success');
      
      import('canvas-confetti').then((conf) => {
        conf.default({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      });

      setTimeout(() => {
        navigate('/app/bookings');
      }, 2000);

    } catch (err: any) {
      showToast(err.message || 'Walk-in failed', 'error');
    } finally {
      setBookingSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 skeleton-shimmer p-8 rounded-xl min-h-[400px]">
        <div className="h-8 bg-brand-surface w-1/3 rounded"></div>
        <div className="h-60 bg-brand-surface w-full rounded"></div>
      </div>
    );
  }

  if (!location) return null;

  // Group slots by active floor
  const activeFloorSlots = slots.filter(s => s.floor === activeFloor);
  const floors = Array.from(new Set(slots.map(s => s.floor)));

  // Generate next 7 days for the premium calendar pill-picker
  const getNextSevenDays = () => {
    const days = [];
    const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dayName = weekdayNames[d.getDay()];
      const dayNum = d.getDate();
      const isoStr = d.toISOString().split('T')[0];
      days.push({ dayName, dayNum, isoStr });
    }
    return days;
  };
  const calendarDays = getNextSevenDays();

  // Calculate pricing estimates
  const currentSlotRate = selectedSlot ? selectedSlot.price_per_hour : 30;
  const baseCharge = Math.ceil(durationHours * currentSlotRate);
  const serviceFee = Math.ceil(baseCharge * 0.05); // 5% fee
  const totalCharge = baseCharge + serviceFee;

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Back button and name */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={() => navigate('/app/find')}
          className="flex items-center space-x-1 text-xs text-brand-text-muted hover:text-white transition-colors"
        >
          <ChevronLeft size={16} />
          <span>Back to map results</span>
        </button>
        
        <button
          onClick={handleFavoriteToggle}
          className={`border text-xs px-3 py-1.5 rounded-lg transition-all ${
            favorites.includes(location.id)
              ? 'border-brand-lime/30 text-brand-lime bg-brand-lime/10'
              : 'border-brand-surface-hover text-brand-text-muted hover:text-white'
          }`}
        >
          {favorites.includes(location.id) ? '★ Favorited' : '☆ Add Favorite'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ==========================================
            LEFT COLUMN: PARKING DETAIL & SLOT GRID
           ========================================== */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Header section */}
          <div className="space-y-3">
            <h1 className="text-3xl font-extrabold tracking-tight">{location.name}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-brand-text-muted">
              <span className="flex items-center space-x-1">
                <MapPin size={14} className="text-brand-lime animate-pulse-marker" />
                <span className="text-white font-semibold">{location.address}</span>
              </span>
              <span className="flex items-center space-x-1 text-brand-lime">
                <Star size={13} fill="currentColor" />
                <span className="font-bold text-white">4.8 Rating</span>
                <span className="text-brand-text-muted">({reviews.length} reviews)</span>
              </span>
            </div>
          </div>

          {/* Premium Image Gallery (simulated via high resolution mobility visuals) */}
          <div className="relative h-64 md:h-80 bg-brand-surface border border-brand-surface-hover rounded-2xl overflow-hidden group">
            <img
              src="https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=1200&h=600&q=80"
              alt="Parking bays preview"
              className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700 brightness-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent"></div>
            
            {/* Image overlay features */}
            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center text-xs">
              <span className="bg-brand-charcoal/80 border border-brand-surface-hover px-2.5 py-1 rounded text-brand-text-muted font-mono">
                Opening Hours: {location.opening_hours.open} - {location.opening_hours.close}
              </span>
              <span className="bg-brand-lime text-black font-semibold px-2.5 py-1 rounded">
                Verified Listing
              </span>
            </div>
          </div>

          {/* Description & Rules info cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-brand-surface border border-brand-surface-hover rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-brand-lime flex items-center space-x-1.5">
                <Info size={16} />
                <span>Description</span>
              </h3>
              <p className="text-xs text-brand-text-muted leading-relaxed">
                {location.description}
              </p>
            </div>
            
            <div className="bg-brand-surface border border-brand-surface-hover rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-brand-lime flex items-center space-x-1.5">
                <Shield size={16} />
                <span>Amenities</span>
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs text-brand-text-muted">
                {location.amenities.map(am => (
                  <span key={am} className="flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-lime"></span>
                    <span>{am.replace('_', ' ')}</span>
                  </span>
                ))}
                {location.amenities.length === 0 && <span>No amenities specified.</span>}
              </div>
            </div>
          </div>

          {/* INTERACTIVE PARKING SLOT SELECTION BOARD */}
          <div className="bg-brand-surface border border-brand-surface-hover rounded-2xl p-6 space-y-6">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-brand-surface-hover pb-4">
              <div>
                <h3 className="text-base font-bold flex items-center space-x-2">
                  <Compass className="text-brand-lime animate-spin-slow" size={18} />
                  <span>Choose Your Parking Slot</span>
                </h3>
                <p className="text-[11px] text-brand-text-muted mt-0.5">Click an available spot on the floor layout grid below.</p>
              </div>

              {/* Floor Switcher tabs */}
              <div className="flex space-x-1 bg-brand-charcoal p-1 rounded-lg border border-brand-surface-hover">
                {floors.map(floor => (
                  <button
                    key={floor}
                    type="button"
                    onClick={() => {
                      setActiveFloor(floor);
                      setSelectedSlot(null); // Reset selection on floor change
                    }}
                    className={`px-3 py-1 text-[10px] font-semibold uppercase tracking-wider rounded transition-all ${
                      activeFloor === floor 
                        ? 'bg-brand-lime text-black font-bold' 
                        : 'text-brand-text-muted hover:text-white'
                    }`}
                  >
                    {floor}
                  </button>
                ))}
              </div>
            </div>

            {/* Availability indicators keys */}
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-brand-text-muted font-mono justify-center bg-brand-charcoal/45 py-2.5 rounded-xl border border-brand-surface-hover">
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 bg-success rounded-sm"></span>
                <span>Available</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 bg-warning rounded-sm"></span>
                <span>Reserved</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 bg-error rounded-sm"></span>
                <span>Occupied</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 bg-brand-surface-hover border border-brand-surface rounded-sm"></span>
                <span>Maintenance</span>
              </span>
            </div>

            {/* Grid Layout of active floor */}
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
              {activeFloorSlots.map(slot => {
                let statusColor = 'border-brand-surface-hover bg-brand-surface-hover/20 text-brand-text-muted cursor-not-allowed';
                
                if (slot.status === 'AVAILABLE') statusColor = 'border-success/30 hover:border-brand-lime text-success hover:bg-success/5';
                if (slot.status === 'RESERVED') statusColor = 'border-warning/30 text-warning cursor-not-allowed bg-warning/5';
                if (slot.status === 'OCCUPIED') statusColor = 'border-error/30 text-error cursor-not-allowed bg-error/5';
                
                const isSelected = selectedSlot?.id === slot.id;
                if (isSelected) {
                  statusColor = 'border-brand-lime bg-brand-lime/10 text-brand-lime animate-pulse ring-1 ring-brand-lime/30';
                }

                const disabled = slot.status !== 'AVAILABLE';

                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    disabled={disabled}
                    className={`border p-4 rounded-xl text-center relative flex flex-col items-center justify-center space-y-1.5 transition-all text-xs font-bold font-mono ${statusColor}`}
                  >
                    <span>{slot.slot_number}</span>
                    
                    {/* EV icon for charger slots */}
                    {slot.type === 'EV' && <Zap size={11} className="text-brand-lime absolute top-1 right-1" />}
                    
                    <span className="text-[8px] font-mono opacity-80">₹{slot.price_per_hour}/hr</span>
                  </button>
                );
              })}
            </div>

            {/* Detailed select slot statistics */}
            {selectedSlot && (
              <div className="bg-[#0F0F10] border border-brand-lime/20 rounded-xl p-4 flex items-center justify-between animate-slide-up">
                <div>
                  <span className="text-[10px] font-mono text-brand-text-muted uppercase">SELECTED BAY</span>
                  <p className="text-base font-extrabold text-brand-lime font-mono">
                    Slot {selectedSlot.slot_number} (Floor: {selectedSlot.floor})
                  </p>
                  <div className="flex space-x-2 mt-1 text-[10px] text-brand-text-muted">
                    <span>Type: <b>{selectedSlot.type}</b></span>
                    <span>•</span>
                    <span>Rate: <b>₹{selectedSlot.price_per_hour}/hr</b></span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="bg-brand-lime/10 text-brand-lime border border-brand-lime/20 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider">
                    Selected
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* REVIEWS VIEW SECTION */}
          <div className="bg-brand-surface border border-brand-surface-hover rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold flex items-center space-x-2 border-b border-brand-surface-hover pb-3">
              <Star className="text-brand-lime" size={18} />
              <span>Reviews & Ratings ({reviews.length})</span>
            </h3>
            
            <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
              {reviews.length === 0 ? (
                <p className="text-xs text-brand-text-muted text-center py-8">No reviews written yet for this location.</p>
              ) : (
                reviews.map(rev => (
                  <div key={rev.id} className="bg-brand-charcoal/50 border border-brand-surface-hover p-4 rounded-xl space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center space-x-2">
                        <img 
                          src={rev.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} 
                          alt={rev.driver_name} 
                          className="w-6 h-6 rounded-full object-cover border border-brand-surface-hover"
                        />
                        <span className="font-bold text-white">{rev.driver_name}</span>
                      </div>
                      <div className="flex text-brand-lime space-x-0.5">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} size={11} fill="currentColor" />
                        ))}
                      </div>
                    </div>
                    <p className="text-[11px] text-brand-text-muted leading-relaxed italic">"{rev.comment}"</p>
                    <div className="flex space-x-3 text-[9px] text-brand-text-muted/60 font-mono">
                      <span>Cleanliness: <b>{rev.cleanliness}/5</b></span>
                      <span>Security: <b>{rev.security}/5</b></span>
                      <span>Location: <b>{rev.location}/5</b></span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* ==========================================
            RIGHT COLUMN: STICKY BOOKING PANEL
           ========================================== */}
        <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
          
          <div className="bg-brand-surface border border-brand-surface-hover rounded-2xl p-6 space-y-6 shadow-xl">
            <h3 className="text-base font-bold flex items-center space-x-2 border-b border-brand-surface-hover pb-3">
              <CreditCard className="text-brand-lime" size={18} />
              <span>Reservation Terminal</span>
            </h3>

            <form onSubmit={handleReserveSubmit} className="space-y-4">
              
              {/* Booking Mode Selection */}
              <div className="flex bg-[#0F0F10] border border-brand-surface-hover rounded-xl p-1 mb-4">
                <button
                  type="button"
                  onClick={() => setBookingMode('ADVANCE')}
                  className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                    bookingMode === 'ADVANCE' ? 'bg-brand-lime text-black shadow-md' : 'text-brand-text-muted hover:text-white'
                  }`}
                >
                  Advance Book
                </button>
                <button
                  type="button"
                  onClick={() => setBookingMode('WALKIN')}
                  className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                    bookingMode === 'WALKIN' ? 'bg-brand-lime text-black shadow-md' : 'text-brand-text-muted hover:text-white'
                  }`}
                >
                  Walk-in Now
                </button>
              </div>

              {bookingMode === 'ADVANCE' && (
                <>
                  {/* Date */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-brand-text-muted uppercase tracking-widest block flex items-center space-x-1">
                      <Calendar size={13} className="text-brand-lime" />
                      <span>Arrival Date</span>
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {calendarDays.map(day => {
                        const isSelected = bookingDate === day.isoStr;
                        return (
                          <button
                            key={day.isoStr}
                            type="button"
                            onClick={() => setBookingDate(day.isoStr)}
                            className={`p-1.5 rounded-xl border transition-all text-center flex flex-col items-center justify-center space-y-0.5 ${
                              isSelected
                                ? 'border-brand-lime bg-brand-lime/10 text-brand-lime font-bold shadow-md shadow-brand-lime/5'
                                : 'border-brand-surface-hover bg-[#0F0F10] text-brand-text-muted hover:text-white'
                            }`}
                          >
                            <span className="text-[7px] uppercase tracking-wider font-mono opacity-85">{day.dayName}</span>
                            <span className="text-sm font-extrabold font-mono">{day.dayNum}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Arrival time */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-brand-text-muted uppercase tracking-widest block flex items-center space-x-1">
                      <Clock size={13} className="text-brand-lime" />
                      <span>Arrival Time</span>
                    </label>
                    <div className="flex space-x-1.5">
                      <select
                        value={arrivalHour}
                        onChange={e => setArrivalHour(e.target.value)}
                        className="bg-[#0F0F10] border border-brand-surface-hover focus:border-brand-lime text-xs text-white rounded-lg p-2.5 outline-none flex-1 font-mono text-center font-bold"
                      >
                        {Array.from({ length: 12 }).map((_, i) => {
                          const h = (i + 1).toString().padStart(2, '0');
                          return <option key={h} value={h}>{h}</option>;
                        })}
                      </select>
                      <select
                        value={arrivalMinute}
                        onChange={e => setArrivalMinute(e.target.value)}
                        className="bg-[#0F0F10] border border-brand-surface-hover focus:border-brand-lime text-xs text-white rounded-lg p-2.5 outline-none flex-1 font-mono text-center font-bold"
                      >
                        {['00', '15', '30', '45'].map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      <select
                        value={arrivalPeriod}
                        onChange={e => setArrivalPeriod(e.target.value)}
                        className="bg-[#0F0F10] border border-brand-surface-hover focus:border-brand-lime text-xs text-white rounded-lg p-2.5 outline-none w-16 font-mono font-bold text-center"
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>

                  {/* Duration selection */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-brand-text-muted uppercase tracking-widest block">Duration (hours)</label>
                    <select
                      value={durationHours}
                      onChange={e => setDurationHours(Number(e.target.value))}
                      className="w-full bg-[#0F0F10] border border-brand-surface-hover focus:border-brand-lime rounded-lg px-3 py-2 text-xs outline-none transition-all font-mono"
                      required
                    >
                      <option value="1">1 hour</option>
                      <option value="2">2 hours</option>
                      <option value="3">3 hours</option>
                      <option value="4">4 hours</option>
                      <option value="6">6 hours</option>
                      <option value="12">12 hours</option>
                      <option value="24">24 hours</option>
                    </select>
                  </div>
                </>
              )}

              {/* Vehicle selector */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-brand-text-muted uppercase tracking-widest block">Registration Code</label>
                <select
                  value={selectedVehicleId}
                  onChange={e => setSelectedVehicleId(e.target.value)}
                  className="w-full bg-[#0F0F10] border border-brand-surface-hover focus:border-brand-lime rounded-lg px-3 py-2 text-xs outline-none transition-all"
                  required
                >
                  <option value="" disabled>Choose vehicle</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.brand_model} [{v.registration_number}]
                    </option>
                  ))}
                  {vehicles.length === 0 && (
                    <option value="" disabled>No vehicles added in profile!</option>
                  )}
                </select>
              </div>

              {/* Payment Method */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-brand-text-muted uppercase tracking-widest block">Simulated Payment</label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  className="w-full bg-[#0F0F10] border border-brand-surface-hover focus:border-brand-lime rounded-lg px-3 py-2 text-xs outline-none transition-all font-mono"
                >
                  <option value="UPI">UPI (Paytm/GPay)</option>
                  <option value="CREDIT_CARD">Credit Card / Debit</option>
                  <option value="NET_BANKING">Net Banking</option>
                </select>
              </div>

              {/* Price Calculations output panel */}
              {selectedSlot && (
                <div className="bg-brand-charcoal border border-brand-surface-hover rounded-xl p-4 space-y-2 text-xs font-mono text-brand-text-muted animate-fade-in">
                  <div className="flex justify-between">
                    <span>Base Charge:</span>
                    <span className="text-white">₹{baseCharge}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform Fee (5%):</span>
                    <span className="text-white">₹{serviceFee}</span>
                  </div>
                  <div className="flex justify-between border-t border-brand-surface-hover pt-2 text-sm font-bold">
                    <span className="text-brand-lime uppercase">Total:</span>
                    <span className="text-white">₹{totalCharge}</span>
                  </div>
                </div>
              )}

              {/* Warnings if no slot selected */}
              {!selectedSlot && (
                <div className="bg-[#0F0F10] border border-brand-surface-hover p-3 rounded-lg flex items-center space-x-2 text-[10px] text-brand-text-muted font-mono leading-relaxed">
                  <AlertCircle size={14} className="text-brand-lime shrink-0" />
                  <span>Choose a slot on the floor grid layout to preview billing estimation.</span>
                </div>
              )}

              <div className="flex flex-col space-y-2">
                {bookingMode === 'ADVANCE' && (
                  <button
                    type="submit"
                    disabled={bookingSubmitting || !selectedSlot || vehicles.length === 0}
                    className="w-full bg-brand-lime hover:bg-brand-lime-hover disabled:bg-brand-surface-hover disabled:text-brand-text-muted disabled:cursor-not-allowed text-black font-bold py-2.5 rounded-lg text-xs transition-all shadow-[0_0_15px_rgba(132,204,22,0.15)] flex items-center justify-center space-x-1.5"
                  >
                    {bookingSubmitting ? (
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <span>Advance Book (₹{selectedSlot ? totalCharge : '0'})</span>
                    )}
                  </button>
                )}

                {bookingMode === 'WALKIN' && (
                  <button
                    type="button"
                    onClick={handleWalkinSubmit}
                    disabled={bookingSubmitting || !selectedSlot || vehicles.length === 0}
                    className="w-full bg-brand-lime hover:bg-brand-lime-hover disabled:bg-brand-surface-hover disabled:text-brand-text-muted disabled:cursor-not-allowed text-black font-bold py-2.5 rounded-lg text-xs transition-all shadow-[0_0_15px_rgba(132,204,22,0.15)] flex items-center justify-center space-x-1.5"
                  >
                    {bookingSubmitting ? (
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <span>Walk-in Book</span>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* EV plug warning alert if slot is EV and vehicle type matches */}
          {selectedSlot?.type === 'EV' && (
            <div className="bg-brand-lime/5 border border-brand-lime/20 p-4 rounded-xl flex items-start space-x-3 text-xs leading-relaxed">
              <Zap size={18} className="text-brand-lime shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block">EV Charging Terminal Bay</span>
                <span className="text-brand-text-muted">This spot includes a 22kW charging plug. Ensure your selected vehicle type supports EV inputs.</span>
              </div>
            </div>
          )}

        </aside>

      </div>
    </div>
  );
};
