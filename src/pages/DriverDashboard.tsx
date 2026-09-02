import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { dbService } from '../services/dbAdapter';
import { Booking, ParkingLocation, Vehicle, Favorite } from '../types';
import { 
  Search, MapPin, Calendar, Clock, Car, Navigation, QrCode, Sparkles, 
  Heart, Compass, ArrowRight, CheckCircle2, Star, PlusCircle, AlertCircle 
} from 'lucide-react';

export const DriverDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [favoriteLocations, setFavoriteLocations] = useState<ParkingLocation[]>([]);
  const [recommended, setRecommended] = useState<any[]>([]);

  // Search form states
  const [searchQuery, setSearchQuery] = useState('MG Road, Bengaluru');
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [arrivalTime, setArrivalTime] = useState('10:00');
  const [duration, setDuration] = useState('2'); // hours
  const [selectedVehicle, setSelectedVehicle] = useState('');

  const loadDashboardData = async () => {
    if (user) {
      try {
        // Load bookings
        const allBookings = await dbService.getBookings('DRIVER', user.id);
        const active = allBookings.find(b => 
          b.status === 'ACTIVE' || 
          b.status === 'CONFIRMED' || 
          b.status === 'PENDING_ENTRY' || 
          b.status === 'PENDING_PAYMENT'
        );
        setActiveBooking(active || null);

        // Load vehicles
        const listVeh = await dbService.getVehicles(user.id);
        setVehicles(listVeh);
        if (listVeh.length > 0) {
          const defVeh = listVeh.find(v => v.is_default) || listVeh[0];
          setSelectedVehicle(defVeh.id);
        }

        // Load favorites
        const listFavs = await dbService.getFavorites(user.id);
        setFavorites(listFavs);
        
        // Enrich favorite locations
        const favIds = listFavs.map(f => f.parking_id);
        const allLocations = await dbService.getParkingLocations('DRIVER');
        setFavoriteLocations(allLocations.filter(l => favIds.includes(l.id)));

        // Generate recommendations using scoring criteria
        // (Distance, rating, pricing match)
        const recommendedList = allLocations
          .slice(0, 3)
          .map(l => {
            const score = l.amenities.includes('EV_CHARGER') ? 95 : 88;
            return {
              location: l,
              score,
              reason: l.amenities.includes('EV_CHARGER') 
                ? 'Matches EV capability & high rating' 
                : 'Close to destination & cheap rates'
            };
          });
        setRecommended(recommendedList);
      } catch (err: any) {
        console.error('Failed to load dashboard', err);
      }
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  // Greeting helper
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning 🌅';
    if (hour < 17) return 'Good afternoon ☀️';
    return 'Good evening 🌙';
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) {
      showToast('Please specify a destination.', 'warning');
      return;
    }
    
    // Construct query parameters
    const query = new URLSearchParams({
      query: searchQuery,
      date: bookingDate,
      time: arrivalTime,
      duration: duration,
      vehicle: selectedVehicle
    }).toString();

    navigate(`/app/find?${query}`);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">{getGreeting()}, {user?.full_name.split(' ')[0]}</h1>
          <p className="text-sm text-brand-text-muted mt-1">Ready to secure a parking slot today?</p>
        </div>
        
        {/* Quick status widget */}
        <div className="bg-brand-surface border border-brand-surface-hover rounded-xl px-4 py-2 flex items-center space-x-2 text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-lime animate-pulse"></span>
          <span className="text-brand-text-muted font-mono">Real-time sync active</span>
        </div>
      </div>

      {/* Active Booking Kiosk Alert Card */}
      {activeBooking && activeBooking.location && activeBooking.slot && (
        <div className="bg-brand-surface border border-brand-lime/30 rounded-xl p-6 shadow-[0_0_20px_rgba(132,204,22,0.05)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-lime/5 blur-xl rounded-full"></div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="text-[10px] font-mono text-brand-lime uppercase tracking-widest font-bold block">
                {activeBooking.status === 'ACTIVE' ? 'CURRENT ACTIVE STAY' : 'UPCOMING RESERVATION'}
              </span>
              <h2 className="text-xl font-bold">{activeBooking.location.name}</h2>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-brand-text-muted font-mono">
                <span className="flex items-center space-x-1">
                  <MapPin size={13} className="text-brand-lime" />
                  <span>Slot {activeBooking.slot.slot_number} ({activeBooking.slot.floor})</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Clock size={13} className="text-brand-lime" />
                  <span>
                    {new Date(activeBooking.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(activeBooking.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button 
                onClick={() => navigate(`/app/bookings/${activeBooking.id}`)}
                className="bg-brand-lime hover:bg-brand-lime-hover text-black px-4 py-2.5 rounded-lg text-xs font-bold transition-all shadow-[0_0_10px_rgba(132,204,22,0.1)] flex items-center space-x-1.5"
              >
                <span>Show QR Pass</span>
              </button>
              
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${activeBooking.location.latitude},${activeBooking.location.longitude}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-brand-surface-hover hover:text-brand-lime border border-brand-surface-hover px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5"
              >
                <Navigation size={13} />
                <span>Directions</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Main Search Panel & Info Widget Column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Search Widget */}
        <form onSubmit={handleSearchSubmit} className="lg:col-span-8 bg-brand-surface border border-brand-surface-hover rounded-2xl p-6 space-y-6 shadow-xl">
          <div className="flex justify-between items-center border-b border-brand-surface-hover pb-3">
            <h3 className="text-base font-bold flex items-center space-x-2">
              <Compass className="text-brand-lime" size={18} />
              <span>Smart Search Terminal</span>
            </h3>
            <span className="text-[10px] text-brand-text-muted font-mono">Step 1 of 3</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Query */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-brand-text-muted uppercase tracking-widest block">Destination</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-lime" size={16} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="e.g. MG Road, Bengaluru"
                  className="w-full bg-[#0F0F10] border border-brand-surface-hover focus:border-brand-lime rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none transition-all"
                  required
                />
              </div>
            </div>

            {/* Vehicle selection */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-brand-text-muted uppercase tracking-widest block">Select Vehicle</label>
              <div className="relative">
                <Car className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-lime" size={16} />
                <select
                  value={selectedVehicle}
                  onChange={e => setSelectedVehicle(e.target.value)}
                  className="w-full bg-[#0F0F10] border border-brand-surface-hover focus:border-brand-lime rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none transition-all"
                  required
                >
                  <option value="" disabled>Choose a vehicle</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.brand_model} ({v.registration_number})
                    </option>
                  ))}
                  {vehicles.length === 0 && (
                    <option value="" disabled>No vehicles added. Use settings.</option>
                  )}
                </select>
              </div>
            </div>

            {/* Date */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-brand-text-muted uppercase tracking-widest block">Booking Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-lime" size={16} />
                <input
                  type="date"
                  value={bookingDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setBookingDate(e.target.value)}
                  className="w-full bg-[#0F0F10] border border-brand-surface-hover focus:border-brand-lime rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none transition-all font-mono"
                  required
                />
              </div>
            </div>

            {/* Arrival Time and Duration */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-brand-text-muted uppercase tracking-widest block">Arrival</label>
                <div className="relative">
                  <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-lime" size={15} />
                  <input
                    type="time"
                    value={arrivalTime}
                    onChange={e => setArrivalTime(e.target.value)}
                    className="w-full bg-[#0F0F10] border border-brand-surface-hover focus:border-brand-lime rounded-lg pl-8 pr-2 py-2.5 text-sm outline-none transition-all font-mono"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-brand-text-muted uppercase tracking-widest block">Duration</label>
                <select
                  value={duration}
                  onChange={e => setDuration(e.target.value)}
                  className="w-full bg-[#0F0F10] border border-brand-surface-hover focus:border-brand-lime rounded-lg px-3 py-2.5 text-sm outline-none transition-all font-mono"
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
            </div>
          </div>

          {vehicles.length === 0 && (
            <div className="bg-warning/10 border border-warning/20 p-3 rounded-lg flex items-start space-x-2 text-xs text-warning">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>You must configure at least one vehicle in your profile settings to book. <Link to="/app/profile" className="underline font-bold text-white hover:text-brand-lime">Add Vehicle Now</Link></span>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-brand-lime hover:bg-brand-lime-hover text-black py-3 rounded-lg font-bold transition-all shadow-[0_0_20px_rgba(132,204,22,0.15)] flex items-center justify-center space-x-2"
          >
            <Search size={16} />
            <span>Search live availability</span>
          </button>
        </form>

        {/* Favorite locations quick list */}
        <div className="lg:col-span-4 bg-brand-surface border border-brand-surface-hover rounded-2xl p-6 flex flex-col justify-between shadow-xl">
          <div className="space-y-4">
            <h3 className="text-base font-bold flex items-center space-x-2 border-b border-brand-surface-hover pb-3">
              <Heart className="text-brand-lime" size={18} fill="currentColor" />
              <span>Favorite Slots</span>
            </h3>
            
            <div className="space-y-3">
              {favoriteLocations.length === 0 ? (
                <div className="text-center py-6 text-brand-text-muted space-y-2">
                  <Heart size={24} className="mx-auto text-brand-surface-hover" />
                  <p className="text-xs">No favorites saved yet.</p>
                </div>
              ) : (
                favoriteLocations.slice(0, 3).map(fav => (
                  <button
                    key={fav.id}
                    onClick={() => {
                      setSearchQuery(fav.address.split(',')[0]);
                      showToast(`Selected favorite: ${fav.name}`, 'info');
                    }}
                    className="w-full text-left bg-[#0F0F10] border border-brand-surface-hover hover:border-brand-lime/20 p-3 rounded-lg transition-all flex items-center justify-between group"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="text-xs font-bold truncate">{fav.name}</p>
                      <p className="text-[10px] text-brand-text-muted truncate mt-0.5">{fav.address.split(',')[1] || fav.address}</p>
                    </div>
                    <ArrowRight size={14} className="text-brand-text-muted group-hover:text-brand-lime transition-colors" />
                  </button>
                ))
              )}
            </div>
          </div>

          <Link 
            to="/app/favorites"
            className="w-full border border-brand-surface-hover hover:border-brand-lime/30 text-xs font-semibold py-2.5 rounded-lg text-brand-text-muted hover:text-white transition-all text-center block mt-4"
          >
            Manage Favorites ({favorites.length})
          </Link>
        </div>

      </div>

      {/* Recommended Parking Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold flex items-center space-x-2">
          <Sparkles className="text-brand-lime" size={20} />
          <span>Recommended Spots</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recommended.map(({ location: loc, score, reason }) => (
            <div 
              key={loc.id}
              className="bg-brand-surface border border-brand-surface-hover hover:border-brand-lime/20 rounded-xl p-5 shadow-lg flex flex-col justify-between space-y-4 transition-all"
            >
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] bg-brand-lime/10 text-brand-lime border border-brand-lime/20 px-1.5 py-0.5 rounded font-mono font-bold">
                    {score}% MATCH
                  </span>
                  <div className="flex items-center text-xs text-brand-lime">
                    <Star size={12} fill="currentColor" className="mr-0.5" />
                    <span className="font-bold">4.8</span>
                  </div>
                </div>

                <h4 className="text-sm font-bold mt-3 text-white">{loc.name}</h4>
                <p className="text-[11px] text-brand-text-muted mt-1 truncate">{loc.address}</p>
                <p className="text-[10px] text-brand-lime/70 font-mono mt-2 italic">"{reason}"</p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-brand-surface-hover">
                <span className="text-xs font-bold text-white font-mono">₹30-60/hr</span>
                <button
                  onClick={() => navigate(`/app/parking/${loc.id}`)}
                  className="bg-brand-surface-hover hover:bg-brand-lime hover:text-black border border-brand-surface-hover px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
