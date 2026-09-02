import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { dbService } from '../services/dbAdapter';
import { ParkingLocation, ParkingSlot, VehicleType } from '../types';
import { useToast } from '../context/ToastContext';
import { 
  Search, SlidersHorizontal, MapPin, Zap, Star, Shield, Car,
  ArrowUpDown, Compass, CheckCircle2, ChevronRight, Navigation, LayoutList, Map 
} from 'lucide-react';

// Leaflet dynamic import check
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

const createDivIcon = (status: 'green' | 'yellow' | 'red') => {
  let borderClass = 'border-success';
  if (status === 'yellow') borderClass = 'border-warning';
  if (status === 'red') borderClass = 'border-error';

  return new L.DivIcon({
    html: `
      <div class="relative flex h-8 w-8 items-center justify-center rounded-full bg-brand-charcoal border-2 ${borderClass} shadow-xl transform hover:scale-110 transition-transform">
        <div class="h-6 w-6 rounded-full bg-brand-lime flex items-center justify-center font-black text-[11px] text-black font-sans shadow-inner">
          P
        </div>
        <span class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${
          status === 'green' ? 'bg-success' : status === 'yellow' ? 'bg-warning' : 'bg-error'
        } border border-brand-charcoal"></span>
      </div>
    `,
    className: 'custom-div-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};

// Map helper to handle pan/zoom transitions
const ChangeMapView: React.FC<{ coords: [number, number] }> = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(coords, 14);
  }, [coords, map]);
  return null;
};

