import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbAdapter';
import { ParkingLocation, SlotType } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  Building, MapPin, Clock, Key, Shield, Zap, Plus, 
  ArrowLeft, ArrowRight, Eye, CheckCircle2, AlertTriangle, Compass, Image, Info, Navigation 
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

const MapEventsHandler = ({ onChange }: { onChange: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const ChangeOwnerMapView: React.FC<{ coords: [number, number] }> = ({ coords }) => {
  const map = useMap();
  React.useEffect(() => {
    map.setView(coords, 14);
  }, [coords, map]);
  return null;
};

export const OwnerParking: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [locations, setLocations] = useState<ParkingLocation[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Wizard States
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);

  // Wizard fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(12.97);
  const [longitude, setLongitude] = useState(77.59);
  const [ownerMapCenter, setOwnerMapCenter] = useState<[number, number]>([12.97, 77.59]);
  const [openingTime, setOpeningTime] = useState('09:00');
  const [closingTime, setClosingTime] = useState('18:00');

  // Custom 12-hour picker states
  const [openHour, setOpenHour] = useState('09');
  const [openMinute, setOpenMinute] = useState('00');
  const [openPeriod, setOpenPeriod] = useState('AM');
  const [closeHour, setCloseHour] = useState('06');
  const [closeMinute, setCloseMinute] = useState('00');
  const [closePeriod, setClosePeriod] = useState('PM');
  
  // Amenities toggles
  const [evCharger, setEvCharger] = useState(false);
  const [cctv, setCctv] = useState(true);
  const [covered, setCovered] = useState(false);
  const [access247, setAccess247] = useState(true);
  const [wheelchair, setWheelchair] = useState(false);

  // Pricing & slots count (default count to 1)
  const [slotPrefix, setSlotPrefix] = useState('A');
  const [floorCount, setFloorCount] = useState('Floor 1');
  const [slotCount, setSlotCount] = useState(1);
  const [basePrice, setBasePrice] = useState(30);

  // Custom slots config
  const [slotConfigs, setSlotConfigs] = useState<{ type: SlotType; price: number }[]>([
    { type: 'CAR', price: 30 }
  ]);

  const [isMapEnlarged, setIsMapEnlarged] = useState(false);

  // Editing state variables
  const [editingLocation, setEditingLocation] = useState<ParkingLocation | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editOpenHour, setEditOpenHour] = useState('09');
  const [editOpenMinute, setEditOpenMinute] = useState('00');
  const [editOpenPeriod, setEditOpenPeriod] = useState('AM');
  const [editCloseHour, setEditCloseHour] = useState('06');
  const [editCloseMinute, setEditCloseMinute] = useState('00');
  const [editClosePeriod, setEditClosePeriod] = useState('PM');
  const [editEV, setEditEV] = useState(false);
  const [editCCTV, setEditCCTV] = useState(false);
  const [editCovered, setEditCovered] = useState(false);
  const [edit247, setEdit247] = useState(false);
  const [editWheelchair, setEditWheelchair] = useState(false);

  const startEditing = (loc: ParkingLocation) => {
    setEditingLocation(loc);
    setEditName(loc.name);
    setEditDescription(loc.description);
    setEditAddress(loc.address);

    const parseTime = (timeStr: string) => {
      const [hr, min] = timeStr.split(':');
      let hour = Number(hr);
      let period = 'AM';
      if (hour >= 12) {
        period = 'PM';
        if (hour > 12) hour -= 12;
      }
      if (hour === 0) hour = 12;
      return {
        hour: hour.toString().padStart(2, '0'),
        minute: min,
        period
      };
    };

    const openParsed = parseTime(loc.opening_hours.open);
    setEditOpenHour(openParsed.hour);
    setEditOpenMinute(openParsed.minute);
    setEditOpenPeriod(openParsed.period);

    const closeParsed = parseTime(loc.opening_hours.close);
    setEditCloseHour(closeParsed.hour);
    setEditCloseMinute(closeParsed.minute);
    setEditClosePeriod(closeParsed.period);

    setEditEV(loc.amenities.includes('EV_CHARGER'));
    setEditCCTV(loc.amenities.includes('CCTV'));
    setEditCovered(loc.amenities.includes('COVERED'));
    setEdit247(loc.amenities.includes('24_7'));
    setEditWheelchair(loc.amenities.includes('ACCESSIBLE'));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLocation) return;

    try {
      const convertTo24Hour = (h: string, m: string, p: string) => {
        let hour = Number(h);
        if (p === 'PM' && hour < 12) hour += 12;
        if (p === 'AM' && hour === 12) hour = 0;
        return `${hour.toString().padStart(2, '0')}:${m}`;
      };

      const finalOpen = convertTo24Hour(editOpenHour, editOpenMinute, editOpenPeriod);
      const finalClose = convertTo24Hour(editCloseHour, editCloseMinute, editClosePeriod);

      const amenitiesList: string[] = [];
      if (editEV) amenitiesList.push('EV_CHARGER');
      if (editCCTV) amenitiesList.push('CCTV');
      if (editCovered) amenitiesList.push('COVERED');
      if (edit247) amenitiesList.push('24_7');
      if (editWheelchair) amenitiesList.push('ACCESSIBLE');

      await dbService.updateParkingLocation(editingLocation.id, {
        name: editName,
        description: editDescription,
        address: editAddress,
        opening_hours: { open: finalOpen, close: finalClose },
        amenities: amenitiesList
      });

      showToast('Parking location updated successfully!', 'success');
      setEditingLocation(null);
      loadLocations();
    } catch (err: any) {
      showToast(err.message || 'Failed to update parking location.', 'error');
    }
  };

  const handleDeleteLocation = async (id: string) => {
    const doubleCheck = window.confirm("Are you sure you want to delete this parking space? All associated slots and active listings will be removed.");
    if (!doubleCheck) return;

    try {
      await dbService.deleteParkingLocation(id);
      showToast('Parking location removed successfully.', 'success');
      loadLocations();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete location.', 'error');
    }
  };

  const loadLocations = async () => {
    if (user) {
      try {
        setLoading(true);
        const data = await dbService.getParkingLocations('OWNER', user.id);
        setLocations(data);
      } catch (err: any) {
        showToast('Error loading properties.', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadLocations();
    
    const handleUpdate = () => loadLocations();
    window.addEventListener('parking_status_changed', handleUpdate);
    
    return () => {
      window.removeEventListener('parking_status_changed', handleUpdate);
    };
  }, [user]);

  // Auto-fetch location when Step 2 becomes active
  useEffect(() => {
    if (wizardStep === 2) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = Number(position.coords.latitude.toFixed(6));
            const lng = Number(position.coords.longitude.toFixed(6));
            setLatitude(lat);
            setLongitude(lng);
            setOwnerMapCenter([lat, lng]);
            setAddress("Current Location GPS Coordinates");
            showToast('Automatically detected location from browser GPS.', 'success');
          },
          (error) => {
            console.warn('[Parkly GPS] Auto-fetch coordinates failed:', error.message);
          }
        );
      }
    }
  }, [wizardStep]);

  const handleNextStep = () => {
    if (wizardStep === 1 && (!name || !description)) {
      showToast('Please specify name and description.', 'warning');
      return;
    }
    if (wizardStep === 2 && !address) {
      showToast('Address is required.', 'warning');
      return;
    }
    setWizardStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setWizardStep(prev => prev - 1);
  };

  const handleWizardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const amenitiesList: string[] = [];
      if (evCharger) amenitiesList.push('EV_CHARGER');
      if (cctv) amenitiesList.push('CCTV');
      if (covered) amenitiesList.push('COVERED');
      if (access247) amenitiesList.push('24_7');
      if (wheelchair) amenitiesList.push('ACCESSIBLE');

      // Helper to compile 12-hour selections into standard 24-hour database formats
      const convertTo24Hour = (h: string, m: string, p: string) => {
        let hour = Number(h);
        if (p === 'PM' && hour < 12) hour += 12;
        if (p === 'AM' && hour === 12) hour = 0;
        return `${hour.toString().padStart(2, '0')}:${m}`;
      };

      const finalOpen = convertTo24Hour(openHour, openMinute, openPeriod);
      const finalClose = convertTo24Hour(closeHour, closeMinute, closePeriod);

      // Submit location data with custom slots
      const newLoc = await dbService.addParkingLocation({
        owner_id: user.id,
        name,
        address,
        latitude: Number(latitude),
        longitude: Number(longitude),
        description,
        opening_hours: { open: finalOpen, close: finalClose },
        amenities: amenitiesList
      }, slotConfigs);

      showToast('Parking location listing submitted for admin review!', 'success');
      
      // Reset wizard
      setName('');
      setDescription('');
      setAddress('');
      setShowWizard(false);
      setWizardStep(1);
      
      loadLocations();
    } catch (err: any) {
      showToast(err.message || 'Failed to submit property.', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">My Parking Locations</h1>
          <p className="text-xs text-brand-text-muted mt-1 font-sans">Manage your spaces details, view validation states</p>
        </div>
        
        {!showWizard && (
          <button
            onClick={() => setShowWizard(true)}
            className="bg-brand-lime hover:bg-brand-lime-hover text-black px-4 py-2.5 rounded-lg text-xs font-bold transition-all shadow-[0_0_10px_rgba(132,204,22,0.15)] flex items-center space-x-1"
          >
            <Plus size={14} />
            <span>List Space</span>
          </button>
        )}
      </div>

      {/* ==========================================
          ADD PARKING SPOT MULTI-STEP WIZARD
         ========================================== */}
      {showWizard && (
        <div className="bg-brand-surface border border-brand-surface-hover rounded-2xl p-6 space-y-6 shadow-2xl relative animate-slide-up">
          <div className="flex justify-between items-center border-b border-brand-surface-hover pb-3">
            <div className="flex items-center space-x-2">
              <Compass className="text-brand-lime" size={18} />
              <span className="text-sm font-bold">List Parking Location Wizard</span>
            </div>
            <span className="text-[10px] font-mono text-brand-text-muted">Step {wizardStep} of 4</span>
          </div>

          {/* Progress bar */}
          <div className="h-1 w-full bg-brand-charcoal rounded-full overflow-hidden">
            <div 
              className="h-full bg-brand-lime transition-all duration-350"
              style={{ width: `${(wizardStep / 4) * 100}%` }}
            ></div>
          </div>

          <div className="space-y-6">
            
            {/* Step 1: Basic Info */}
            {wizardStep === 1 && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-brand-text-muted uppercase">Property Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Connaught Place Office Lot"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-[#0F0F10] border border-brand-surface-hover focus:border-brand-lime rounded-lg px-3 py-2 text-xs outline-none transition-all"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-brand-text-muted uppercase">Description</label>
                  <textarea
                    placeholder="Describe entrance instructions, height restrictions, security details..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={4}
                    className="w-full bg-[#0F0F10] border border-brand-surface-hover focus:border-brand-lime rounded-lg p-3 text-xs outline-none transition-all resize-none"
                    required
                  ></textarea>
                </div>
              </div>
            )}

            {/* Step 2: Location Map Coordinates */}
            {wizardStep === 2 && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-brand-text-muted uppercase">Physical Address</label>
                  <input
                    type="text"
                    placeholder="Block D, Connaught Place, New Delhi..."
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className="w-full bg-[#0F0F10] border border-brand-surface-hover focus:border-brand-lime rounded-lg px-3 py-2 text-xs outline-none transition-all"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-brand-text-muted uppercase">Latitude</label>
                    <input
                      type="number" step="any"
                      value={latitude}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setLatitude(val);
                        setOwnerMapCenter([val, longitude]);
                      }}
                      className="w-full bg-[#0F0F10] border border-brand-surface-hover focus:border-brand-lime rounded-lg px-3 py-2 text-xs outline-none font-mono"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-brand-text-muted uppercase">Longitude</label>
                    <input
                      type="number" step="any"
                      value={longitude}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setLongitude(val);
                        setOwnerMapCenter([latitude, val]);
                      }}
                      className="w-full bg-[#0F0F10] border border-brand-surface-hover focus:border-brand-lime rounded-lg px-3 py-2 text-xs outline-none font-mono"
                      required
                    />
                  </div>
                </div>

                {/* Swiggy Style Geolocation Trigger */}
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(
                        (position) => {
                          const lat = Number(position.coords.latitude.toFixed(6));
                          const lng = Number(position.coords.longitude.toFixed(6));
                          setLatitude(lat);
                          setLongitude(lng);
                          setOwnerMapCenter([lat, lng]);
                          setAddress("Current Location GPS Coordinates");
                          showToast('Detected coordinates from browser GPS.', 'success');
                        },
                        (error) => {
                          showToast('Failed to acquire GPS coords. Click on the map to place a pin.', 'warning');
                        }
                      );
                    }
                  }}
                  className="w-full bg-[#0F0F10] hover:bg-brand-lime/10 border border-brand-surface-hover hover:border-brand-lime text-brand-lime py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5"
                >
                  <Navigation size={13} />
                  <span>Detect My Location (Swiggy Style)</span>
                </button>

                {/* Leaflet Picker Map */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center pb-0.5">
                    <label className="text-[10px] font-mono text-brand-text-muted uppercase block">Interactive Pin Picker</label>
                    <button
                      type="button"
                      onClick={() => setIsMapEnlarged(!isMapEnlarged)}
                      className="text-[9px] font-mono text-brand-lime border border-brand-lime/20 hover:border-brand-lime bg-[#0F0F10] px-2 py-0.5 rounded transition-all font-bold"
                    >
                      {isMapEnlarged ? 'Shrink Map' : 'Enlarge Map'}
                    </button>
                  </div>
                  <div className={`border border-brand-surface-hover rounded-xl overflow-hidden relative z-0 transition-all duration-300 ${isMapEnlarged ? 'h-96' : 'h-44'}`}>
                    <MapContainer
                      center={ownerMapCenter}
                      zoom={14}
                      className="w-full h-full"
                    >
                      <ChangeOwnerMapView coords={ownerMapCenter} />
                      <TileLayer
                        attribution='&copy; Google Maps'
                        url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                      />
                      <Marker
                        position={[latitude, longitude]}
                        icon={new L.DivIcon({
                          html: `<div class="relative flex h-6 w-6 items-center justify-center rounded-full bg-brand-charcoal border-2 border-brand-lime shadow-lg">
                                   <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-lime opacity-75"></span>
                                   <span class="relative inline-flex rounded-full h-3 w-3 bg-brand-lime"></span>
                                 </div>`,
                          className: 'custom-div-icon',
                          iconSize: [24, 24],
                          iconAnchor: [12, 12]
                        })}
                      />
                      <MapEventsHandler onChange={(lat, lng) => {
                        const fixedLat = Number(lat.toFixed(6));
                        const fixedLng = Number(lng.toFixed(6));
                        setLatitude(fixedLat);
                        setLongitude(fixedLng);
                        setOwnerMapCenter([fixedLat, fixedLng]);
                      }} />
                    </MapContainer>
                  </div>
                  <span className="text-[9px] text-brand-text-muted font-mono leading-relaxed block mt-1">
                    Click anywhere on the map grid to set the location pin details.
                  </span>
                </div>

                <div className="bg-[#0F0F10] p-3 rounded-lg border border-brand-surface-hover text-[10px] leading-relaxed text-brand-text-muted flex items-center space-x-2">
                  <Info size={14} className="text-brand-lime shrink-0" />
                  <span>These decimal coordinates pinpoint your markers correctly on Leaflet Map layers.</span>
                </div>
              </div>
            )}

            {/* Step 3: Layout configuration & amenities */}
            {wizardStep === 3 && (
              <div className="space-y-4 animate-fade-in">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono text-brand-text-muted uppercase">Opening Time</label>
                    <div className="flex space-x-1">
                      {/* Hour */}
                      <select
                        value={openHour}
                        onChange={e => setOpenHour(e.target.value)}
                        className="bg-[#0F0F10] border border-brand-surface-hover focus:border-brand-lime text-xs text-white rounded-lg p-2 outline-none flex-1 font-mono"
                      >
                        {Array.from({ length: 12 }).map((_, i) => {
                          const h = (i + 1).toString().padStart(2, '0');
                          return <option key={h} value={h}>{h}</option>;
                        })}
                      </select>
                      {/* Minute */}
                      <select
                        value={openMinute}
                        onChange={e => setOpenMinute(e.target.value)}
                        className="bg-[#0F0F10] border border-brand-surface-hover focus:border-brand-lime text-xs text-white rounded-lg p-2 outline-none flex-1 font-mono"
                      >
                        {['00', '15', '30', '45'].map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      {/* Period */}
                      <select
                        value={openPeriod}
                        onChange={e => setOpenPeriod(e.target.value)}
                        className="bg-[#0F0F10] border border-brand-surface-hover focus:border-brand-lime text-xs text-white rounded-lg p-2 outline-none w-14 font-mono font-bold"
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono text-brand-text-muted uppercase">Closing Time</label>
                    <div className="flex space-x-1">
                      {/* Hour */}
                      <select
                        value={closeHour}
                        onChange={e => setCloseHour(e.target.value)}
                        className="bg-[#0F0F10] border border-brand-surface-hover focus:border-brand-lime text-xs text-white rounded-lg p-2 outline-none flex-1 font-mono"
                      >
                        {Array.from({ length: 12 }).map((_, i) => {
                          const h = (i + 1).toString().padStart(2, '0');
                          return <option key={h} value={h}>{h}</option>;
                        })}
                      </select>
                      {/* Minute */}
                      <select
                        value={closeMinute}
                        onChange={e => setCloseMinute(e.target.value)}
                        className="bg-[#0F0F10] border border-brand-surface-hover focus:border-brand-lime text-xs text-white rounded-lg p-2 outline-none flex-1 font-mono"
                      >
                        {['00', '15', '30', '45'].map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      {/* Period */}
                      <select
                        value={closePeriod}
                        onChange={e => setClosePeriod(e.target.value)}
                        className="bg-[#0F0F10] border border-brand-surface-hover focus:border-brand-lime text-xs text-white rounded-lg p-2 outline-none w-14 font-mono font-bold"
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Amenities checkboxes */}
                <div className="space-y-2 pt-2">
                  <label className="text-[9px] font-mono text-brand-text-muted uppercase block">Select Amenities Available</label>
                  <div className="grid grid-cols-2 gap-2 text-xs text-brand-text-muted bg-brand-charcoal p-3 rounded-xl border border-brand-surface-hover">
                    <label className="flex items-center space-x-2 select-none">
                      <input type="checkbox" checked={evCharger} onChange={e => setEvCharger(e.target.checked)} className="rounded text-brand-lime accent-brand-lime" />
                      <span>EV Charging points</span>
                    </label>
                    <label className="flex items-center space-x-2 select-none">
                      <input type="checkbox" checked={cctv} onChange={e => setCctv(e.target.checked)} className="rounded text-brand-lime accent-brand-lime" />
                      <span>CCTV 24h surveillance</span>
                    </label>
                    <label className="flex items-center space-x-2 select-none">
                      <input type="checkbox" checked={covered} onChange={e => setCovered(e.target.checked)} className="rounded text-brand-lime accent-brand-lime" />
                      <span>Covered structure roof</span>
                    </label>
                    <label className="flex items-center space-x-2 select-none">
                      <input type="checkbox" checked={access247} onChange={e => setAccess247(e.target.checked)} className="rounded text-brand-lime accent-brand-lime" />
                      <span>24/7 Gate entry</span>
                    </label>
                    <label className="flex items-center space-x-2 select-none">
                      <input type="checkbox" checked={wheelchair} onChange={e => setWheelchair(e.target.checked)} className="rounded text-brand-lime accent-brand-lime" />
                      <span>Accessible Parking bays</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Configure Slots */}
            {wizardStep === 4 && (
              <div className="space-y-4 animate-fade-in text-xs">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-brand-text-muted uppercase">How many parking slots do you want to rent?</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={slotCount}
                    onChange={e => {
                      const val = Math.max(1, Math.min(20, Number(e.target.value)));
                      setSlotCount(val);
                      setSlotConfigs(prev => {
                        const next = [...prev];
                        if (next.length < val) {
                          while (next.length < val) {
                            next.push({ type: 'CAR', price: 30 });
                          }
                        } else if (next.length > val) {
                          next.splice(val);
                        }
                        return next;
                      });
                    }}
                    className="w-24 bg-[#0F0F10] border border-brand-surface-hover focus:border-brand-lime rounded-lg px-3 py-2 text-xs outline-none font-mono font-bold text-white text-center"
                    required
                  />
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-[10px] font-mono text-brand-text-muted uppercase block">Configure Slots Details</label>
                  <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                    {slotConfigs.map((config, index) => {
                      const name = `A0${index + 1}`;
                      return (
                        <div key={index} className="flex items-center space-x-3 bg-brand-charcoal p-3 rounded-xl border border-brand-surface-hover">
                          <span className="font-mono font-bold text-brand-lime text-xs w-8">{name}</span>
                          
                          {/* Slot vehicle type selector */}
                          <div className="flex-1 space-y-1">
                            <label className="text-[8px] font-mono text-brand-text-muted uppercase block">Vehicle Type</label>
                            <select
                              value={config.type}
                              onChange={e => {
                                const next = [...slotConfigs];
                                next[index].type = e.target.value as SlotType;
                                setSlotConfigs(next);
                              }}
                              className="w-full bg-[#0F0F10] border border-brand-surface-hover focus:border-brand-lime text-[11px] text-white rounded p-1.5 outline-none font-sans"
                            >
                              <option value="CAR">Car</option>
                              <option value="BIKE">Two Wheeler / Bike</option>
                              <option value="EV">EV Charging Bay</option>
                              <option value="SUV">SUV / Large Vehicle</option>
                              <option value="ACCESSIBLE">Accessible Bay</option>
                            </select>
                          </div>

                          {/* Slot Price input */}
                          <div className="w-24 space-y-1">
                            <label className="text-[8px] font-mono text-brand-text-muted uppercase block">Price/hr (₹)</label>
                            <input
                              type="number"
                              min="10"
                              max="300"
                              value={config.price}
                              onChange={e => {
                                const next = [...slotConfigs];
                                next[index].price = Math.max(1, Number(e.target.value));
                                setSlotConfigs(next);
                              }}
                              className="w-full bg-[#0F0F10] border border-brand-surface-hover focus:border-brand-lime text-[11px] text-white rounded p-1.5 outline-none text-center font-mono font-bold"
                              required
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-brand-lime/5 border border-brand-lime/20 p-4 rounded-xl flex items-start space-x-3 text-[10px] leading-relaxed text-brand-text-muted">
                  <CheckCircle2 size={16} className="text-brand-lime shrink-0" />
                  <span>Your custom slots configurations will be created and named automatically (e.g. A01, A02) inside the database. Clicking submit submits your listing.</span>
                </div>
              </div>
            )}

            {/* Wizard actions buttons */}
            <div className="flex justify-between items-center border-t border-brand-surface-hover pt-4">
              {wizardStep > 1 ? (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="bg-brand-charcoal hover:bg-brand-surface-hover border border-brand-surface-hover text-white text-xs px-4 py-2 rounded-lg font-semibold transition-all flex items-center space-x-1"
                >
                  <ArrowLeft size={13} />
                  <span>Back</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowWizard(false)}
                  className="text-xs text-brand-text-muted hover:text-white"
                >
                  Cancel
                </button>
              )}

              {wizardStep < 4 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="bg-brand-lime hover:bg-brand-lime-hover text-black text-xs px-4 py-2 rounded-lg font-bold transition-all shadow-[0_0_10px_rgba(132,204,22,0.15)] flex items-center space-x-1"
                >
                  <span>Next</span>
                  <ArrowRight size={13} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleWizardSubmit}
                  className="bg-brand-lime hover:bg-brand-lime-hover text-black text-xs px-6 py-2.5 rounded-lg font-bold transition-all shadow-[0_0_15px_rgba(132,204,22,0.15)] flex items-center space-x-1"
                >
                  <span>Submit Listing</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ==========================================
          OWNED PROPERTIES LISTING
         ========================================== */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 2 }).map((_, idx) => (
            <div key={idx} className="border border-brand-surface-hover rounded-xl p-6 skeleton-shimmer h-32"></div>
          ))
        ) : locations.length === 0 ? (
          <div className="bg-brand-surface border border-brand-surface-hover rounded-2xl p-12 text-center max-w-lg mx-auto space-y-4">
            <Building className="mx-auto text-brand-surface-hover" size={40} />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">No locations registered.</h3>
            <p className="text-xs text-brand-text-muted max-w-xs mx-auto leading-relaxed">
              List your driveways, garages or apartment spaces to start generating revenue.
            </p>
          </div>
        ) : (
          locations.map(loc => {
            let badge = 'bg-brand-lime/10 border-brand-lime/30 text-brand-lime';
            if (loc.status === 'PENDING_REVIEW') badge = 'bg-warning/10 border-warning/30 text-warning animate-pulse';
            if (loc.status === 'REJECTED') badge = 'bg-error/10 border-error/30 text-error';

            return (
              <div
                key={loc.id}
                className="bg-brand-surface border border-brand-surface-hover rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-brand-lime/10 transition-all"
              >
                <div className="space-y-2 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className={`text-[8px] font-mono border px-2 py-0.5 rounded font-bold uppercase tracking-wider ${badge}`}>
                      {loc.status}
                    </span>
                    <span className="text-[10px] text-brand-text-muted font-mono">ID: {loc.id.split('-')[1]}</span>
                  </div>
                  <h4 className="text-base font-bold text-white truncate">{loc.name}</h4>
                  
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-brand-text-muted font-mono pt-1">
                    <span className="flex items-center space-x-1">
                      <MapPin size={13} className="text-brand-lime" />
                      <span>{loc.address.split(',').slice(0, 2).join(',')}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Clock size={13} className="text-brand-lime" />
                      <span>{loc.opening_hours.open} - {loc.opening_hours.close}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-4 shrink-0">
                  <div className="flex space-x-1.5 text-[9px] text-brand-text-muted">
                    {loc.amenities.map(am => (
                      <span key={am} className="bg-brand-charcoal border border-brand-surface-hover px-1.5 py-0.5 rounded uppercase font-mono">
                        {am.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => startEditing(loc)}
                      className="bg-brand-charcoal hover:bg-brand-lime hover:text-black border border-brand-surface-hover text-white px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteLocation(loc.id)}
                      className="bg-brand-charcoal hover:bg-error hover:text-white border border-brand-surface-hover text-brand-text-muted hover:border-error/40 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ==========================================
          EDIT LISTING MODAL OVERLAY
         ========================================== */}
      {editingLocation && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-brand-surface border border-brand-surface-hover rounded-2xl p-6 w-full max-w-lg space-y-6 shadow-2xl animate-scale-in my-8">
            <div className="flex justify-between items-center border-b border-brand-surface-hover pb-3">
              <span className="text-sm font-bold flex items-center space-x-2">
                <Compass className="text-brand-lime" size={18} />
                <span>Edit Parking Space: {editingLocation.name}</span>
              </span>
              <button type="button" onClick={() => setEditingLocation(null)} className="text-brand-text-muted hover:text-white text-xs font-mono font-bold">CLOSE</button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-brand-text-muted uppercase">Property Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full bg-[#0F0F10] border border-brand-surface-hover focus:border-brand-lime rounded-lg px-3 py-2 text-xs outline-none text-white transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-brand-text-muted uppercase">Description</label>
                <textarea
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-[#0F0F10] border border-brand-surface-hover focus:border-brand-lime rounded-lg p-3 text-xs outline-none text-white transition-all resize-none"
                  required
                ></textarea>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-brand-text-muted uppercase">Physical Address</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={e => setEditAddress(e.target.value)}
                  className="w-full bg-[#0F0F10] border border-brand-surface-hover focus:border-brand-lime rounded-lg px-3 py-2 text-xs outline-none text-white transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-brand-text-muted uppercase">Opening Time</label>
                  <div className="flex space-x-1">
                    <select
                      value={editOpenHour}
                      onChange={e => setEditOpenHour(e.target.value)}
                      className="bg-[#0F0F10] border border-brand-surface-hover focus:border-brand-lime text-xs text-white rounded-lg p-2 outline-none flex-1 font-mono"
                    >
                      {Array.from({ length: 12 }).map((_, i) => {
                        const h = (i + 1).toString().padStart(2, '0');
                        return <option key={h} value={h}>{h}</option>;
                      })}
                    </select>
                    <select
                      value={editOpenMinute}
                      onChange={e => setEditOpenMinute(e.target.value)}
                      className="bg-[#0F0F10] border border-brand-surface-hover focus:border-brand-lime text-xs text-white rounded-lg p-2 outline-none flex-1 font-mono"
                    >
                      {['00', '15', '30', '45'].map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    <select
                      value={editOpenPeriod}
                      onChange={e => setEditOpenPeriod(e.target.value)}
                      className="bg-[#0F0F10] border border-brand-surface-hover focus:border-brand-lime text-xs text-white rounded-lg p-2 outline-none w-14 font-mono font-bold"
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-brand-text-muted uppercase">Closing Time</label>
                  <div className="flex space-x-1">
                    <select
                      value={editCloseHour}
                      onChange={e => setEditCloseHour(e.target.value)}
                      className="bg-[#0F0F10] border border-brand-surface-hover focus:border-brand-lime text-xs text-white rounded-lg p-2 outline-none flex-1 font-mono"
                    >
                      {Array.from({ length: 12 }).map((_, i) => {
                        const h = (i + 1).toString().padStart(2, '0');
                        return <option key={h} value={h}>{h}</option>;
                      })}
                    </select>
                    <select
                      value={editCloseMinute}
                      onChange={e => setEditCloseMinute(e.target.value)}
                      className="bg-[#0F0F10] border border-brand-surface-hover focus:border-brand-lime text-xs text-white rounded-lg p-2 outline-none flex-1 font-mono"
                    >
                      {['00', '15', '30', '45'].map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    <select
                      value={editClosePeriod}
                      onChange={e => setEditClosePeriod(e.target.value)}
                      className="bg-[#0F0F10] border border-brand-surface-hover focus:border-brand-lime text-xs text-white rounded-lg p-2 outline-none w-14 font-mono font-bold"
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-[9px] font-mono text-brand-text-muted uppercase block">Select Amenities Available</label>
                <div className="grid grid-cols-2 gap-2 text-xs text-brand-text-muted bg-brand-charcoal p-3 rounded-xl border border-brand-surface-hover">
                  <label className="flex items-center space-x-2 select-none">
                    <input type="checkbox" checked={editEV} onChange={e => setEditEV(e.target.checked)} className="rounded text-brand-lime accent-brand-lime" />
                    <span>EV Charging points</span>
                  </label>
                  <label className="flex items-center space-x-2 select-none">
                    <input type="checkbox" checked={editCCTV} onChange={e => setEditCCTV(e.target.checked)} className="rounded text-brand-lime accent-brand-lime" />
                    <span>CCTV 24h surveillance</span>
                  </label>
                  <label className="flex items-center space-x-2 select-none">
                    <input type="checkbox" checked={editCovered} onChange={e => setEditCovered(e.target.checked)} className="rounded text-brand-lime accent-brand-lime" />
                    <span>Covered structure roof</span>
                  </label>
                  <label className="flex items-center space-x-2 select-none">
                    <input type="checkbox" checked={edit247} onChange={e => setEdit247(e.target.checked)} className="rounded text-brand-lime accent-brand-lime" />
                    <span>24/7 Gate entry</span>
                  </label>
                  <label className="flex items-center space-x-2 select-none">
                    <input type="checkbox" checked={editWheelchair} onChange={e => setEditWheelchair(e.target.checked)} className="rounded text-brand-lime accent-brand-lime" />
                    <span>Accessible Parking bays</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-brand-surface-hover">
                <button
                  type="button"
                  onClick={() => setEditingLocation(null)}
                  className="bg-brand-charcoal hover:bg-brand-surface-hover border border-brand-surface-hover text-white text-xs px-4 py-2 rounded-lg font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-brand-lime hover:bg-brand-lime-hover text-black text-xs px-5 py-2 rounded-lg font-bold transition-all shadow-[0_0_15px_rgba(132,204,22,0.15)]"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
