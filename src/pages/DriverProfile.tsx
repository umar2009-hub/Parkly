import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbAdapter';
import { Vehicle, VehicleType, RfidCredential } from '../types';
import { useToast } from '../context/ToastContext';
import { 
  User, Phone, Mail, Car, Trash2, Plus, 
  CheckCircle, PlusCircle, AlertCircle, Info, Sparkles, Radio, Link, ShieldCheck
} from 'lucide-react';

export const DriverProfile: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const { showToast } = useToast();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [rfidCreds, setRfidCreds] = useState<RfidCredential[]>([]);
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Add Vehicle Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [brandModel, setBrandModel] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [vehType, setVehType] = useState<VehicleType>('CAR');
  const [color, setColor] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [addingVehicle, setAddingVehicle] = useState(false);

  // RFID Link State
  const [linkingVehicleId, setLinkingVehicleId] = useState<string | null>(null);
  const [rfidTagInput, setRfidTagInput] = useState('');

  const loadProfileData = async () => {
    if (user) {
      setProfileName(user.full_name);
      setProfilePhone(user.phone);
      
      try {
        const list = await dbService.getVehicles(user.id);
        setVehicles(list);

        const tags = await dbService.getRfidCredentials(user.id);
        setRfidCreds(tags);
      } catch (err: any) {
        showToast('Error loading profile credentials.', 'error');
      }
    }
  };

  useEffect(() => {
    loadProfileData();
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!profileName || !profilePhone) {
      showToast('Name and phone cannot be empty.', 'warning');
      return;
    }

    try {
      setSavingProfile(true);
      await dbService.updateProfile(user.id, {
        full_name: profileName,
        phone: profilePhone
      });
      showToast('Profile updated successfully!', 'success');
      refreshProfile();
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!brandModel || !regNumber || !color) {
      showToast('Please fill in all vehicle parameters.', 'warning');
      return;
    }

    // Reg Code check regex (e.g. KA-03-MJ-5432 or simple alphanumeric with dashes)
    const cleanReg = regNumber.toUpperCase().trim();

    try {
      setAddingVehicle(true);
      await dbService.addVehicle({
        user_id: user.id,
        type: vehType,
        brand_model: brandModel,
        registration_number: cleanReg,
        color,
        is_default: vehicles.length === 0 ? true : isDefault
      });

      showToast('Vehicle added successfully!', 'success');
      
      // Reset form
      setBrandModel('');
      setRegNumber('');
      setColor('');
      setIsDefault(false);
      setShowAddForm(false);
      
      loadProfileData();
    } catch (err: any) {
      showToast('Failed to register vehicle.', 'error');
    } finally {
      setAddingVehicle(false);
    }
  };

  const handleSetDefault = async (vehId: string) => {
    try {
      await dbService.updateVehicle(vehId, { is_default: true });
      showToast('Default vehicle updated.', 'success');
      loadProfileData();
    } catch (err: any) {
      showToast('Failed to update default vehicle.', 'error');
    }
  };

  const handleDeleteVehicle = async (vehId: string) => {
    const confirm = window.confirm('Are you sure you want to remove this vehicle registration code?');
    if (!confirm) return;

    try {
      await dbService.deleteVehicle(vehId);
      showToast('Vehicle removed successfully.', 'info');
      loadProfileData();
    } catch (err: any) {
      showToast('Failed to delete vehicle.', 'error');
    }
  };

  const handleLinkRfid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkingVehicleId || !rfidTagInput.trim()) return;
    try {
      await dbService.addRfidCredential({
        user_id: user!.id,
        vehicle_id: linkingVehicleId,
        rfid_uid: rfidTagInput.trim().toUpperCase()
      });
      showToast('RFID card linked successfully!', 'success');
      setLinkingVehicleId(null);
      setRfidTagInput('');
      loadProfileData();
    } catch (err: any) {
      showToast(err.message || 'Failed to link RFID card.', 'error');
    }
  };

  const handleDeleteRfid = async (id: string) => {
    try {
      await dbService.deleteRfidCredential(id);
      showToast('RFID card unlinked.', 'info');
      loadProfileData();
    } catch (err: any) {
      showToast('Failed to remove RFID credential.', 'error');
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      
      {/* Header title */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Profile & Vehicles</h1>
        <p className="text-xs text-brand-text-muted mt-1">Manage registration details, contact numbers and garage specifications</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Personal Details Form */}
        <form onSubmit={handleUpdateProfile} className="lg:col-span-5 bg-brand-surface border border-brand-surface-hover rounded-2xl p-6 space-y-5 shadow-xl">
          <h3 className="text-sm font-bold uppercase tracking-wider text-brand-lime flex items-center space-x-1.5 border-b border-brand-surface-hover pb-3">
            <User size={16} />
            <span>Personal Information</span>
          </h3>

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-brand-text-muted uppercase tracking-widest block">Email Account</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted/40" size={16} />
              <input
                type="email"
                value={user?.email}
                disabled
                className="w-full bg-[#0F0F10] border border-brand-surface-hover text-brand-text-muted/40 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none cursor-not-allowed font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-brand-text-muted uppercase tracking-widest block">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-lime" size={16} />
              <input
                type="text"
                value={profileName}
                onChange={e => setProfileName(e.target.value)}
                className="w-full bg-[#0F0F10] border border-brand-surface-hover focus:border-brand-lime rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-brand-text-muted uppercase tracking-widest block">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-lime" size={16} />
              <input
                type="tel"
                value={profilePhone}
                onChange={e => setProfilePhone(e.target.value)}
                className="w-full bg-[#0F0F10] border border-brand-surface-hover focus:border-brand-lime rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none transition-all font-mono"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={savingProfile}
            className="w-full bg-brand-surface hover:bg-brand-surface-hover border border-brand-surface-hover hover:border-brand-lime/20 text-white py-2.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center space-x-1"
          >
            {savingProfile ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <span>Update Profile</span>
            )}
          </button>
        </form>

        {/* Vehicles Garage Manager */}
        <div className="lg:col-span-7 bg-brand-surface border border-brand-surface-hover rounded-2xl p-6 space-y-6 shadow-xl">
          <div className="flex justify-between items-center border-b border-brand-surface-hover pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-brand-lime flex items-center space-x-1.5">
              <Car size={16} />
              <span>Vehicles Garage ({vehicles.length})</span>
            </h3>
            
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="text-xs text-brand-lime hover:underline flex items-center space-x-1 font-bold"
            >
              <Plus size={14} />
              <span>Add Vehicle</span>
            </button>
          </div>

          {/* Add Vehicle Sub-Form */}
          {showAddForm && (
            <form onSubmit={handleAddVehicleSubmit} className="bg-brand-charcoal/50 border border-brand-surface-hover rounded-xl p-4 space-y-4 animate-slide-up">
              <div className="flex justify-between items-center text-xs font-bold text-white border-b border-brand-surface-hover pb-1.5">
                <span className="flex items-center space-x-1 text-brand-lime">
                  <Sparkles size={13} />
                  <span>Register Vehicle Specifications</span>
                </span>
                <button type="button" onClick={() => setShowAddForm(false)} className="text-brand-text-muted hover:text-white">✕</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-mono text-brand-text-muted uppercase">Brand / Model</label>
                  <input
                    type="text"
                    placeholder="e.g. Tata Nexon EV"
                    value={brandModel}
                    onChange={e => setBrandModel(e.target.value)}
                    className="w-full bg-[#0F0F10] border border-brand-surface-hover focus:border-brand-lime rounded-lg px-3 py-2 text-xs outline-none transition-all"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-mono text-brand-text-muted uppercase">Registration Plate Code</label>
                  <input
                    type="text"
                    placeholder="e.g. KA-03-MJ-5432"
                    value={regNumber}
                    onChange={e => setRegNumber(e.target.value)}
                    className="w-full bg-[#0F0F10] border border-brand-surface-hover focus:border-brand-lime rounded-lg px-3 py-2 text-xs outline-none transition-all font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-mono text-brand-text-muted uppercase">Vehicle Type</label>
                  <select
                    value={vehType}
                    onChange={e => setVehType(e.target.value as VehicleType)}
                    className="w-full bg-[#0F0F10] border border-brand-surface-hover focus:border-brand-lime rounded-lg px-3 py-2 text-xs outline-none transition-all"
                  >
                    <option value="CAR">Car (Standard Hatch/Sedan)</option>
                    <option value="SUV">SUV / Large Vehicle</option>
                    <option value="BIKE">Two Wheeler (Bike/Scooter)</option>
                    <option value="EV">Electric Vehicle (EV)</option>
                    <option value="ACCESSIBLE">Differently Abled (Accessible)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-mono text-brand-text-muted uppercase">Color</label>
                  <input
                    type="text"
                    placeholder="e.g. Teal Blue"
                    value={color}
                    onChange={e => setColor(e.target.value)}
                    className="w-full bg-[#0F0F10] border border-brand-surface-hover focus:border-brand-lime rounded-lg px-3 py-2 text-xs outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="makeDefault"
                  checked={isDefault}
                  onChange={e => setIsDefault(e.target.checked)}
                  className="rounded bg-[#0F0F10] border-brand-surface-hover text-brand-lime focus:ring-brand-lime accent-brand-lime mr-2 h-4 w-4"
                />
                <label htmlFor="makeDefault" className="text-xs text-brand-text-muted select-none">Set as primary vehicle</label>
              </div>

              <button
                type="submit"
                disabled={addingVehicle}
                className="w-full bg-brand-lime hover:bg-brand-lime-hover text-black py-2 rounded-lg text-xs font-bold transition-all shadow-[0_0_10px_rgba(132,204,22,0.1)] flex items-center justify-center"
              >
                {addingVehicle ? 'Registering...' : 'Add Vehicle to Garage'}
              </button>
            </form>
          )}

          {/* Garage Vehicles List */}
          <div className="space-y-3">
            {vehicles.length === 0 ? (
              <div className="text-center py-10 bg-brand-charcoal/30 border border-brand-surface-hover rounded-xl text-brand-text-muted space-y-2">
                <Car size={32} className="mx-auto text-brand-surface-hover" />
                <p className="text-xs">No vehicles in garage. Reserve terminal requires one.</p>
              </div>
            ) : (
              vehicles.map(veh => (
                <div 
                  key={veh.id}
                  className="bg-brand-charcoal/50 border border-brand-surface-hover rounded-xl p-4 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="bg-brand-surface p-2.5 rounded-lg border border-brand-surface-hover text-brand-lime">
                      <Car size={20} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-white truncate">{veh.brand_model}</span>
                        {veh.is_default && (
                          <span className="text-[8px] bg-brand-lime/10 border border-brand-lime/25 text-brand-lime font-mono px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                            Primary
                          </span>
                        )}
                      </div>
                      <div className="flex space-x-2 mt-0.5 text-[10px] text-brand-text-muted font-mono">
                        <span>Plate: <b>{veh.registration_number}</b></span>
                        <span>•</span>
                        <span>Color: <b>{veh.color}</b></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    {!veh.is_default && (
                      <button
                        onClick={() => handleSetDefault(veh.id)}
                        className="border border-brand-surface hover:border-brand-lime/30 text-[9px] font-semibold text-brand-text-muted hover:text-white px-2 py-1 rounded transition-all"
                      >
                        Set Primary
                      </button>
                    )}
                    {/* RFID Link toggle */}
                    {!rfidCreds.find(r => r.vehicle_id === veh.id) ? (
                      <button
                        onClick={() => setLinkingVehicleId(veh.id)}
                        className="border border-brand-surface hover:border-brand-lime/30 text-[9px] font-semibold text-brand-text-muted hover:text-brand-lime px-2 py-1 rounded transition-all flex items-center space-x-1"
                        title="Link RFID card"
                      >
                        <Radio size={11} />
                        <span>RFID</span>
                      </button>
                    ) : (
                      <span className="text-[8px] bg-brand-lime/10 border border-brand-lime/20 text-brand-lime px-1.5 py-0.5 rounded font-mono font-bold flex items-center space-x-0.5">
                        <ShieldCheck size={9} />
                        <span>RFID</span>
                      </span>
                    )}
                    <button
                      onClick={() => handleDeleteVehicle(veh.id)}
                      className="text-brand-text-muted hover:text-error p-1.5 transition-colors"
                      title="Delete vehicle specs"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* RFID Tag Link Form */}
          {linkingVehicleId && (
            <form onSubmit={handleLinkRfid} className="bg-brand-charcoal/50 border border-brand-lime/20 rounded-xl p-4 space-y-3 animate-slide-up">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-brand-lime flex items-center space-x-1">
                  <Radio size={14} />
                  <span>Link RFID Card to Vehicle</span>
                </span>
                <button type="button" onClick={() => { setLinkingVehicleId(null); setRfidTagInput(''); }} className="text-brand-text-muted hover:text-white text-xs">✕</button>
              </div>
              <p className="text-[10px] text-brand-text-muted">Enter the RFID tag UID printed on your physical access card. This enables gate entry via card swipe at supported parking locations.</p>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="e.g. RFID-82931"
                  value={rfidTagInput}
                  onChange={e => setRfidTagInput(e.target.value)}
                  className="flex-1 bg-[#0F0F10] border border-brand-surface-hover focus:border-brand-lime rounded-lg px-3 py-2 text-xs outline-none font-mono transition-all"
                  required
                />
                <button type="submit" className="bg-brand-lime text-black px-4 rounded-lg text-xs font-bold">Link Card</button>
              </div>
            </form>
          )}

          {/* Registered RFID Tags */}
          {rfidCreds.length > 0 && (
            <div className="space-y-2 border-t border-brand-surface-hover pt-4">
              <span className="text-[9px] font-mono uppercase tracking-wider text-brand-lime block">Registered RFID Access Cards</span>
              {rfidCreds.map(cred => (
                <div key={cred.id} className="bg-[#0F0F10] border border-brand-surface-hover rounded-xl p-3 flex justify-between items-center text-[10px]">
                  <div className="space-y-0.5">
                    <span className="font-mono font-bold text-white">{cred.rfid_uid}</span>
                    <span className="block text-brand-text-muted">{cred.vehicle?.brand_model || 'Vehicle'} • {cred.vehicle?.registration_number}</span>
                  </div>
                  <button onClick={() => handleDeleteRfid(cred.id)} className="text-brand-text-muted hover:text-error p-1 transition-colors">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
