import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbAdapter';
import { ParkingLocation, ParkingSlot, SlotStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  Key, Building, CheckCircle, AlertTriangle, Compass, 
  Settings, CheckCircle2, RefreshCw, Zap, Info, ShieldAlert 
} from 'lucide-react';

export const OwnerSlots: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [locations, setLocations] = useState<ParkingLocation[]>([]);
  const [selectedLocId, setSelectedLocId] = useState('');
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<ParkingSlot | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const loadOwnerProperties = async () => {
    if (user) {
      try {
        setLoading(true);
        const data = await dbService.getParkingLocations('OWNER', user.id);
        const approvedLocs = data.filter(l => l.status === 'APPROVED');
        setLocations(approvedLocs);
        if (approvedLocs.length > 0) {
          setSelectedLocId(approvedLocs[0].id);
        } else {
          setSelectedLocId('');
        }
      } catch (err: any) {
        showToast('Error loading properties.', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const loadSlots = async () => {
    if (!selectedLocId) return;
    try {
      const data = await dbService.getParkingSlots(selectedLocId);
      setSlots(data);
      // Reset selected slot detail
      setSelectedSlot(null);
    } catch (err: any) {
      showToast('Error loading slots.', 'error');
    }
  };

  useEffect(() => {
    loadOwnerProperties();
  }, [user]);

  useEffect(() => {
    loadSlots();
    
    // Listen for realtime slot status changes
    const handleSlotUpdate = (e: any) => {
      if (e.detail?.locationId === selectedLocId) {
        loadSlots();
      }
    };
    window.addEventListener('slot_status_changed', handleSlotUpdate);
    return () => window.removeEventListener('slot_status_changed', handleSlotUpdate);
  }, [selectedLocId]);

  const handleStatusOverride = async (newStatus: SlotStatus) => {
    if (!selectedSlot) return;
    
    // Warning Check: Is the slot currently booked (Reserved)?
    if (selectedSlot.status === 'RESERVED') {
      const doubleCheck = window.confirm(
        `WARNING: Slot ${selectedSlot.slot_number} has an active driver reservation. Overriding this status manually might disrupt active parking checkins. Do you want to proceed?`
      );
      if (!doubleCheck) return;
    }

    try {
      setUpdating(true);
      await dbService.updateSlotStatus(selectedSlot.id, newStatus);
      showToast(`Slot status overridden to: ${newStatus}`, 'success');
      loadSlots();
    } catch (err: any) {
      console.error('Update slot error:', err);
      showToast(`Failed: ${err.message}`, 'error');
    } finally {
      setUpdating(false);
    }
  };

  // Group by floors
  const floors = Array.from(new Set(slots.map(s => s.floor)));

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Real-time Slot Control</h1>
          <p className="text-xs text-brand-text-muted mt-1 font-sans">Override slot availability statuses and perform maintenance locks</p>
        </div>

        {/* Location switcher */}
        <div className="flex items-center space-x-2">
          <Building size={16} className="text-brand-lime" />
          <select
            value={selectedLocId}
            onChange={e => setSelectedLocId(e.target.value)}
            className="bg-brand-surface border border-brand-surface-hover rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:border-brand-lime transition-all"
          >
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
            {locations.length === 0 && (
              <option value="">No locations live</option>
            )}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ==========================================
            LEFT PANEL: INTERACTIVE GRID BY FLOORS
           ========================================== */}
        <div className="lg:col-span-8 bg-brand-surface border border-brand-surface-hover rounded-2xl p-6 space-y-6 shadow-xl">
          {slots.length === 0 ? (
            <div className="text-center py-12 text-brand-text-muted space-y-2">
              <Key size={32} className="mx-auto text-brand-surface-hover" />
              <p className="text-xs">No slots found for this location.</p>
            </div>
          ) : (
            floors.map(floor => (
              <div key={floor} className="space-y-3 border-b border-brand-surface-hover/40 pb-5 last:border-none last:pb-0">
                <span className="text-xs font-mono font-bold text-brand-lime block uppercase tracking-wider">{floor} Layout</span>
                
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                  {slots
                    .filter(s => s.floor === floor)
                    .map(slot => {
                      let colorClass = 'border-success/30 bg-success/5 text-success hover:border-brand-lime';
                      if (slot.status === 'OCCUPIED') colorClass = 'border-error/30 bg-error/5 text-error';
                      if (slot.status === 'RESERVED') colorClass = 'border-warning/30 bg-warning/5 text-warning';
                      if (slot.status === 'MAINTENANCE') colorClass = 'border-brand-surface-hover bg-brand-charcoal text-brand-text-muted';
                      
                      const isSelected = selectedSlot?.id === slot.id;
                      if (isSelected) {
                        colorClass = 'border-brand-lime bg-brand-lime/10 text-brand-lime ring-1 ring-brand-lime/40';
                      }

                      return (
                        <button
                          key={slot.id}
                          onClick={() => setSelectedSlot(slot)}
                          className={`border py-3.5 rounded-xl text-center relative flex flex-col items-center justify-center font-mono font-bold transition-all text-xs ${colorClass}`}
                        >
                          <span>{slot.slot_number}</span>
                          {slot.type === 'EV' && <Zap size={9} className="text-brand-lime absolute top-1 right-1" />}
                          <span className={`w-1.5 h-1.5 rounded-full absolute bottom-1 right-1 ${
                            slot.status === 'AVAILABLE' ? 'bg-success' : slot.status === 'OCCUPIED' ? 'bg-error' : slot.status === 'RESERVED' ? 'bg-warning' : 'bg-brand-text-muted'
                          }`}></span>
                        </button>
                      );
                    })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* ==========================================
            RIGHT PANEL: CONTROL OVERRIDES
           ========================================== */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-brand-surface border border-brand-surface-hover rounded-2xl p-6 space-y-6 shadow-xl">
            <h3 className="text-sm font-bold uppercase tracking-wider text-brand-lime flex items-center space-x-1.5 border-b border-brand-surface-hover pb-3">
              <Settings size={16} />
              <span>Override Console</span>
            </h3>

            {selectedSlot ? (
              <div className="space-y-6 animate-fade-in">
                
                {/* Details */}
                <div className="bg-brand-charcoal p-4 rounded-xl border border-brand-surface-hover space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-brand-text-muted">SLOT NUMBER:</span>
                    <span className="text-white font-bold">{selectedSlot.slot_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-brand-text-muted">FLOOR:</span>
                    <span className="text-white">{selectedSlot.floor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-brand-text-muted">SLOT TYPE:</span>
                    <span className="text-brand-lime font-bold">{selectedSlot.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-brand-text-muted">HOURLY RATE:</span>
                    <span className="text-white">₹{selectedSlot.price_per_hour}/hr</span>
                  </div>
                  <div className="flex justify-between border-t border-brand-surface-hover pt-2">
                    <span className="text-brand-text-muted">CURRENT STATUS:</span>
                    <span className={`font-bold ${
                      selectedSlot.status === 'AVAILABLE' ? 'text-success' : selectedSlot.status === 'OCCUPIED' ? 'text-error' : 'text-warning'
                    }`}>{selectedSlot.status}</span>
                  </div>
                </div>

                {/* Overrides buttons */}
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-brand-text-muted uppercase tracking-widest block mb-1">Select Status Target</label>
                  
                  <button
                    onClick={() => handleStatusOverride('AVAILABLE')}
                    disabled={updating}
                    className="w-full bg-[#0F0F10] hover:border-success border border-brand-surface-hover text-success text-xs font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center space-x-1.5"
                  >
                    <CheckCircle size={14} />
                    <span>Set to Available</span>
                  </button>

                  <button
                    onClick={() => handleStatusOverride('OCCUPIED')}
                    disabled={updating}
                    className="w-full bg-[#0F0F10] hover:border-error border border-brand-surface-hover text-error text-xs font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center space-x-1.5"
                  >
                    <ShieldAlert size={14} />
                    <span>Set to Occupied</span>
                  </button>

                  <button
                    onClick={() => handleStatusOverride('MAINTENANCE')}
                    disabled={updating}
                    className="w-full bg-[#0F0F10] hover:border-brand-text-muted border border-brand-surface-hover text-brand-text-muted text-xs font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center space-x-1.5"
                  >
                    <Settings size={14} />
                    <span>Lock for Maintenance</span>
                  </button>
                </div>

              </div>
            ) : (
              <div className="bg-[#0F0F10] border border-brand-surface-hover p-4 rounded-xl flex items-center space-x-2 text-xs text-brand-text-muted leading-relaxed">
                <Info size={16} className="text-brand-lime shrink-0" />
                <span>Select a slot from the layout map grid to override details or toggle status.</span>
              </div>
            )}
          </div>
        </aside>

      </div>

    </div>
  );
};
