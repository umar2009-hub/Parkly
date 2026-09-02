import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbAdapter';
import { Booking } from '../types';
import { useToast } from '../context/ToastContext';
import { Calendar, RefreshCw, Clock, MapPin, Search } from 'lucide-react';

export const AdminBookings: React.FC = () => {
  const { showToast } = useToast();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadAllBookings = async () => {
    try {
      setLoading(true);
      const data = await dbService.getBookings('ADMIN', '');
      setBookings(data);
    } catch (err: any) {
      showToast('Error loading bookings queue.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllBookings();
    
    const handleUpdate = () => loadAllBookings();
    window.addEventListener('booking_created', handleUpdate);
    window.addEventListener('booking_updated', handleUpdate);
    
    return () => {
      window.removeEventListener('booking_created', handleUpdate);
      window.removeEventListener('booking_updated', handleUpdate);
    };
  }, []);

  const filtered = bookings.filter(b => {
    return b.location?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           b.qr_code_token.toLowerCase().includes(searchQuery.toLowerCase()) ||
           b.driver?.full_name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex justify-between items-center border-b border-brand-surface-hover pb-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Bookings queue</h1>
          <p className="text-xs text-brand-text-muted mt-1">Audit platform-wide driver stays queue and transaction payouts</p>
        </div>
        <button onClick={loadAllBookings}><RefreshCw size={14} className="text-brand-text-muted hover:text-white" /></button>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-lime" size={15} />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Filter facility, driver, pass..."
          className="w-full bg-[#0F0F10] border border-brand-surface-hover focus:border-brand-lime rounded-lg pl-9 pr-3 py-2 text-xs outline-none transition-all"
        />
      </div>

      <div className="bg-brand-surface border border-brand-surface-hover rounded-2xl p-5 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="border-b border-brand-surface-hover/30 skeleton-shimmer h-12 mb-2"></div>
            ))
          ) : (
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-brand-surface-hover text-brand-text-muted uppercase text-[10px] font-mono">
                  <th className="py-2.5">Pass</th>
                  <th className="py-2.5">Facility Location</th>
                  <th className="py-2.5">Driver</th>
                  <th className="py-2.5">Slot</th>
                  <th className="py-2.5">Total price</th>
                  <th className="py-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(b => (
                  <tr key={b.id} className="border-b border-brand-surface-hover/50 text-brand-text-muted hover:text-white transition-colors">
                    <td className="py-3 font-mono font-bold text-white">{b.qr_code_token}</td>
                    <td className="py-3 truncate max-w-[180px]">{b.location?.name}</td>
                    <td className="py-3">{b.driver?.full_name || 'Driver Account'}</td>
                    <td className="py-3 font-mono">Slot {b.slot?.slot_number}</td>
                    <td className="py-3 font-mono font-bold text-white">₹{b.total_price}</td>
                    <td className="py-3 text-right">
                      <span className={`text-[8px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                        b.status === 'COMPLETED' ? 'bg-success/10 text-success border border-success/20' : b.status === 'ACTIVE' ? 'bg-info/10 text-info border border-info/20' : 'bg-brand-surface-hover text-brand-text-muted'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-brand-text-muted">No reservations found in queue.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
