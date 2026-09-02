import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbAdapter';
import { ParkingLocation, Favorite, ParkingSlot } from '../types';
import { useToast } from '../context/ToastContext';
import { 
  Heart, MapPin, Star, Zap, Trash2, ArrowRight, 
  ChevronRight, Compass, Shield, ShieldCheck 
} from 'lucide-react';

export const DriverFavorites: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [locations, setLocations] = useState<ParkingLocation[]>([]);
  const [locationSlots, setLocationSlots] = useState<{ [key: string]: ParkingSlot[] }>({});
  const [loading, setLoading] = useState(true);

  const loadFavorites = async () => {
    if (user) {
      try {
        setLoading(true);
        const favs = await dbService.getFavorites(user.id);
        setFavorites(favs);

        const favIds = favs.map(f => f.parking_id);
        const allLocations = await dbService.getParkingLocations('DRIVER');
        const matchedLocations = allLocations.filter(l => favIds.includes(l.id));
        setLocations(matchedLocations);

        // Fetch slots
        const slotMap: { [key: string]: ParkingSlot[] } = {};
        for (const loc of matchedLocations) {
          const slots = await dbService.getParkingSlots(loc.id);
          slotMap[loc.id] = slots;
        }
        setLocationSlots(slotMap);
      } catch (err: any) {
        showToast('Error loading favorites.', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadFavorites();
  }, [user]);

  const handleRemoveFavorite = async (parkingId: string) => {
    if (!user) return;
    try {
      await dbService.toggleFavorite(user.id, parkingId);
      showToast('Removed from favorites.', 'info');
      loadFavorites();
    } catch (err: any) {
      showToast('Failed to remove favorite.', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Header title */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Saved Favorites</h1>
        <p className="text-xs text-brand-text-muted mt-1">Easily compare and book your preferred parking facilities</p>
      </div>

      {/* Cards list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          Array.from({ length: 2 }).map((_, idx) => (
            <div key={idx} className="border border-brand-surface-hover rounded-xl p-6 skeleton-shimmer h-36"></div>
          ))
        ) : locations.length === 0 ? (
          <div className="col-span-2 bg-brand-surface border border-brand-surface-hover rounded-2xl p-12 text-center max-w-lg mx-auto space-y-4">
            <Heart className="mx-auto text-brand-surface-hover" size={40} />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">No favorites yet.</h3>
            <p className="text-xs text-brand-text-muted max-w-xs mx-auto leading-relaxed">
              Save parking locations for quick access. Click the star icon on any parking slot details page.
            </p>
            <button
              onClick={() => navigate('/app/find')}
              className="bg-brand-lime hover:bg-brand-lime-hover text-black px-6 py-2.5 rounded-lg text-xs font-bold transition-all shadow-[0_0_15px_rgba(132,204,22,0.15)] inline-flex items-center space-x-1.5"
            >
              <Compass size={14} />
              <span>Search Spaces</span>
            </button>
          </div>
        ) : (
          locations.map(loc => {
            const slots = locationSlots[loc.id] || [];
            const available = slots.filter(s => s.status === 'AVAILABLE').length;
            const minPrice = slots.reduce((min, s) => s.price_per_hour < min ? s.price_per_hour : min, 30);
            
            return (
              <div
                key={loc.id}
                className="bg-brand-surface border border-brand-surface-hover hover:border-brand-lime/10 rounded-2xl p-6 flex flex-col justify-between space-y-6 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className={`text-[9px] font-mono border px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                      available === 0 
                        ? 'bg-error/15 text-error border-error/30' 
                        : 'bg-success/15 text-success border-success/30'
                    }`}>
                      {available === 0 ? 'Full' : `${available}/${slots.length} Available`}
                    </span>
                    <button
                      onClick={() => handleRemoveFavorite(loc.id)}
                      className="text-brand-text-muted hover:text-error transition-colors"
                      title="Remove Favorite"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <h3 className="text-base font-bold text-white leading-tight">{loc.name}</h3>
                  <p className="text-xs text-brand-text-muted leading-tight truncate">{loc.address}</p>

                  <div className="flex items-center space-x-4 text-xs font-mono text-brand-text-muted">
                    <div className="flex items-center text-brand-lime">
                      <Star size={12} fill="currentColor" className="mr-0.5" />
                      <span className="font-bold text-white">4.8</span>
                    </div>
                    <span>•</span>
                    <span>Starting: <b>₹{minPrice}/hr</b></span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-brand-surface-hover">
                  <div className="flex space-x-2">
                    {loc.amenities.includes('EV_CHARGER') && <span title="EV Charger"><Zap size={13} className="text-brand-lime" /></span>}
                    {loc.amenities.includes('CCTV') && <span title="CCTV"><Shield size={13} className="text-brand-lime" /></span>}
                  </div>
                  <button
                    onClick={() => navigate(`/app/parking/${loc.id}`)}
                    className="bg-brand-lime hover:bg-brand-lime-hover text-black px-3.5 py-2 rounded-lg text-xs font-bold transition-all shadow-[0_0_10px_rgba(132,204,22,0.1)] flex items-center space-x-1"
                  >
                    <span>Reserve</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