export const FindParking: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();

  const [locations, setLocations] = useState<ParkingLocation[]>([]);
  const [locationSlots, setLocationSlots] = useState<{ [key: string]: ParkingSlot[] }>({});
  const [filteredLocations, setFilteredLocations] = useState<ParkingLocation[]>([]);
  const [loading, setLoading] = useState(true);

  // Map center state
  const [mapCenter, setMapCenter] = useState<[number, number]>([12.9756, 77.6067]); // defaults to Bangalore MG Road

  // URL state synchronization
  const queryParam = searchParams.get('query') || 'MG Road, Bengaluru';
  const dateParam = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const timeParam = searchParams.get('time') || '10:00';
  const durationParam = searchParams.get('duration') || '2';
  const vehicleParam = searchParams.get('vehicle') || '';

  // Local filter states
  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [selectedVehicleType, setSelectedVehicleType] = useState<VehicleType>('CAR');
  const [maxPrice, setMaxPrice] = useState<number>(100);
  const [minRating, setMinRating] = useState<number>(0);
  
  // Amenities toggles
  const [filterEV, setFilterEV] = useState(false);
  const [filterCCTV, setFilterCCTV] = useState(false);
  const [filterCovered, setFilterCovered] = useState(false);
  const [filter247, setFilter247] = useState(false);

  // Sorting
  const [sortBy, setSortBy] = useState<'recommended' | 'price' | 'rating' | 'availability'>('recommended');

  // Mobile Map/List Toggle
  const [mobileMode, setMobileMode] = useState<'list' | 'map'>('list');

  // Load locations and slots
  const fetchData = async () => {
    try {
      setLoading(true);
      const list = await dbService.getParkingLocations('DRIVER');
      setLocations(list);

      // Fetch slots for each location to count availability
      const slotMap: { [key: string]: ParkingSlot[] } = {};
      for (const loc of list) {
        const slots = await dbService.getParkingSlots(loc.id);
        slotMap[loc.id] = slots;
      }
      setLocationSlots(slotMap);
      
      // Center map around the first result if available
      if (list.length > 0) {
        setMapCenter([list[0].latitude, list[0].longitude]);
      }
    } catch (err: any) {
      showToast('Failed to load parking locations.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    const handleUpdate = () => fetchData();
    window.addEventListener('slot_status_changed', handleUpdate);

    // Auto-detect user current coordinates on load
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setMapCenter([lat, lng]);
          setSearchQuery('Current Location');
          setSearchParams({
            query: 'Current Location',
            date: dateParam,
            time: timeParam,
            duration: durationParam,
            vehicle: vehicleParam
          });
          showToast('Centered radar map on your current location coordinates.', 'success');
        },
        (error) => {
          console.warn('[Parkly GPS Detector] Location permission denied or unavailable:', error.message);
        }
      );
    }
    
    return () => {
      window.removeEventListener('slot_status_changed', handleUpdate);
    };
  }, []);

  // Filter & Sort Pipeline
  useEffect(() => {
    let result = [...locations];

    // Filter by text search query (bypass if searching "Current Location")
    if (queryParam && queryParam !== 'Current Location') {
      const q = queryParam.toLowerCase();
      result = result.filter(loc => 
        loc.name.toLowerCase().includes(q) || 
        loc.address.toLowerCase().includes(q)
      );
    }

    // Filter by Amenities
    if (filterEV) result = result.filter(loc => loc.amenities.includes('EV_CHARGER'));
    if (filterCCTV) result = result.filter(loc => loc.amenities.includes('CCTV'));
    if (filterCovered) result = result.filter(loc => loc.amenities.includes('COVERED'));
    if (filter247) result = result.filter(loc => loc.amenities.includes('24_7'));

    // Filter by Rating
    if (minRating > 0) {
      // Simulate static high ratings for demo
      result = result.filter(loc => 4.5 >= minRating);
    }

    // Filter by Price cap (checking if any slot satisfies price threshold)
    result = result.filter(loc => {
      const slots = locationSlots[loc.id] || [];
      const cheapestSlot = slots.reduce((min, s) => s.price_per_hour < min ? s.price_per_hour : min, 999);
      return cheapestSlot <= maxPrice;
    });

    // Sorting
    if (sortBy === 'price') {
      result.sort((a, b) => {
        const aSlots = locationSlots[a.id] || [];
        const bSlots = locationSlots[b.id] || [];
        const aMin = aSlots.reduce((min, s) => s.price_per_hour < min ? s.price_per_hour : min, 999);
        const bMin = bSlots.reduce((min, s) => s.price_per_hour < min ? s.price_per_hour : min, 999);
        return aMin - bMin;
      });
    } else if (sortBy === 'rating') {
      // Default highest rating sort
    } else if (sortBy === 'availability') {
      result.sort((a, b) => {
        const aAvail = (locationSlots[a.id] || []).filter(s => s.status === 'AVAILABLE').length;
        const bAvail = (locationSlots[b.id] || []).filter(s => s.status === 'AVAILABLE').length;
        return bAvail - aAvail;
      });
    }

    setFilteredLocations(result);
  }, [locations, locationSlots, queryParam, filterEV, filterCCTV, filterCovered, filter247, maxPrice, minRating, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({
      query: searchQuery,
      date: dateParam,
      time: timeParam,
      duration: durationParam,
      vehicle: vehicleParam
    });
    showToast(`Searching for: ${searchQuery}`, 'info');
  };

  // Helper: check availability density
  const getSlotAvailabilityStatus = (locId: string): { text: string; color: 'green' | 'yellow' | 'red'; count: number } => {
    const slots = locationSlots[locId] || [];
    const available = slots.filter(s => s.status === 'AVAILABLE').length;
    const total = slots.length;

    if (available === 0) return { text: 'Full', color: 'red', count: 0 };
    if (available <= 2) return { text: 'Limited', color: 'yellow', count: available };
    return { text: `${available}/${total} Available`, color: 'green', count: available };
  };

  return (
    <div className="h-[calc(100vh-100px)] md:h-[calc(100vh-80px)] flex flex-col md:flex-row -m-6 md:-m-8 overflow-hidden animate-fade-in">
      
      {/* ==========================================
          LEFT BAR: SEARCH RESULTS & FILTER CONTROLS
         ========================================== */}
      <section className={`w-full md:w-[420px] bg-brand-surface border-r border-brand-surface-hover flex flex-col h-full shrink-0 z-10 ${
        mobileMode === 'map' ? 'hidden md:flex' : 'flex'
      }`}>
        
        {/* Subheader Search widget */}
        <div className="p-4 border-b border-brand-surface-hover space-y-4">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-lime" size={15} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Change location..."
              className="w-full bg-[#0F0F10] border border-brand-surface-hover focus:border-brand-lime rounded-lg pl-9 pr-3 py-2 text-xs outline-none transition-all"
            />
          </form>

          {/* Inline filters */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-1.5 text-xs text-brand-text-muted">
              <ArrowUpDown size={14} className="text-brand-lime" />
              <span>Sort:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="bg-transparent border-none outline-none font-bold text-white cursor-pointer hover:text-brand-lime transition-colors"
              >
                <option value="recommended">Recommended</option>
                <option value="price">Cheapest</option>
                <option value="availability">Availability</option>
              </select>
            </div>
            
            <span className="text-[10px] font-mono bg-brand-charcoal text-brand-text-muted px-2 py-0.5 rounded border border-brand-surface-hover">
              {filteredLocations.length} locations
            </span>
          </div>
        </div>

        {/* Detailed Amenities Filters (Collapsible/Accordion panel style) */}
        <div className="p-4 border-b border-brand-surface-hover bg-brand-charcoal/30 space-y-3">
          <div className="flex items-center justify-between text-xs text-brand-text-muted font-bold">
            <span className="flex items-center space-x-1">
              <SlidersHorizontal size={12} className="text-brand-lime" />
              <span>AMENITIES FILTERS</span>
            </span>
            <button 
              type="button" 
              onClick={() => {
                setFilterEV(false); setFilterCCTV(false); setFilterCovered(false); setFilter247(false);
                setMaxPrice(100);
              }}
              className="text-[9px] text-brand-lime hover:underline font-mono"
            >
              RESET
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setFilterEV(!filterEV)}
              className={`flex items-center space-x-1.5 px-2 py-1.5 rounded border text-[10px] font-semibold transition-all ${
                filterEV 
                  ? 'border-brand-lime bg-brand-lime/10 text-brand-lime' 
                  : 'border-brand-surface-hover bg-[#0F0F10] text-brand-text-muted hover:text-white'
              }`}
            >
              <Zap size={11} />
              <span>EV Charging</span>
            </button>
            <button
              onClick={() => setFilterCCTV(!filterCCTV)}
              className={`flex items-center space-x-1.5 px-2 py-1.5 rounded border text-[10px] font-semibold transition-all ${
                filterCCTV 
                  ? 'border-brand-lime bg-brand-lime/10 text-brand-lime' 
                  : 'border-brand-surface-hover bg-[#0F0F10] text-brand-text-muted hover:text-white'
              }`}
            >
              <Shield size={11} />
              <span>CCTV Security</span>
            </button>
            <button
              onClick={() => setFilterCovered(!filterCovered)}
              className={`flex items-center space-x-1.5 px-2 py-1.5 rounded border text-[10px] font-semibold transition-all ${
                filterCovered 
                  ? 'border-brand-lime bg-brand-lime/10 text-brand-lime' 
                  : 'border-brand-surface-hover bg-[#0F0F10] text-brand-text-muted hover:text-white'
              }`}
            >
              <Car size={11} />
              <span>Covered Roof</span>
            </button>
            <button
              onClick={() => setFilter247(!filter247)}
              className={`flex items-center space-x-1.5 px-2 py-1.5 rounded border text-[10px] font-semibold transition-all ${
                filter247 
                  ? 'border-brand-lime bg-brand-lime/10 text-brand-lime' 
                  : 'border-brand-surface-hover bg-[#0F0F10] text-brand-text-muted hover:text-white'
              }`}
            >
              <Compass size={11} />
              <span>24/7 Access</span>
            </button>
          </div>

          {/* Price range slider limit */}
          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-[10px] font-mono text-brand-text-muted">
              <span>PRICE CEILING</span>
              <span className="text-white font-bold">₹{maxPrice}/hr</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              step="5"
              value={maxPrice}
              onChange={e => setMaxPrice(Number(e.target.value))}
              className="w-full h-1 bg-brand-charcoal rounded-lg appearance-none cursor-pointer accent-brand-lime"
            />
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="border border-brand-surface-hover rounded-xl p-4 space-y-3 skeleton-shimmer h-28"></div>
            ))
          ) : filteredLocations.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <Compass className="mx-auto text-brand-surface-hover" size={36} />
              <p className="text-sm font-bold text-white">No parking found nearby.</p>
              <p className="text-xs text-brand-text-muted max-w-[240px] mx-auto leading-relaxed">
                Try increasing your search radius or changing your amenities filter criteria.
              </p>
            </div>
          ) : (
            filteredLocations.map(loc => {
              const status = getSlotAvailabilityStatus(loc.id);
              const slots = locationSlots[loc.id] || [];
              const minPrice = slots.reduce((min, s) => s.price_per_hour < min ? s.price_per_hour : min, 30);
              
              let badgeColor = 'bg-success/15 text-success border-success/30';
              if (status.color === 'yellow') badgeColor = 'bg-warning/15 text-warning border-warning/30';
              if (status.color === 'red') badgeColor = 'bg-error/15 text-error border-error/30';

              return (
                <div
                  key={loc.id}
                  onClick={() => setMapCenter([loc.latitude, loc.longitude])}
                  className="bg-[#0F0F10] border border-brand-surface-hover hover:border-brand-lime/20 hover:shadow-[0_0_15px_rgba(132,204,22,0.02)] rounded-xl p-4 transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
                >
                  <div className="space-y-1">
                    <div className="flex justify-between items-start">
                      <span className={`text-[9px] font-mono border px-2 py-0.5 rounded font-bold uppercase tracking-wider ${badgeColor}`}>
                        {status.text}
                      </span>
                      <div className="flex items-center text-xs text-brand-lime">
                        <Star size={11} fill="currentColor" className="mr-0.5" />
                        <span className="font-bold">4.8</span>
                      </div>
                    </div>
                    <h4 className="text-xs font-bold text-white group-hover:text-brand-lime transition-colors mt-2">{loc.name}</h4>
                    <p className="text-[10px] text-brand-text-muted truncate">{loc.address}</p>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-brand-surface-hover text-[10px] text-brand-text-muted font-mono">
                    <div className="flex space-x-1.5">
                      {loc.amenities.includes('EV_CHARGER') && <span title="EV Plugs"><Zap size={12} className="text-brand-lime" /></span>}
                      {loc.amenities.includes('CCTV') && <span title="CCTV Secure"><Shield size={12} className="text-brand-lime" /></span>}
                      {loc.amenities.includes('COVERED') && <span title="Covered Garage"><Car size={12} className="text-brand-lime" /></span>}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-bold text-xs">₹{minPrice}/hr</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/app/parking/${loc.id}`);
                        }}
                        className="bg-brand-surface hover:bg-brand-lime hover:text-black border border-brand-surface-hover px-2.5 py-1 rounded text-[9px] font-bold transition-all flex items-center space-x-0.5"
                      >
                        <span>Reserve</span>
                        <ChevronRight size={10} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* ==========================================
          RIGHT AREA: LEAFLET MAP VIEW
         ========================================== */}
      <section className={`flex-1 h-full relative ${
        mobileMode === 'list' ? 'hidden md:block' : 'block'
      }`}>
        <MapContainer 
          center={mapCenter} 
          zoom={14} 
          className="w-full h-full"
          zoomControl={true}
        >
          <ChangeMapView coords={mapCenter} />
          
          <TileLayer
            attribution='&copy; Google Maps'
            url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
          />

          {/* Plot locations markers */}
          {filteredLocations.map(loc => {
            const statusInfo = getSlotAvailabilityStatus(loc.id);
            const slots = locationSlots[loc.id] || [];
            const minPrice = slots.reduce((min, s) => s.price_per_hour < min ? s.price_per_hour : min, 30);
            
            return (
              <Marker
                key={loc.id}
                position={[loc.latitude, loc.longitude]}
                icon={createDivIcon(statusInfo.color)}
              >
                <Popup>
                  <div className="p-3 w-56 space-y-2">
                    <h4 className="text-xs font-bold text-white border-b border-brand-surface-hover pb-1">{loc.name}</h4>
                    <p className="text-[10px] text-brand-text-muted leading-relaxed truncate">{loc.address}</p>
                    <div className="flex justify-between items-center text-[10px] font-mono pt-1">
                      <span className="text-brand-lime font-bold">₹{minPrice}/hr</span>
                      <span className="text-white font-bold">{statusInfo.text}</span>
                    </div>
                    <button
                      onClick={() => navigate(`/app/parking/${loc.id}`)}
                      className="w-full bg-brand-lime hover:bg-brand-lime-hover text-black font-bold text-[10px] py-1.5 rounded transition-all mt-1"
                    >
                      Book this Location
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </section>

      {/* ==========================================
          MOBILE FLOATING ACTION TOGGLE (Map vs List)
         ========================================== */}
      <div className="md:hidden fixed bottom-18 left-1/2 -translate-x-1/2 z-30">
        <button
          onClick={() => setMobileMode(mobileMode === 'list' ? 'map' : 'list')}
          className="bg-brand-lime hover:bg-brand-lime-hover text-black px-4 py-2.5 rounded-full shadow-2xl text-xs font-bold flex items-center space-x-2 border border-white/20"
        >
          {mobileMode === 'list' ? (
            <>
              <Map size={14} />
              <span>Map Radar View</span>
            </>
          ) : (
            <>
              <LayoutList size={14} />
              <span>List Results View</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
};
