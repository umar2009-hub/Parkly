// Polyfills/Mocks for Server-Side / Node.js testing environments
const memoryStore: { [key: string]: string } = {};
if (typeof localStorage === 'undefined') {
  global.localStorage = {
    getItem: (key: string) => memoryStore[key] || null,
    setItem: (key: string, value: string) => { memoryStore[key] = value; },
    removeItem: (key: string) => { delete memoryStore[key]; },
    clear: () => { Object.keys(memoryStore).forEach(k => delete memoryStore[k]); },
    length: 0,
    key: (index: number) => null
  };
}
if (typeof window === 'undefined') {
  global.window = {
    dispatchEvent: () => true
  } as any;
}
if (typeof CustomEvent === 'undefined') {
  global.CustomEvent = class CustomEvent {
    constructor(type: string, dict?: any) {
      Object.assign(this, { type, ...dict });
    }
  } as any;
}

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  Profile, Vehicle, ParkingLocation, ParkingSlot, Booking, 
  Payment, Review, Favorite, Notification, Complaint, AuditLog, PricingRule,
  VehicleType, SlotType, SlotStatus, BookingStatus, UserRole, ParkingStatus,
  AccessLog, OverstayEvent, Invoice, Payout, RfidCredential
} from '../types';


// Detect Supabase keys
const getEnvVar = (key: string): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key] || '';
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || '';
  }
  return '';
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');


const isRealSupabase = supabaseUrl !== '' && supabaseAnonKey !== '';

export const supabase: SupabaseClient | null = isRealSupabase 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

console.log(`[Parkly DB Adapter] Active Mode: ${isRealSupabase ? 'SUPABASE CLOUD' : 'LOCAL EMULATION (LocalStorage)'}`);

// ==========================================
// LOCAL EMULATION DATABASE STORAGE KEYS
// ==========================================
const KEYS = {
  PROFILES: 'parkly_profiles',
  VEHICLES: 'parkly_vehicles',
  LOCATIONS: 'parkly_locations',
  SLOTS: 'parkly_slots',
  BOOKINGS: 'parkly_bookings',
  PAYMENTS: 'parkly_payments',
  REVIEWS: 'parkly_reviews',
  FAVORITES: 'parkly_favorites',
  NOTIFICATIONS: 'parkly_notifications',
  COMPLAINTS: 'parkly_complaints',
  AUDIT_LOGS: 'parkly_audit_logs',
  PRICING_RULES: 'parkly_pricing_rules',
  CURRENT_SESSION: 'parkly_session'
};

// Help helper for UUIDs
const uuid = () => Math.random().toString(36).substring(2, 9) + '-' + Math.random().toString(36).substring(2, 9);

// Default Seed Users (Password: password)
const SEED_PROFILES: Profile[] = [
  {
    id: 'user-driver-123',
    full_name: 'Rahul Sharma',
    email: 'driver@parkly.com',
    phone: '+91 98765 43210',
    role: 'DRIVER',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
    created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'user-owner-456',
    full_name: 'Ananya Patel',
    email: 'owner@parkly.com',
    phone: '+91 87654 32109',
    role: 'OWNER',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
    created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'user-admin-789',
    full_name: 'Vikram Singh (Admin)',
    email: 'admin@parkly.com',
    phone: '+91 76543 21098',
    role: 'ADMIN',
    avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&h=150&q=80',
    created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  }
];

// Seed Vehicles for driver
const SEED_VEHICLES: Vehicle[] = [];

// Seed Parking Locations (Indian Locations: Bangalore, Mumbai, Delhi)
const SEED_LOCATIONS: ParkingLocation[] = [
  {
    id: 'loc-1',
    owner_id: 'user-owner-456',
    name: 'Metro Plaza Parking',
    address: '12, MG Road, Ashok Nagar, Bengaluru, Karnataka 560001',
    latitude: 12.9756,
    longitude: 77.6067,
    description: 'Multi-level parking facility near MG Road metro station. Features 24/7 security, EV charging terminals, and dedicated spaces for differently-abled drivers.',
    opening_hours: { open: '00:00', close: '24:00' },
    amenities: ['CCTV', 'EV_CHARGER', 'COVERED', '24_7', 'WASHROOM', 'ACCESSIBLE'],
    status: 'APPROVED',
    created_at: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'loc-2',
    owner_id: 'user-owner-456',
    name: 'Central Mall Basement Parking',
    address: 'Linking Road, Santacruz West, Mumbai, Maharashtra 400054',
    latitude: 19.0825,
    longitude: 72.8369,
    description: 'Safe underground parking at Central Mall. Perfect for shoppers. Equipped with CCTV coverage and fully covered bays.',
    opening_hours: { open: '08:00', close: '23:30' },
    amenities: ['CCTV', 'COVERED', 'WASHROOM', 'ACCESSIBLE'],
    status: 'APPROVED',
    created_at: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'loc-3',
    owner_id: 'user-owner-456',
    name: 'Connaught Place Block-E Parking',
    address: 'E-Block, Radial Road 3, Connaught Place, New Delhi, Delhi 110001',
    latitude: 28.6304,
    longitude: 77.2177,
    description: 'Convenient open parking space in the heart of Connaught Place. Very close to shops, restaurants, and offices.',
    opening_hours: { open: '06:00', close: '23:00' },
    amenities: ['CCTV', 'ACCESSIBLE', '24_7'],
    status: 'APPROVED',
    created_at: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'loc-4',
    owner_id: 'user-owner-456',
    name: 'Cyber City Tech Park Parking',
    address: 'Tower B, DLF Cyber City, Phase 2, Gurugram, Haryana 122002',
    latitude: 28.4952,
    longitude: 77.0898,
    description: 'Ultra-modern corporate parking lot equipped with rapid EV charging stations, CCTV cameras, and digital check-in counters.',
    opening_hours: { open: '00:00', close: '24:00' },
    amenities: ['CCTV', 'EV_CHARGER', 'COVERED', '24_7', 'ACCESSIBLE'],
    status: 'APPROVED',
    created_at: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'loc-5',
    owner_id: 'user-owner-456',
    name: 'Railway Station North Gate Lot',
    address: 'Station Road, Pune Cantonment, Pune, Maharashtra 411001',
    latitude: 18.5289,
    longitude: 73.8744,
    description: 'Budget-friendly open-air parking directly adjacent to the Pune Railway Station North Gate. Ideal for commuters leaving vehicles overnight.',
    opening_hours: { open: '00:00', close: '24:00' },
    amenities: ['24_7', 'CCTV'],
    status: 'APPROVED',
    created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'loc-6',
    owner_id: 'user-owner-456',
    name: 'Downtown Smart Garages',
    address: '45, Park Street, Mullick Bazar, Kolkata, West Bengal 700016',
    latitude: 22.5488,
    longitude: 88.3582,
    description: 'Sub-surface smart automated garages on Park Street. Highly secure, clean facilities, featuring mechanical stackers and quick EV plug-ins.',
    opening_hours: { open: '06:00', close: '23:59' },
    amenities: ['CCTV', 'EV_CHARGER', 'COVERED', 'WASHROOM'],
    status: 'PENDING_REVIEW', // pending review for demoing admin approval features
    created_at: new Date().toISOString()
  }
];

// Seed Slots for the locations
// Let's create Floor 1 (A01-A10) and Floor 2 (B01-B10) for loc-1, and fewer slots for others.
const generateSlots = (): ParkingSlot[] => {
  const slots: ParkingSlot[] = [];
  
  // Location 1 (Metro Plaza Parking) - 20 slots
  for (let i = 1; i <= 10; i++) {
    const isEV = i === 3 || i === 7;
    const isAccessible = i === 1;
    const isBike = i > 8;
    
    slots.push({
      id: `slot-loc1-a${i}`,
      location_id: 'loc-1',
      slot_number: `A0${i}`,
      floor: 'Floor 1',
      type: isAccessible ? 'ACCESSIBLE' : (isEV ? 'EV' : (isBike ? 'BIKE' : 'CAR')),
      price_per_hour: isEV ? 50 : (isBike ? 20 : 40),
      status: 'AVAILABLE',
      created_at: new Date().toISOString()
    });
  }
  for (let i = 1; i <= 10; i++) {
    const isSUV = i > 7;
    slots.push({
      id: `slot-loc1-b${i}`,
      location_id: 'loc-1',
      slot_number: `B0${i}`,
      floor: 'Floor 2',
      type: isSUV ? 'SUV' : 'CAR',
      price_per_hour: isSUV ? 60 : 40,
      status: 'AVAILABLE',
      created_at: new Date().toISOString()
    });
  }

  // Location 2 (Central Mall) - 10 slots
  for (let i = 1; i <= 10; i++) {
    const isAccessible = i === 1;
    slots.push({
      id: `slot-loc2-a${i}`,
      location_id: 'loc-2',
      slot_number: `C${i}`,
      floor: 'Basement',
      type: isAccessible ? 'ACCESSIBLE' : 'CAR',
      price_per_hour: 30,
      status: 'AVAILABLE',
      created_at: new Date().toISOString()
    });
  }

  // Location 3 (Connaught Place) - 10 slots
  for (let i = 1; i <= 10; i++) {
    const isBike = i > 7;
    slots.push({
      id: `slot-loc3-a${i}`,
      location_id: 'loc-3',
      slot_number: `E-${i}`,
      floor: 'Ground',
      type: isBike ? 'BIKE' : 'CAR',
      price_per_hour: isBike ? 15 : 30,
      status: 'AVAILABLE',
      created_at: new Date().toISOString()
    });
  }

  // Location 4 (Cyber City) - 10 slots
  for (let i = 1; i <= 10; i++) {
    const isEV = i === 2 || i === 3;
    slots.push({
      id: `slot-loc4-a${i}`,
      location_id: 'loc-4',
      slot_number: `CC-${i}`,
      floor: 'P1',
      type: isEV ? 'EV' : 'CAR',
      price_per_hour: isEV ? 60 : 50,
      status: 'AVAILABLE',
      created_at: new Date().toISOString()
    });
  }

  // Location 5 (Railway Station) - 10 slots
  for (let i = 1; i <= 10; i++) {
    slots.push({
      id: `slot-loc5-a${i}`,
      location_id: 'loc-5',
      slot_number: `R-${i}`,
      floor: 'Ground',
      type: i > 6 ? 'BIKE' : 'CAR',
      price_per_hour: i > 6 ? 10 : 20,
      status: i % 2 === 0 ? 'OCCUPIED' : 'AVAILABLE',
      created_at: new Date().toISOString()
    });
  }

  // Location 6 (Downtown Smart Garages) - 5 slots
  for (let i = 1; i <= 5; i++) {
    slots.push({
      id: `slot-loc6-a${i}`,
      location_id: 'loc-6',
      slot_number: `DG-0${i}`,
      floor: 'Ground',
      type: i === 1 ? 'EV' : 'CAR',
      price_per_hour: i === 1 ? 55 : 45,
      status: 'AVAILABLE',
      created_at: new Date().toISOString()
    });
  }

  return slots;
};

// Seed Bookings (Active, Upcoming, Completed, Cancelled)
const SEED_BOOKINGS: Booking[] = [];

// Seed Payments
const SEED_PAYMENTS: Payment[] = [];

// Seed Reviews
const SEED_REVIEWS: Review[] = [];

// Seed Notifications
const SEED_NOTIFICATIONS: Notification[] = [];

// Seed Complaints
const SEED_COMPLAINTS: Complaint[] = [];

// Pricing Rules Seed
const SEED_PRICING_RULES: PricingRule[] = [];

// Audit Log Seed
const SEED_AUDIT_LOGS: AuditLog[] = [];

// Initialize LocalStorage Database if empty
const initializeLocalStorageDB = () => {
  if (!localStorage.getItem(KEYS.PROFILES)) {
    localStorage.setItem(KEYS.PROFILES, JSON.stringify(SEED_PROFILES));
    localStorage.setItem(KEYS.VEHICLES, JSON.stringify(SEED_VEHICLES));
    localStorage.setItem(KEYS.LOCATIONS, JSON.stringify(SEED_LOCATIONS));
    localStorage.setItem(KEYS.SLOTS, JSON.stringify(generateSlots()));
    localStorage.setItem(KEYS.BOOKINGS, JSON.stringify(SEED_BOOKINGS));
    localStorage.setItem(KEYS.PAYMENTS, JSON.stringify(SEED_PAYMENTS));
    localStorage.setItem(KEYS.REVIEWS, JSON.stringify(SEED_REVIEWS));
    localStorage.setItem(KEYS.FAVORITES, JSON.stringify([]));
    localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(SEED_NOTIFICATIONS));
    localStorage.setItem(KEYS.COMPLAINTS, JSON.stringify(SEED_COMPLAINTS));
    localStorage.setItem(KEYS.AUDIT_LOGS, JSON.stringify(SEED_AUDIT_LOGS));
    localStorage.setItem(KEYS.PRICING_RULES, JSON.stringify(SEED_PRICING_RULES));
    console.log('[Parkly DB Adapter] LocalStorage Database initialized with seed data.');
  }
};

if (!isRealSupabase) {
  initializeLocalStorageDB();
}

// Local Database Helpers
const getLocalData = <T>(key: string): T[] => {
  const val = localStorage.getItem(key);
  return val ? JSON.parse(val) : [];
};

const setLocalData = <T>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Setup BroadcastChannel for cross-tab realtime event synchronization in Local Mode
const parklyChannel = new BroadcastChannel('parkly_realtime_events');

parklyChannel.onmessage = (event) => {
  const { eventName, detail } = event.data;
  const customEvent = new CustomEvent(eventName, { detail });
  window.dispatchEvent(customEvent);
  console.log(`[Realtime Event Received via Channel] ${eventName}`, detail);
};

let supabaseChannel: any = null;
if (isRealSupabase && supabase) {
  supabaseChannel = supabase.channel('parkly_global_events');
  supabaseChannel.on('broadcast', { event: 'custom_event' }, (payload: any) => {
    const { eventName, detail } = payload.payload;
    const customEvent = new CustomEvent(eventName, { detail });
    window.dispatchEvent(customEvent);
    console.log(`[Supabase Realtime Received] ${eventName}`, detail);
  }).subscribe();
}

// Dispatch dynamic event to simulate realtime notifications
export const triggerRealtimeEvent = (eventName: string, detail?: any) => {
  // Dispatch locally in the current tab
  const event = new CustomEvent(eventName, { detail });
  window.dispatchEvent(event);
  console.log(`[Realtime Event Triggered] ${eventName}`, detail);
  
  if (isRealSupabase && supabaseChannel) {
    // Broadcast globally to all clients via Supabase Realtime
    supabaseChannel.send({
      type: 'broadcast',
      event: 'custom_event',
      payload: { eventName, detail }
    });
  } else {
    // Broadcast to other tabs locally
    parklyChannel.postMessage({ eventName, detail });
  }
};

// ============================================================================
// DUAL-MODE SERVICE IMPLEMENTATION
// ============================================================================
export const dbService = {
  // ==========================================
  // AUTHENTICATION & SESSIONS
  // ==========================================
  async getSessionUser(): Promise<Profile | null> {
    if (isRealSupabase && supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null;
      
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      return data;
    } else {
      const sessionUser = localStorage.getItem(KEYS.CURRENT_SESSION);
      if (!sessionUser) return null;
      const profiles = getLocalData<Profile>(KEYS.PROFILES);
      return profiles.find(p => p.id === sessionUser) || null;
    }
  },

  async login(email: string, password: string): Promise<{ user: Profile | null; error: string | null }> {
    if (isRealSupabase && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { user: null, error: error.message };
      
      const profile = await this.getSessionUser();
      return { user: profile, error: null };
    } else {
      const profiles = getLocalData<Profile>(KEYS.PROFILES);
      const matched = profiles.find(p => p.email.toLowerCase() === email.toLowerCase());
      
      // For testing, simple hardcoded match logic (any profile with password matches)
      if (matched && password === 'password') {
        localStorage.setItem(KEYS.CURRENT_SESSION, matched.id);
        
        // Add audit log
        this.addAuditLog(matched.id, matched.full_name, 'LOGIN', 'USER', matched.id);
        
        return { user: matched, error: null };
      }
      return { user: null, error: 'Invalid email or password. Use demo passwords: password' };
    }
  },

  async signup(fullName: string, email: string, phone: string, password: string, role: UserRole): Promise<{ user: Profile | null; error: string | null }> {
    if (isRealSupabase && supabase) {
      // In Supabase we must create a signup, then trigger profile insertion.
      // Represented simply:
      const { data, error } = await supabase.auth.signUp({
        email,
        password: password,
      });
      if (error) return { user: null, error: error.message };
      if (!data.user) return { user: null, error: 'User creation failed.' };

      const newProfile: Profile = {
        id: data.user.id,
        full_name: fullName,
        email,
        phone,
        role,
        created_at: new Date().toISOString()
      };

      const { error: profileError } = await supabase.from('profiles').insert([newProfile]);
      if (profileError) return { user: null, error: profileError.message };

      return { user: newProfile, error: null };
    } else {
      const profiles = getLocalData<Profile>(KEYS.PROFILES);
      if (profiles.some(p => p.email.toLowerCase() === email.toLowerCase())) {
        return { user: null, error: 'Email already registered.' };
      }

      const newProfile: Profile = {
        id: `user-${uuid()}`,
        full_name: fullName,
        email,
        phone,
        role,
        avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`,
        created_at: new Date().toISOString()
      };

      profiles.push(newProfile);
      setLocalData(KEYS.PROFILES, profiles);
      
      localStorage.setItem(KEYS.CURRENT_SESSION, newProfile.id);
      
      // Auto seed some initial slots or info if owner
      this.addAuditLog(newProfile.id, newProfile.full_name, 'SIGNUP', 'USER', newProfile.id);
      
      return { user: newProfile, error: null };
    }
  },

  async signupAdmin(fullName: string, email: string, phone: string, password: string, secretKey: string): Promise<{ user: Profile | null; error: string | null }> {
    if (isRealSupabase && supabase) {
      try {
        // FALLBACK: The new owner doesn't have the Edge Function deployed.
        // We will validate the secret via environment variable or default fallback.
        const ADMIN_SECRET = getEnvVar('VITE_ADMIN_SECRET') || 'PARKLY-ADMIN-2026';
        if (secretKey !== ADMIN_SECRET) {
          return { user: null, error: 'The registration credentials are invalid.' };
        }
        
        const { data, error } = await supabase.auth.signUp({
          email,
          password: password,
        });
        if (error) return { user: null, error: error.message };
        if (!data.user) return { user: null, error: 'User creation failed.' };

        const newProfile: Profile = {
          id: data.user.id,
          full_name: fullName,
          email,
          phone,
          role: 'ADMIN',
          created_at: new Date().toISOString()
        };

        const { error: profileError } = await supabase.from('profiles').insert([newProfile]);
        if (profileError) return { user: null, error: profileError.message };

        return { user: newProfile, error: null };
      } catch (err: any) {
         return { user: null, error: 'Unable to complete admin registration right now. Please try again.' };
      }
    } else {
      // LOCAL EMULATOR MODE ONLY
      // This is for local development and testing only.
      // The secret is configured in the environment but is NOT secure because it's evaluated in the browser.
      const LOCAL_DEV_SECRET = getEnvVar('VITE_LOCAL_ADMIN_SECRET') || 'local-dev-secret';
      
      if (secretKey !== LOCAL_DEV_SECRET) {
        return { user: null, error: 'The registration credentials are invalid.' };
      }

      const profiles = getLocalData<Profile>(KEYS.PROFILES);
      if (profiles.some(p => p.email.toLowerCase() === email.toLowerCase())) {
        return { user: null, error: 'The registration credentials are invalid.' }; // generic error
      }
      
      const newProfile: Profile = {
        id: `user-${uuid()}`,
        full_name: fullName,
        email,
        phone,
        role: 'ADMIN',
        avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`,
        created_at: new Date().toISOString()
      };

      profiles.push(newProfile);
      setLocalData(KEYS.PROFILES, profiles);
      
      localStorage.setItem(KEYS.CURRENT_SESSION, newProfile.id);
      this.addAuditLog(newProfile.id, newProfile.full_name, 'CREATE_ADMIN', 'USER', newProfile.id);
      
      return { user: newProfile, error: null };
    }
  },

  async logout(): Promise<void> {
    if (isRealSupabase && supabase) {
      await supabase.auth.signOut();
    } else {
      const user = await this.getSessionUser();
      if (user) {
        this.addAuditLog(user.id, user.full_name, 'LOGOUT', 'USER', user.id);
      }
      localStorage.removeItem(KEYS.CURRENT_SESSION);
    }
  },

  async updateProfile(id: string, updates: Partial<Profile>): Promise<Profile> {
    if (isRealSupabase && supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    } else {
      const profiles = getLocalData<Profile>(KEYS.PROFILES);
      const index = profiles.findIndex(p => p.id === id);
      if (index === -1) throw new Error('Profile not found.');
      profiles[index] = { ...profiles[index], ...updates };
      setLocalData(KEYS.PROFILES, profiles);
      return profiles[index];
    }
  },

  // ==========================================
  // VEHICLE MANAGEMENT
  // ==========================================
  async getVehicles(userId: string): Promise<Vehicle[]> {
    if (isRealSupabase && supabase) {
      const { data } = await supabase.from('vehicles').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      return data || [];
    } else {
      const vehicles = getLocalData<Vehicle>(KEYS.VEHICLES);
      return vehicles.filter(v => v.user_id === userId);
    }
  },

  async addVehicle(vehicle: Omit<Vehicle, 'id' | 'created_at'>): Promise<Vehicle> {
    if (isRealSupabase && supabase) {
      const { data, error } = await supabase.from('vehicles').insert([vehicle]).select().single();
      if (error) throw new Error(error.message);
      return data;
    } else {
      const vehicles = getLocalData<Vehicle>(KEYS.VEHICLES);
      
      // If default is true, unset other defaults
      if (vehicle.is_default) {
        vehicles.forEach(v => {
          if (v.user_id === vehicle.user_id) v.is_default = false;
        });
      }

      const newVehicle: Vehicle = {
        ...vehicle,
        id: `veh-${uuid()}`,
        created_at: new Date().toISOString()
      };

      vehicles.push(newVehicle);
      setLocalData(KEYS.VEHICLES, vehicles);
      return newVehicle;
    }
  },

  async updateVehicle(id: string, updates: Partial<Vehicle>): Promise<Vehicle> {
    if (isRealSupabase && supabase) {
      const { data, error } = await supabase.from('vehicles').update(updates).eq('id', id).select().single();
      if (error) throw new Error(error.message);
      return data;
    } else {
      const vehicles = getLocalData<Vehicle>(KEYS.VEHICLES);
      const idx = vehicles.findIndex(v => v.id === id);
      if (idx === -1) throw new Error('Vehicle not found.');

      if (updates.is_default) {
        vehicles.forEach(v => {
          if (v.user_id === vehicles[idx].user_id) v.is_default = false;
        });
      }

      vehicles[idx] = { ...vehicles[idx], ...updates };
      setLocalData(KEYS.VEHICLES, vehicles);
      return vehicles[idx];
    }
  },

  async deleteVehicle(id: string): Promise<void> {
    if (isRealSupabase && supabase) {
      await supabase.from('vehicles').delete().eq('id', id);
    } else {
      let vehicles = getLocalData<Vehicle>(KEYS.VEHICLES);
      vehicles = vehicles.filter(v => v.id !== id);
      setLocalData(KEYS.VEHICLES, vehicles);
    }
  },

  // ==========================================
  // PARKING LOCATIONS
  // ==========================================
  async getParkingLocations(role?: UserRole, ownerId?: string): Promise<ParkingLocation[]> {
    if (isRealSupabase && supabase) {
      let query = supabase.from('parking_locations').select('*');
      if (role === 'DRIVER') {
        query = query.eq('status', 'APPROVED');
      } else if (role === 'OWNER' && ownerId) {
        query = query.eq('owner_id', ownerId);
      }
      const { data } = await query;
      return data || [];
    } else {
      const locations = getLocalData<ParkingLocation>(KEYS.LOCATIONS);
      if (role === 'DRIVER') {
        return locations.filter(l => l.status === 'APPROVED');
      } else if (role === 'OWNER' && ownerId) {
        return locations.filter(l => l.owner_id === ownerId);
      }
      return locations; // Admin gets everything
    }
  },

  async getParkingLocationById(id: string): Promise<ParkingLocation | null> {
    if (isRealSupabase && supabase) {
      const { data } = await supabase.from('parking_locations').select('*').eq('id', id).single();
      return data;
    } else {
      const locations = getLocalData<ParkingLocation>(KEYS.LOCATIONS);
      return locations.find(l => l.id === id) || null;
    }
  },

  async addParkingLocation(
    location: Omit<ParkingLocation, 'id' | 'status' | 'created_at'>,
    customSlots?: { type: SlotType; price: number }[]
  ): Promise<ParkingLocation> {
    if (isRealSupabase && supabase) {
      const { data, error } = await supabase.from('parking_locations').insert([{ ...location, status: 'PENDING_REVIEW' }]).select().single();
      if (error) throw new Error(error.message);

      // Create custom slots or fallback to default ones
      const slotsToInsert = [];
      if (customSlots && customSlots.length > 0) {
        customSlots.forEach((slot, index) => {
          slotsToInsert.push({
            location_id: data.id,
            slot_number: `A0${index + 1}`,
            floor: 'Ground',
            type: slot.type,
            price_per_hour: slot.price,
            status: 'AVAILABLE'
          });
        });
      } else {
        for (let i = 1; i <= 6; i++) {
          slotsToInsert.push({
            location_id: data.id,
            slot_number: `A0${i}`,
            floor: 'Ground',
            type: i === 1 ? 'EV' : (i === 2 ? 'ACCESSIBLE' : 'CAR'),
            price_per_hour: i === 1 ? 50 : 30,
            status: 'AVAILABLE'
          });
        }
      }

      const { error: slotsError } = await supabase.from('parking_slots').insert(slotsToInsert);
      if (slotsError) {
        console.error('[Parkly DB Adapter] Failed to create slots in Supabase:', slotsError.message);
      }

      return data;
    } else {
      const locations = getLocalData<ParkingLocation>(KEYS.LOCATIONS);
      const newLoc: ParkingLocation = {
        ...location,
        id: `loc-${uuid()}`,
        status: 'PENDING_REVIEW',
        created_at: new Date().toISOString()
      };
      locations.push(newLoc);
      setLocalData(KEYS.LOCATIONS, locations);
      
      // Create custom slots or fallback to default ones
      const slots = getLocalData<ParkingSlot>(KEYS.SLOTS);
      if (customSlots && customSlots.length > 0) {
        customSlots.forEach((slot, index) => {
          slots.push({
            id: `slot-${newLoc.id}-${index + 1}`,
            location_id: newLoc.id,
            slot_number: `A0${index + 1}`,
            floor: 'Ground',
            type: slot.type,
            price_per_hour: slot.price,
            status: 'AVAILABLE',
            created_at: new Date().toISOString()
          });
        });
      } else {
        for (let i = 1; i <= 6; i++) {
          slots.push({
            id: `slot-new-${newLoc.id}-${i}`,
            location_id: newLoc.id,
            slot_number: `A0${i}`,
            floor: 'Ground',
            type: i === 1 ? 'EV' : (i === 2 ? 'ACCESSIBLE' : 'CAR'),
            price_per_hour: i === 1 ? 50 : 30,
            status: 'AVAILABLE',
            created_at: new Date().toISOString()
          });
        }
      }
      setLocalData(KEYS.SLOTS, slots);

      this.addAuditLog(location.owner_id, 'Owner', 'CREATE_PARKING', 'PARKING_LOCATION', newLoc.id, { name: location.name });
      return newLoc;
    }
  },

  async updateParkingLocation(id: string, updates: Partial<ParkingLocation>): Promise<ParkingLocation> {
    if (isRealSupabase && supabase) {
      const { data, error } = await supabase.from('parking_locations').update(updates).eq('id', id).select().single();
      if (error) throw new Error(error.message);
      return data;
    } else {
      const locations = getLocalData<ParkingLocation>(KEYS.LOCATIONS);
      const idx = locations.findIndex(l => l.id === id);
      if (idx === -1) throw new Error('Location not found.');
      locations[idx] = { ...locations[idx], ...updates };
      setLocalData(KEYS.LOCATIONS, locations);
      return locations[idx];
    }
  },

  async deleteParkingLocation(id: string): Promise<void> {
    if (isRealSupabase && supabase) {
      // First delete associated slots
      await supabase.from('parking_slots').delete().eq('location_id', id);
      const { error } = await supabase.from('parking_locations').delete().eq('id', id);
      if (error) throw new Error(error.message);
    } else {
      const locations = getLocalData<ParkingLocation>(KEYS.LOCATIONS);
      const filteredLocs = locations.filter(l => l.id !== id);
      setLocalData(KEYS.LOCATIONS, filteredLocs);

      // Filter slots
      const slots = getLocalData<ParkingSlot>(KEYS.SLOTS);
      const filteredSlots = slots.filter(s => s.location_id !== id);
      setLocalData(KEYS.SLOTS, filteredSlots);
    }
  },

  async approveParkingLocation(id: string, approved: boolean, reason?: string, adminId?: string, adminName?: string): Promise<void> {
    const status: ParkingStatus = approved ? 'APPROVED' : 'REJECTED';
    if (isRealSupabase && supabase) {
      await supabase.from('parking_locations').update({ status, rejection_reason: reason }).eq('id', id);
    } else {
      const locations = getLocalData<ParkingLocation>(KEYS.LOCATIONS);
      const idx = locations.findIndex(l => l.id === id);
      if (idx === -1) throw new Error('Location not found.');
      
      locations[idx].status = status;
      if (reason) locations[idx].rejection_reason = reason;
      setLocalData(KEYS.LOCATIONS, locations);

      // Log audit activity
      this.addAuditLog(adminId || 'admin', adminName || 'Admin', approved ? 'APPROVE_PARKING' : 'REJECT_PARKING', 'PARKING_LOCATION', id, { name: locations[idx].name, reason });

      // Notify the owner
      const ownerId = locations[idx].owner_id;
      this.sendNotification(
        ownerId,
        approved ? 'Listing Approved 🎉' : 'Listing Rejected ❌',
        approved 
          ? `Your parking location "${locations[idx].name}" has been approved and is now live!`
          : `Your parking location "${locations[idx].name}" was rejected. Reason: ${reason || 'N/A'}`,
        approved ? 'SUCCESS' : 'WARNING'
      );
      
      triggerRealtimeEvent('parking_status_changed', { id, status });
    }
  },

  // ==========================================
  // PARKING SLOTS
  // ==========================================
  async getParkingSlots(locationId: string): Promise<ParkingSlot[]> {
    if (isRealSupabase && supabase) {
      const { data } = await supabase.from('parking_slots').select('*').eq('location_id', locationId).order('slot_number', { ascending: true });
      return data || [];
    } else {
      const slots = getLocalData<ParkingSlot>(KEYS.SLOTS);
      const filteredSlots = slots.filter(s => s.location_id === locationId);
      
      // Calculate dynamic price based on occupancy if smart pricing is enabled
      const pricingRules = getLocalData<PricingRule>(KEYS.PRICING_RULES);
      const activeRule = pricingRules.find(r => r.location_id === locationId && r.is_enabled);
      
      if (activeRule) {
        const total = filteredSlots.length;
        const occupied = filteredSlots.filter(s => s.status === 'OCCUPIED' || s.status === 'RESERVED').length;
        const occupancyPct = total > 0 ? (occupied / total) * 100 : 0;
        
        return filteredSlots.map(s => {
          let multiplier = 1;
          if (occupancyPct >= activeRule.occupancy_threshold_2) {
            multiplier = activeRule.multiplier_2;
          } else if (occupancyPct >= activeRule.occupancy_threshold_1) {
            multiplier = activeRule.multiplier_1;
          }
          const basePrice = s.price_per_hour;
          const dynamicPrice = Math.min(activeRule.max_price, Math.max(activeRule.min_price, Math.round(basePrice * multiplier)));
          return {
            ...s,
            price_per_hour: dynamicPrice
          };
        });
      }
      
      return filteredSlots;
    }
  },

  async addParkingSlot(slot: Omit<ParkingSlot, 'id' | 'created_at'>): Promise<ParkingSlot> {
    if (isRealSupabase && supabase) {
      const { data, error } = await supabase.from('parking_slots').insert([slot]).select().single();
      if (error) throw new Error(error.message);
      return data;
    } else {
      const slots = getLocalData<ParkingSlot>(KEYS.SLOTS);
      if (slots.some(s => s.location_id === slot.location_id && s.slot_number.toLowerCase() === slot.slot_number.toLowerCase())) {
        throw new Error(`Slot number ${slot.slot_number} already exists for this location.`);
      }

      const newSlot: ParkingSlot = {
        ...slot,
        id: `slot-${uuid()}`,
        created_at: new Date().toISOString()
      };
      slots.push(newSlot);
      setLocalData(KEYS.SLOTS, slots);
      
      triggerRealtimeEvent('slot_status_changed', { locationId: slot.location_id });
      return newSlot;
    }
  },

  async updateSlotStatus(id: string, status: SlotStatus): Promise<ParkingSlot> {
    if (isRealSupabase && supabase) {
      const { data, error } = await supabase.from('parking_slots').update({ status }).eq('id', id).select().single();
      if (error) throw new Error(error.message);
      return data;
    } else {
      const slots = getLocalData<ParkingSlot>(KEYS.SLOTS);
      const idx = slots.findIndex(s => s.id === id);
      if (idx === -1) throw new Error('Slot not found.');
      
      // Warning check: Don't overwrite active reservations. 
      // Handled in UI, but safe-keeping it here too.
      slots[idx].status = status;
      setLocalData(KEYS.SLOTS, slots);
      
      triggerRealtimeEvent('slot_status_changed', { locationId: slots[idx].location_id });
      return slots[idx];
    }
  },

  // ==========================================
  // BOOKINGS & CONCURRENCY CONTROLS
  // ==========================================
  async getBookings(role: UserRole, userId: string): Promise<Booking[]> {
    if (isRealSupabase && supabase) {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, slot:parking_slots(*, location:parking_locations(*)), vehicle:vehicles(*)');
      
      if (error) {
        console.error("Supabase getBookings error:", error);
        return [];
      }

      const enriched = (data || []).map(b => ({
        ...b,
        location: b.slot?.location
      }));

      if (role === 'DRIVER') {
        return enriched.filter(b => b.user_id === userId);
      } else if (role === 'OWNER') {
        return enriched.filter(b => b.location?.owner_id === userId);
      }
      return enriched;
    } else {
      const bookings = getLocalData<Booking>(KEYS.BOOKINGS);
      const slots = getLocalData<ParkingSlot>(KEYS.SLOTS);
      const locations = getLocalData<ParkingLocation>(KEYS.LOCATIONS);
      const vehicles = getLocalData<Vehicle>(KEYS.VEHICLES);
      const profiles = getLocalData<Profile>(KEYS.PROFILES);

      // Form joins
      const enriched = bookings.map(b => {
        const slot = slots.find(s => s.id === b.slot_id);
        const location = slot ? locations.find(l => l.id === slot.location_id) : undefined;
        const vehicle = vehicles.find(v => v.id === b.vehicle_id);
        const driver = profiles.find(p => p.id === b.user_id);
        return {
          ...b,
          slot,
          location,
          vehicle,
          driver
        };
      });

      if (role === 'DRIVER') {
        return enriched.filter(b => b.user_id === userId);
      } else if (role === 'OWNER') {
        // Find bookings for locations owned by this owner
        return enriched.filter(b => b.location?.owner_id === userId);
      }
      return enriched; // Admin gets everything
    }
  },

  async clearDriverHistory(userId: string): Promise<void> {
    if (isRealSupabase && supabase) {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('user_id', userId)
        .in('status', ['COMPLETED', 'CANCELLED', 'EXPIRED']);
      if (error) throw new Error(error.message);
    } else {
      let bookings = getLocalData<Booking>(KEYS.BOOKINGS);
      bookings = bookings.filter(b => 
        !(b.user_id === userId && ['COMPLETED', 'CANCELLED', 'EXPIRED'].includes(b.status))
      );
      setLocalData(KEYS.BOOKINGS, bookings);
    }
  },

  async getBookingById(id: string): Promise<Booking | null> {
    if (isRealSupabase && supabase) {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, slot:parking_slots(*, location:parking_locations(*)), vehicle:vehicles(*)')
        .eq('id', id)
        .single();
      
      if (error || !data) return null;
      return {
        ...data,
        location: data.slot?.location
      };
    } else {
      const bookings = getLocalData<Booking>(KEYS.BOOKINGS);
      const match = bookings.find(b => b.id === id);
      if (!match) return null;

      const slots = getLocalData<ParkingSlot>(KEYS.SLOTS);
      const locations = getLocalData<ParkingLocation>(KEYS.LOCATIONS);
      const vehicles = getLocalData<Vehicle>(KEYS.VEHICLES);
      const profiles = getLocalData<Profile>(KEYS.PROFILES);

      const slot = slots.find(s => s.id === match.slot_id);
      const location = slot ? locations.find(l => l.id === slot.location_id) : undefined;
      const vehicle = vehicles.find(v => v.id === match.vehicle_id);
      const driver = profiles.find(p => p.id === match.user_id);

      return {
        ...match,
        slot,
        location,
        vehicle,
        driver
      };
    }
  },

  async createBooking(
    userId: string, 
    slotId: string, 
    vehicleId: string, 
    startTimeStr: string, 
    endTimeStr: string, 
    paymentMethod: string
  ): Promise<Booking> {
    const start = new Date(startTimeStr);
    const end = new Date(endTimeStr);
    const durationHours = (end.getTime() - start.getTime()) / (3600 * 1000);
    
    if (durationHours <= 0) throw new Error('Invalid booking duration. Arrival must be before checkout.');
    if (start.getTime() < Date.now() - 5 * 60 * 1000) throw new Error('Booking cannot start in the past.');

    if (isRealSupabase && supabase) {
      // Execute database RPC call for transactional exclusion
      const { data, error } = await supabase.rpc('create_booking_atomic', {
        p_user_id: userId,
        p_slot_id: slotId,
        p_vehicle_id: vehicleId,
        p_start_time: startTimeStr,
        p_end_time: endTimeStr,
        p_payment_method: paymentMethod,
        p_booking_type: 'ADVANCE',
        p_entry_fee: 0.00
      });
      if (error) throw new Error(error.message);
      return data;
    } else {
      // STRICT CONCURRENCY LOCK (simulate atomic transaction on LocalStorage)
      const bookings = getLocalData<Booking>(KEYS.BOOKINGS);
      
      // Check if slot is already reserved or occupied at these exact times
      const overlap = bookings.some(b => {
        if (b.slot_id !== slotId) return false;
        if (b.status === 'CANCELLED' || b.status === 'EXPIRED' || b.status === 'REFUNDED') return false;
        
        const bStart = new Date(b.start_time).getTime();
        const bEnd = new Date(b.end_time).getTime();
        const reqStart = start.getTime();
        const reqEnd = end.getTime();
        
        // Overlap formula: (reqStart < bEnd && reqEnd > bStart)
        return (reqStart < bEnd && reqEnd > bStart);
      });

      if (overlap) {
        throw new Error('This parking slot was just reserved by another user. Please choose another slot.');
      }

      const vehicleOverlap = bookings.some(b => {
        if (b.vehicle_id !== vehicleId) return false;
        if (b.status === 'CANCELLED' || b.status === 'EXPIRED' || b.status === 'REFUNDED') return false;
        
        const bStart = new Date(b.start_time).getTime();
        const bEnd = new Date(b.end_time).getTime();
        const reqStart = start.getTime();
        const reqEnd = end.getTime();
        
        return (reqStart < bEnd && reqEnd > bStart);
      });

      if (vehicleOverlap) {
        throw new Error('This vehicle is already booked for another parking slot during this time period.');
      }

      // Fetch slot price
      const slots = getLocalData<ParkingSlot>(KEYS.SLOTS);
      const slotIndex = slots.findIndex(s => s.id === slotId);
      if (slotIndex === -1) throw new Error('Selected slot does not exist.');
      
      if (slots[slotIndex].status === 'MAINTENANCE') {
        throw new Error('This slot is currently under maintenance.');
      }

      // Calculate price
      const totalAmount = Math.ceil(durationHours * slots[slotIndex].price_per_hour);

      const bookingId = `book-${uuid()}`;
      const qrToken = `PKG-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      const newBooking: Booking = {
        id: bookingId,
        user_id: userId,
        slot_id: slotId,
        vehicle_id: vehicleId,
        start_time: startTimeStr,
        end_time: endTimeStr,
        total_price: totalAmount,
        status: 'CONFIRMED',
        qr_code_token: qrToken,
        booking_type: 'ADVANCE',
        entry_fee: 0.00,
        created_at: new Date().toISOString()
      };

      // Add booking
      bookings.push(newBooking);
      setLocalData(KEYS.BOOKINGS, bookings);

      // Create simulated payment
      const payments = getLocalData<Payment>(KEYS.PAYMENTS);
      const newPayment: Payment = {
        id: `pay-${uuid()}`,
        booking_id: bookingId,
        amount: totalAmount,
        status: 'SUCCESSFUL',
        payment_method: paymentMethod,
        transaction_id: `TXN-${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
        created_at: new Date().toISOString()
      };
      payments.push(newPayment);
      setLocalData(KEYS.PAYMENTS, payments);

      // Update slot status to RESERVED if booking is active immediately (within 15 minutes)
      const now = Date.now();
      if (start.getTime() <= now + 15 * 60 * 1000) {
        slots[slotIndex].status = 'RESERVED';
        setLocalData(KEYS.SLOTS, slots);
        triggerRealtimeEvent('slot_status_changed', { locationId: slots[slotIndex].location_id });
      }

      // Create notification
      const userProfile = getLocalData<Profile>(KEYS.PROFILES).find(p => p.id === userId);
      this.sendNotification(
        userId,
        'Booking Confirmed! 🚗',
        `Your booking at slot ${slots[slotIndex].slot_number} is successful. Use pass ${qrToken}.`,
        'SUCCESS'
      );

      // Notify Owner
      const locations = getLocalData<ParkingLocation>(KEYS.LOCATIONS);
      const loc = locations.find(l => l.id === slots[slotIndex].location_id);
      if (loc) {
        this.sendNotification(
          loc.owner_id,
          'New Booking Received',
          `Slot ${slots[slotIndex].slot_number} has been reserved by ${userProfile?.full_name || 'Driver'}.`,
          'INFO'
        );
      }

      this.addAuditLog(userId, userProfile?.full_name || 'Driver', 'CREATE_BOOKING', 'BOOKING', bookingId, { totalAmount });
      triggerRealtimeEvent('booking_created', newBooking);

      return newBooking;
    }
  },

  async createWalkinBooking(
    userId: string, 
    slotId: string, 
    vehicleId: string, 
    paymentMethod: string
  ): Promise<Booking> {
    const start = new Date();
    const end = new Date(start.getTime() + 12 * 3600 * 1000); // 12 hours max walk-in
    const startTimeStr = start.toISOString();
    const endTimeStr = end.toISOString();
    const entryFee = 0.00; // Fixed deposit

    if (isRealSupabase && supabase) {
      const { data, error } = await supabase.rpc('create_booking_atomic', {
        p_user_id: userId,
        p_slot_id: slotId,
        p_vehicle_id: vehicleId,
        p_start_time: startTimeStr,
        p_end_time: endTimeStr,
        p_payment_method: paymentMethod,
        p_booking_type: 'WALKIN',
        p_entry_fee: entryFee
      });
      if (error) throw new Error(error.message);
      return data;
    } else {
      const bookings = getLocalData<Booking>(KEYS.BOOKINGS);
      
      const overlap = bookings.some(b => {
        if (b.slot_id !== slotId) return false;
        if (b.status === 'CANCELLED' || b.status === 'EXPIRED' || b.status === 'REFUNDED') return false;
        const bStart = new Date(b.start_time).getTime();
        const bEnd = new Date(b.end_time).getTime();
        return (start.getTime() < bEnd && end.getTime() > bStart);
      });

      if (overlap) {
        throw new Error('This slot is already reserved. Please choose another.');
      }

      const vehicleOverlap = bookings.some(b => {
        if (b.vehicle_id !== vehicleId) return false;
        if (b.status === 'CANCELLED' || b.status === 'EXPIRED' || b.status === 'REFUNDED') return false;
        const bStart = new Date(b.start_time).getTime();
        const bEnd = new Date(b.end_time).getTime();
        return (start.getTime() < bEnd && end.getTime() > bStart);
      });
      if (vehicleOverlap) {
        throw new Error('This vehicle is already booked for another parking slot during this time period.');
      }

      const slots = getLocalData<ParkingSlot>(KEYS.SLOTS);
      const slotIndex = slots.findIndex(s => s.id === slotId);
      if (slotIndex === -1) throw new Error('Selected slot does not exist.');
      if (slots[slotIndex].status === 'MAINTENANCE') throw new Error('This slot is currently under maintenance.');

      const bookingId = `book-${uuid()}`;
      const qrToken = `PKG-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      const newBooking: Booking = {
        id: bookingId,
        user_id: userId,
        slot_id: slotId,
        vehicle_id: vehicleId,
        start_time: startTimeStr,
        end_time: endTimeStr,
        total_price: 0, // Calculated at exit
        status: 'PENDING_ENTRY',
        qr_code_token: qrToken,
        booking_type: 'WALKIN',
        entry_fee: entryFee,
        created_at: new Date().toISOString()
      };

      bookings.push(newBooking);
      setLocalData(KEYS.BOOKINGS, bookings);

      const payments = getLocalData<Payment>(KEYS.PAYMENTS);
      payments.push({
        id: `pay-${uuid()}`,
        booking_id: bookingId,
        amount: entryFee,
        status: 'SUCCESSFUL',
        payment_method: paymentMethod,
        transaction_id: `TXN-${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
        created_at: new Date().toISOString()
      });
      setLocalData(KEYS.PAYMENTS, payments);

      // Notify User
      this.sendNotification(
        userId,
        'Walk-in Entry Reserved',
        `Please present Entry QR at the gate. Fee paid: ₹${entryFee}`,
        'SUCCESS'
      );

      triggerRealtimeEvent('booking_created', newBooking);
      return newBooking;
    }
  },

  async checkInDriver(qrCodeToken: string, staffUserId?: string): Promise<{ booking: Booking; error: string | null }> {
    if (isRealSupabase && supabase) {
      const { data: booking, error: fetchErr } = await supabase
        .from('bookings')
        .select('*')
        .eq('qr_code_token', qrCodeToken)
        .single();
      
      if (fetchErr || !booking) {
        return { booking: {} as Booking, error: 'Invalid QR pass. Booking not found.' };
      }

      if (booking.status === 'CANCELLED' || booking.status === 'EXPIRED') {
        return { booking: {} as Booking, error: `Invalid check-in. Booking is ${booking.status.toLowerCase()}.` };
      }
      if (booking.status === 'ACTIVE') {
        return { booking: {} as Booking, error: 'Driver is already checked in.' };
      }
      if (booking.status === 'COMPLETED') {
        return { booking: {} as Booking, error: 'This QR code pass has already been used and completed.' };
      }

      if (booking.entry_scanned_at) {
        return { booking: {} as Booking, error: 'Entry QR already used.' };
      }

      const exitQrToken = `EXIT-${uuid()}`;
      const nowIso = new Date().toISOString();

      // Ensure this vehicle isn't physically parked somewhere else simultaneously
      const { count: activeCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('vehicle_id', booking.vehicle_id)
        .in('status', ['ACTIVE', 'PENDING_PAYMENT'])
        .neq('id', booking.id);

      if (activeCount && activeCount > 0) {
        return { booking: {} as Booking, error: 'ACCESS DENIED: Vehicle is currently checked-in at another parking lot. A car cannot be in two places at once.' };
      }

      const { data: updatedBooking, error: updateErr } = await supabase
        .from('bookings')
        .update({ 
          status: 'ACTIVE', 
          exit_qr_token: exitQrToken, 
          entry_scanned_at: nowIso, 
          actual_entry_at: nowIso 
        })
        .eq('id', booking.id)
        .select()
        .single();

      if (updateErr) return { booking: {} as Booking, error: updateErr.message };

      const { error: slotUpdateErr } = await supabase.from('parking_slots').update({ status: 'OCCUPIED' }).eq('id', booking.slot_id);
      if (slotUpdateErr) console.error('Failed to update slot to OCCUPIED:', slotUpdateErr);

      this.addAuditLog(staffUserId || 'owner', 'Staff', 'CHECK_IN', 'BOOKING', booking.id);
      this.sendNotification(
        booking.user_id,
        'Check-In Successful ✅',
        'Successfully checked into your assigned slot. Have a great stay!',
        'SUCCESS'
      );

      const { data: slotData } = await supabase.from('parking_slots').select('location_id').eq('id', booking.slot_id).single();
      if (slotData) {
        triggerRealtimeEvent('slot_status_changed', { locationId: slotData.location_id });
      }
      triggerRealtimeEvent('booking_updated', updatedBooking);

      return { booking: updatedBooking, error: null };
    } else {
      const bookings = getLocalData<Booking>(KEYS.BOOKINGS);
      const slots = getLocalData<ParkingSlot>(KEYS.SLOTS);
      const bookingIdx = bookings.findIndex(b => b.qr_code_token === qrCodeToken);
      
      if (bookingIdx === -1) {
        return { booking: {} as Booking, error: 'Invalid QR pass. Booking not found.' };
      }

      const booking = bookings[bookingIdx];
      const slotIdx = slots.findIndex(s => s.id === booking.slot_id);
      
      if (booking.status === 'CANCELLED' || booking.status === 'EXPIRED') {
        return { booking: {} as Booking, error: `Invalid check-in. Booking is ${booking.status.toLowerCase()}.` };
      }
      if (booking.status === 'ACTIVE') {
        return { booking: {} as Booking, error: 'Driver is already checked in.' };
      }
      if (booking.status === 'COMPLETED') {
        return { booking: {} as Booking, error: 'This QR code pass has already been used and completed.' };
      }

      if (booking.entry_scanned_at) {
        return { booking: {} as Booking, error: 'Entry QR already used.' };
      }

      // Check time constraint (allow checkin 1 hour early / anytime during slot duration)
      const now = Date.now();
      const start = new Date(booking.start_time).getTime();
      const end = new Date(booking.end_time).getTime();
      
      // For ADVANCE bookings, enforce early check-in limit
      if (booking.booking_type !== 'WALKIN' && now < start - 60 * 60 * 1000) {
        return { booking: {} as Booking, error: 'Check-in failed. Too early. You can check in up to 1 hour before scheduled start.' };
      }
      if (booking.booking_type !== 'WALKIN' && now > end) {
        // Booking expired. Update status
        bookings[bookingIdx].status = 'EXPIRED';
        setLocalData(KEYS.BOOKINGS, bookings);
        return { booking: {} as Booking, error: 'This booking has expired. Slot checkout time has passed.' };
      }

      // Update statuses and anti-cheat fields
      const exitQrToken = `EXIT-${uuid()}`;
      const nowIso = new Date(now).toISOString();

      // Ensure this vehicle isn't physically parked somewhere else simultaneously
      const isVehicleBusy = bookings.some(b => 
        b.vehicle_id === booking.vehicle_id && 
        b.id !== booking.id && 
        (b.status === 'ACTIVE' || b.status === 'PENDING_PAYMENT')
      );
      if (isVehicleBusy) {
        return { booking: {} as Booking, error: 'ACCESS DENIED: Vehicle is currently checked-in at another parking lot. A car cannot be in two places at once.' };
      }

      bookings[bookingIdx].status = 'ACTIVE';
      bookings[bookingIdx].exit_qr_token = exitQrToken;
      bookings[bookingIdx].entry_scanned_at = nowIso;
      bookings[bookingIdx].actual_entry_at = nowIso;

      if (slotIdx !== -1) {
        slots[slotIdx].status = 'OCCUPIED';
      }
      
      setLocalData(KEYS.BOOKINGS, bookings);
      setLocalData(KEYS.SLOTS, slots);

      this.sendNotification(
        booking.user_id,
        'Check-In Successful 🟢',
        `Successfully checked into slot ${slots[slotIdx]?.slot_number || 'N/A'}. Have a great stay!`,
        'SUCCESS'
      );

      this.addAuditLog(staffUserId || 'owner', 'Staff', 'CHECK_IN', 'BOOKING', booking.id, { slot: slots[slotIdx]?.slot_number });
      
      triggerRealtimeEvent('slot_status_changed', { locationId: slots[slotIdx]?.location_id });
      triggerRealtimeEvent('booking_updated', bookings[bookingIdx]);

      return { booking: bookings[bookingIdx], error: null };
    }
  },

  async checkOutDriver(qrCodeToken: string, staffUserId?: string): Promise<{ booking: Booking; overstayCharge: number }> {
    if (isRealSupabase && supabase) {
      // Lookup booking by either qr_code_token or exit_qr_token
      const { data: booking, error: fetchErr } = await supabase
        .from('bookings')
        .select('*')
        .or(`qr_code_token.eq.${qrCodeToken},exit_qr_token.eq.${qrCodeToken}`)
        .single();
      
      if (fetchErr || !booking) throw new Error('Booking not found for this QR pass.');
      if (booking.exit_scanned_at) throw new Error('Exit already processed for this booking.');

      const now = Date.now();
      const nowIso = new Date(now).toISOString();

      // If the driver already paid the final balance, just record physical exit.
      if (booking.status === 'COMPLETED') {
        const { data: updatedBooking, error: updateErr } = await supabase
          .from('bookings')
          .update({ exit_scanned_at: nowIso, actual_exit_at: nowIso })
          .eq('id', booking.id)
          .select()
          .single();

        if (updateErr) throw new Error(updateErr.message);

        this.addAuditLog(staffUserId || 'owner', 'Staff', 'CHECK_OUT', 'BOOKING', booking.id);
        triggerRealtimeEvent('booking_updated', updatedBooking);
        return { booking: updatedBooking, overstayCharge: 0 };
      }


      let overstayCharge = 0;
      let finalStatus = 'COMPLETED';
      let finalAmount = booking.total_price;

      if (booking.booking_type === 'WALKIN') {
        const entryTime = booking.actual_entry_at ? new Date(booking.actual_entry_at).getTime() : new Date(booking.start_time).getTime();
        const durationMins = Math.max(1, Math.floor((now - entryTime) / (60 * 1000)));
        // We need slot rate. Fetch slot:
        const { data: slot } = await supabase.from('parking_slots').select('price_per_hour').eq('id', booking.slot_id).single();
        const rate = slot ? slot.price_per_hour : 30;
        
        const calculatedTotal = parseFloat(((durationMins / 60) * rate).toFixed(2));
        finalAmount = Math.max(0, calculatedTotal - booking.entry_fee);
        
        if (finalAmount > 0) {
          finalStatus = 'PENDING_PAYMENT';
        }
      } else {
        // ADVANCE booking
        const end = new Date(booking.end_time).getTime();
        if (now > end + 15 * 60 * 1000) {
          const overstayMs = now - end;
          const overstayHours = Math.ceil(overstayMs / (3600 * 1000));
          const { data: slot } = await supabase.from('parking_slots').select('price_per_hour').eq('id', booking.slot_id).single();
          const rate = slot ? slot.price_per_hour : 30;
          overstayCharge = overstayHours * rate;
          finalAmount += overstayCharge;
          
          // Note: In a real system, you might set PENDING_PAYMENT here if overstayCharge > 0, 
          // but for simplicity, we keep the original logic for ADVANCE bookings.
        }
      }

      const { data: updatedBooking, error: updateErr } = await supabase
        .from('bookings')
        .update({ 
          status: finalStatus,
          exit_scanned_at: nowIso,
          actual_exit_at: nowIso,
          final_amount: finalAmount,
          total_price: finalAmount + booking.entry_fee // Total value of the booking
        })
        .eq('id', booking.id)
        .select()
        .single();

      if (updateErr) throw new Error(updateErr.message);

      triggerRealtimeEvent('booking_updated', updatedBooking);

      if (finalStatus === 'COMPLETED') {
        const { error: slotUpdateErr } = await supabase.from('parking_slots').update({ status: 'AVAILABLE' }).eq('id', booking.slot_id);
        if (slotUpdateErr) console.error('Failed to update slot to AVAILABLE:', slotUpdateErr);
        
        // Auto-generate invoice
        const invoiceNum = 'INV-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        await supabase.from('invoices').insert([{
          booking_id: booking.id,
          invoice_number: invoiceNum,
          base_amount: booking.booking_type === 'WALKIN' ? booking.entry_fee : booking.total_price,
          overstay_amount: overstayCharge,
          total_amount: updatedBooking.total_price,
          status: 'PAID'
        }]);
      }

      this.addAuditLog(staffUserId || 'owner', 'Staff', 'CHECK_OUT', 'BOOKING', booking.id);
      this.sendNotification(
        booking.user_id,
        'Check-Out Processed 🏁',
        finalStatus === 'PENDING_PAYMENT' 
          ? `Please pay the remaining ₹${finalAmount} in the app to complete exit.` 
          : `Successfully checked out.`,
        'SUCCESS'
      );

      return { booking: updatedBooking, overstayCharge };
    } else {
      const bookings = getLocalData<Booking>(KEYS.BOOKINGS);
      const slots = getLocalData<ParkingSlot>(KEYS.SLOTS);
      
      const bookingIdx = bookings.findIndex(b => b.qr_code_token === qrCodeToken || b.exit_qr_token === qrCodeToken);
      if (bookingIdx === -1) throw new Error('Booking not found for this QR pass.');
      
      const booking = bookings[bookingIdx];
      if (booking.exit_scanned_at) throw new Error('Exit already processed for this booking.');
      
      const slotIdx = slots.findIndex(s => s.id === booking.slot_id);
      
      const now = Date.now();
      const nowIso = new Date(now).toISOString();

      if (booking.status === 'COMPLETED') {
        bookings[bookingIdx].exit_scanned_at = nowIso;
        bookings[bookingIdx].actual_exit_at = nowIso;
        setLocalData(KEYS.BOOKINGS, bookings);
        this.addAuditLog(staffUserId || 'owner', 'Staff', 'CHECK_OUT', 'BOOKING', booking.id);
        triggerRealtimeEvent('booking_updated', bookings[bookingIdx]);
        return { booking: bookings[bookingIdx], overstayCharge: 0 };
      }
      

      let overstayCharge = 0;
      let finalStatus = 'COMPLETED';
      let finalAmount = booking.total_price;

      if (booking.booking_type === 'WALKIN') {
        const entryTime = booking.actual_entry_at ? new Date(booking.actual_entry_at).getTime() : new Date(booking.start_time).getTime();
        const durationMins = Math.max(1, Math.floor((now - entryTime) / (60 * 1000)));
        const rate = slotIdx !== -1 ? slots[slotIdx].price_per_hour : 30;
        
        const calculatedTotal = parseFloat(((durationMins / 60) * rate).toFixed(2));
        finalAmount = Math.max(0, calculatedTotal - booking.entry_fee);
        
        if (finalAmount > 0) {
          finalStatus = 'PENDING_PAYMENT';
        }
      } else {
        // ADVANCE booking
        const end = new Date(booking.end_time).getTime();
        if (now > end + 15 * 60 * 1000) {
          const overstayMs = now - end;
          const overstayHours = Math.ceil(overstayMs / (3600 * 1000));
          const rate = slotIdx !== -1 ? slots[slotIdx].price_per_hour : 30;
          overstayCharge = overstayHours * rate;
          finalAmount += overstayCharge;
          
          const payments = getLocalData<Payment>(KEYS.PAYMENTS);
          payments.push({
            id: `pay-${uuid()}`,
            booking_id: booking.id,
            amount: overstayCharge,
            status: 'SUCCESSFUL',
            payment_method: 'Auto-Debit Sim',
            transaction_id: `TXN-OVER-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
            created_at: new Date().toISOString()
          });
          setLocalData(KEYS.PAYMENTS, payments);
        }
      }

      bookings[bookingIdx].status = finalStatus as BookingStatus;
      bookings[bookingIdx].exit_scanned_at = nowIso;
      bookings[bookingIdx].actual_exit_at = nowIso;
      bookings[bookingIdx].final_amount = finalAmount;
      bookings[bookingIdx].total_price = booking.booking_type === 'WALKIN' ? finalAmount + booking.entry_fee : finalAmount;
      
      if (finalStatus === 'COMPLETED' && slotIdx !== -1) {
        slots[slotIdx].status = 'AVAILABLE';
        setLocalData(KEYS.SLOTS, slots);

        const invoices = getLocalData<Invoice>('parkly_invoices');
        const invoiceNum = 'INV-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        invoices.push({
          id: `inv-${uuid()}`,
          booking_id: booking.id,
          invoice_number: invoiceNum,
          base_amount: booking.booking_type === 'WALKIN' ? booking.entry_fee : booking.total_price,
          overstay_amount: overstayCharge,
          total_amount: bookings[bookingIdx].total_price,
          status: 'PAID',
          created_at: new Date().toISOString()
        });
        setLocalData('parkly_invoices', invoices);
      }

      setLocalData(KEYS.BOOKINGS, bookings);

      this.sendNotification(
        booking.user_id,
        'Check-Out Processed 🏁',
        finalStatus === 'PENDING_PAYMENT' 
          ? `Please pay the remaining ₹${finalAmount} in the app to complete exit.` 
          : `Successfully checked out.`,
        'SUCCESS'
      );

      this.addAuditLog(staffUserId || 'owner', 'Staff', 'CHECK_OUT', 'BOOKING', booking.id, { overstayCharge });
      
      if (slotIdx !== -1) {
        triggerRealtimeEvent('slot_status_changed', { locationId: slots[slotIdx].location_id });
      }
      triggerRealtimeEvent('booking_updated', bookings[bookingIdx]);

      return { booking: bookings[bookingIdx], overstayCharge };
    }
  },

  async payWalkinFinalAmount(bookingId: string, paymentMethod: string): Promise<Booking> {
    if (isRealSupabase && supabase) {
      const { data: booking, error: fetchErr } = await supabase.from('bookings').select('*').eq('id', bookingId).single();
      if (fetchErr || !booking) throw new Error('Booking not found.');

      const { data: updatedBooking, error: updateErr } = await supabase
        .from('bookings')
        .update({ status: 'COMPLETED' })
        .eq('id', bookingId)
        .select()
        .single();
      if (updateErr) throw new Error(updateErr.message);
      const invoiceNum = 'INV-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      await supabase.from('invoices').insert([{
        booking_id: booking.id,
        invoice_number: invoiceNum,
        base_amount: booking.entry_fee,
        overstay_amount: 0,
        total_amount: updatedBooking.total_price,
        status: 'PAID'
      }]);

      this.sendNotification(
        booking.user_id,
        'Payment Complete ✅',
        `Successfully paid final amount. You can now leave.`,
        'SUCCESS'
      );
      const { data: slotData } = await supabase.from('parking_slots').select('location_id').eq('id', booking.slot_id).single();
      if (slotData) {
        triggerRealtimeEvent('slot_status_changed', { locationId: slotData.location_id });
      }
      triggerRealtimeEvent('booking_updated', updatedBooking);
      return updatedBooking;
    } else {
      const bookings = getLocalData<Booking>(KEYS.BOOKINGS);
      const slots = getLocalData<ParkingSlot>(KEYS.SLOTS);
      const bookingIdx = bookings.findIndex(b => b.id === bookingId);
      if (bookingIdx === -1) throw new Error('Booking not found.');
      
      const booking = bookings[bookingIdx];
      
      const payments = getLocalData<Payment>(KEYS.PAYMENTS);
      payments.push({
        id: `pay-${uuid()}`,
        booking_id: bookingId,
        amount: booking.final_amount || 0,
        status: 'SUCCESSFUL',
        payment_method: paymentMethod,
        transaction_id: `TXN-FINAL-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        created_at: new Date().toISOString()
      });
      setLocalData(KEYS.PAYMENTS, payments);

      bookings[bookingIdx].status = 'COMPLETED';
      setLocalData(KEYS.BOOKINGS, bookings);

      const slotIdx = slots.findIndex(s => s.id === booking.slot_id);
      if (slotIdx !== -1) {
        slots[slotIdx].status = 'AVAILABLE';
        setLocalData(KEYS.SLOTS, slots);
        triggerRealtimeEvent('slot_status_changed', { locationId: slots[slotIdx].location_id });
      }

      const invoices = getLocalData<Invoice>('parkly_invoices');
      const invoiceNum = 'INV-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      invoices.push({
        id: `inv-${uuid()}`,
        booking_id: booking.id,
        invoice_number: invoiceNum,
        base_amount: booking.entry_fee,
        overstay_amount: 0,
        total_amount: booking.total_price,
        status: 'PAID',
        created_at: new Date().toISOString()
      });
      setLocalData('parkly_invoices', invoices);

      triggerRealtimeEvent('booking_updated', bookings[bookingIdx]);
      return bookings[bookingIdx];
    }
  },

  async cancelBooking(bookingId: string, userId: string): Promise<void> {
    if (isRealSupabase && supabase) {
      const { data: booking } = await supabase.from('bookings').select('*').eq('id', bookingId).single();
      if (!booking) throw new Error('Booking not found.');

      const { error } = await supabase.from('bookings').update({ status: 'CANCELLED' }).eq('id', bookingId);
      if (error) throw new Error(error.message);

      this.sendNotification(
        booking.user_id,
        'Booking Cancelled 🔴',
        `Your parking reservation has been cancelled. A refund of ₹${booking.total_price} is processed.`,
        'WARNING'
      );
      this.addAuditLog(userId, 'Driver', 'CANCEL_BOOKING', 'BOOKING', bookingId, { refundAmount: booking.total_price });
    } else {
      const bookings = getLocalData<Booking>(KEYS.BOOKINGS);
      const idx = bookings.findIndex(b => b.id === bookingId);
      if (idx === -1) throw new Error('Booking not found.');
      
      const booking = bookings[idx];
      if (booking.status === 'ACTIVE' || booking.status === 'COMPLETED') {
        throw new Error('Active or completed bookings cannot be cancelled.');
      }

      bookings[idx].status = 'CANCELLED';
      setLocalData(KEYS.BOOKINGS, bookings);

      // Reset slot status to available
      const slots = getLocalData<ParkingSlot>(KEYS.SLOTS);
      const slotIdx = slots.findIndex(s => s.id === booking.slot_id);
      if (slotIdx !== -1) {
        slots[slotIdx].status = 'AVAILABLE';
        setLocalData(KEYS.SLOTS, slots);
        triggerRealtimeEvent('slot_status_changed', { locationId: slots[slotIdx].location_id });
      }

      // Process simulation refund
      const payments = getLocalData<Payment>(KEYS.PAYMENTS);
      const pIdx = payments.findIndex(p => p.booking_id === bookingId);
      if (pIdx !== -1) {
        payments[pIdx].status = 'REFUNDED';
        setLocalData(KEYS.PAYMENTS, payments);
      }

      this.sendNotification(
        booking.user_id,
        'Booking Cancelled 🔴',
        `Your parking reservation has been cancelled. A refund of ₹${booking.total_price} is processed.`,
        'WARNING'
      );

      this.addAuditLog(userId, 'Driver', 'CANCEL_BOOKING', 'BOOKING', bookingId, { refundAmount: booking.total_price });
      triggerRealtimeEvent('booking_updated', bookings[idx]);
    }
  },

  // ==========================================
  // REVIEWS
  // ==========================================
  async getReviews(locationId: string): Promise<Review[]> {
    if (isRealSupabase && supabase) {
      const { data } = await supabase.from('reviews').select('*').eq('parking_id', locationId);
      return data || [];
    } else {
      const reviews = getLocalData<Review>(KEYS.REVIEWS);
      return reviews.filter(r => r.parking_id === locationId);
    }
  },

  async addReview(review: Omit<Review, 'id' | 'created_at'>): Promise<Review> {
    if (isRealSupabase && supabase) {
      const { data, error } = await supabase.from('reviews').insert([review]).select().single();
      if (error) throw new Error(error.message);
      return data;
    } else {
      const reviews = getLocalData<Review>(KEYS.REVIEWS);
      const profiles = getLocalData<Profile>(KEYS.PROFILES);
      const profile = profiles.find(p => p.id === review.user_id);

      const newReview: Review = {
        ...review,
        id: `rev-${uuid()}`,
        created_at: new Date().toISOString(),
        driver_name: profile?.full_name || 'Driver',
        avatar_url: profile?.avatar_url
      };

      reviews.push(newReview);
      setLocalData(KEYS.REVIEWS, reviews);

      // Audit log review creation
      this.addAuditLog(review.user_id, profile?.full_name || 'Driver', 'ADD_REVIEW', 'PARKING_LOCATION', review.parking_id, { rating: review.rating });
      return newReview;
    }
  },

  // ==========================================
  // FAVORITES
  // ==========================================
  async getFavorites(userId: string): Promise<Favorite[]> {
    if (isRealSupabase && supabase) {
      const { data } = await supabase.from('favorites').select('*').eq('user_id', userId);
      return data || [];
    } else {
      const favs = getLocalData<Favorite>(KEYS.FAVORITES);
      return favs.filter(f => f.user_id === userId);
    }
  },

  async toggleFavorite(userId: string, parkingId: string): Promise<boolean> {
    if (isRealSupabase && supabase) {
      // Complex checking done via backend
      return true;
    } else {
      const favs = getLocalData<Favorite>(KEYS.FAVORITES);
      const existingIdx = favs.findIndex(f => f.user_id === userId && f.parking_id === parkingId);
      
      if (existingIdx !== -1) {
        favs.splice(existingIdx, 1);
        setLocalData(KEYS.FAVORITES, favs);
        return false; // Removed
      } else {
        favs.push({
          id: `fav-${uuid()}`,
          user_id: userId,
          parking_id: parkingId,
          created_at: new Date().toISOString()
        });
        setLocalData(KEYS.FAVORITES, favs);
        return true; // Added
      }
    }
  },

  // ==========================================
  // NOTIFICATIONS
  // ==========================================
  async getNotifications(userId: string): Promise<Notification[]> {
    if (isRealSupabase && supabase) {
      const { data } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      return data || [];
    } else {
      const notifs = getLocalData<Notification>(KEYS.NOTIFICATIONS);
      return notifs.filter(n => n.user_id === userId).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  },

  async sendNotification(userId: string, title: string, message: string, type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT'): Promise<Notification> {
    const newNotif: Omit<Notification, 'id' | 'is_read' | 'created_at'> = { user_id: userId, title, message, type };
    
    if (isRealSupabase && supabase) {
      const { data, error } = await supabase.from('notifications').insert([newNotif]).select().single();
      if (error) throw new Error(error.message);
      return data;
    } else {
      const notifs = getLocalData<Notification>(KEYS.NOTIFICATIONS);
      const completeNotif: Notification = {
        ...newNotif,
        id: `notif-${uuid()}`,
        is_read: false,
        created_at: new Date().toISOString()
      };
      notifs.push(completeNotif);
      setLocalData(KEYS.NOTIFICATIONS, notifs);
      
      triggerRealtimeEvent('notification_created', completeNotif);
      return completeNotif;
    }
  },

  async markNotificationRead(id: string): Promise<void> {
    if (isRealSupabase && supabase) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    } else {
      const notifs = getLocalData<Notification>(KEYS.NOTIFICATIONS);
      const idx = notifs.findIndex(n => n.id === id);
      if (idx !== -1) {
        notifs[idx].is_read = true;
        setLocalData(KEYS.NOTIFICATIONS, notifs);
      }
    }
  },

  async markAllNotificationsRead(userId: string): Promise<void> {
    if (isRealSupabase && supabase) {
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId);
    } else {
      const notifs = getLocalData<Notification>(KEYS.NOTIFICATIONS);
      notifs.forEach(n => {
        if (n.user_id === userId) n.is_read = true;
      });
      setLocalData(KEYS.NOTIFICATIONS, notifs);
    }
  },

  async deleteNotification(id: string): Promise<void> {
    if (isRealSupabase && supabase) {
      await supabase.from('notifications').delete().eq('id', id);
    } else {
      let notifs = getLocalData<Notification>(KEYS.NOTIFICATIONS);
      notifs = notifs.filter(n => n.id !== id);
      setLocalData(KEYS.NOTIFICATIONS, notifs);
    }
  },

  // ==========================================
  // COMPLAINT SYSTEM
  // ==========================================
  async getComplaints(userId?: string): Promise<Complaint[]> {
    if (isRealSupabase && supabase) {
      const { data } = await supabase.from('complaints').select('*');
      return data || [];
    } else {
      const complaints = getLocalData<Complaint>(KEYS.COMPLAINTS);
      const profiles = getLocalData<Profile>(KEYS.PROFILES);
      
      const enriched = complaints.map(c => {
        const p = profiles.find(profile => profile.id === c.user_id);
        return {
          ...c,
          driver_name: p?.full_name || 'Driver',
          driver_email: p?.email || 'N/A'
        };
      });

      if (userId) {
        return enriched.filter(c => c.user_id === userId);
      }
      return enriched; // Admin gets everything
    }
  },

  async submitComplaint(complaint: Omit<Complaint, 'id' | 'status' | 'created_at'>): Promise<Complaint> {
    if (isRealSupabase && supabase) {
      const { data, error } = await supabase.from('complaints').insert([{ ...complaint, status: 'OPEN' }]).select().single();
      if (error) throw new Error(error.message);
      return data;
    } else {
      const complaints = getLocalData<Complaint>(KEYS.COMPLAINTS);
      const newComp: Complaint = {
        ...complaint,
        id: `comp-${uuid()}`,
        status: 'OPEN',
        created_at: new Date().toISOString()
      };
      complaints.push(newComp);
      setLocalData(KEYS.COMPLAINTS, complaints);
      return newComp;
    }
  },

  async resolveComplaint(id: string, resolutionNotes: string): Promise<void> {
    if (isRealSupabase && supabase) {
      await supabase.from('complaints').update({ status: 'RESOLVED', internal_notes: resolutionNotes }).eq('id', id);
    } else {
      const complaints = getLocalData<Complaint>(KEYS.COMPLAINTS);
      const idx = complaints.findIndex(c => c.id === id);
      if (idx !== -1) {
        complaints[idx].status = 'RESOLVED';
        complaints[idx].internal_notes = resolutionNotes;
        setLocalData(KEYS.COMPLAINTS, complaints);

        // Notify user
        this.sendNotification(
          complaints[idx].user_id,
          'Complaint Resolved 📢',
          `Your ticket regarding "${complaints[idx].subject}" has been marked RESOLVED. Notes: ${resolutionNotes}`,
          'SUCCESS'
        );
      }
    }
  },

  // ==========================================
  // PRICING RULES (OWNER CONTROL)
  // ==========================================
  async getPricingRules(locationId: string): Promise<PricingRule | null> {
    if (isRealSupabase && supabase) {
      const { data, error } = await supabase.from('pricing_rules').select('*').eq('location_id', locationId).maybeSingle();
      if (error) return null;
      return data;
    } else {
      const rules = getLocalData<PricingRule>(KEYS.PRICING_RULES);
      return rules.find(r => r.location_id === locationId) || null;
    }
  },

  async savePricingRule(rule: Omit<PricingRule, 'id'>): Promise<PricingRule> {
    if (isRealSupabase && supabase) {
      const { data: existing } = await supabase.from('pricing_rules').select('id').eq('location_id', rule.location_id).maybeSingle();
      if (existing) {
        const { data, error } = await supabase.from('pricing_rules').update(rule).eq('id', existing.id).select().single();
        if (error) throw new Error(error.message);
        return data;
      } else {
        const { data, error } = await supabase.from('pricing_rules').insert([rule]).select().single();
        if (error) throw new Error(error.message);
        return data;
      }
    } else {
      const rules = getLocalData<PricingRule>(KEYS.PRICING_RULES);
      const existingIdx = rules.findIndex(r => r.location_id === rule.location_id);
      if (existingIdx !== -1) {
        rules[existingIdx] = { ...rules[existingIdx], ...rule };
        setLocalData(KEYS.PRICING_RULES, rules);
        return rules[existingIdx];
      } else {
        const newRule: PricingRule = {
          ...rule,
          id: `rule-${uuid()}`,
          created_at: new Date().toISOString()
        };
        rules.push(newRule);
        setLocalData(KEYS.PRICING_RULES, rules);
        return newRule;
      }
    }
  },

  // ==========================================
  // DEMAND FORECAST & ANALYTICS
  // ==========================================
  async getDemandForecast(locationId: string): Promise<any> {
    // Generate static forecasting trends based on typical hourly variations
    const forecast = [];
    const peakHours = [9, 10, 11, 12, 13, 17, 18, 19, 20]; // Office & evening rush hour peaks
    for (let hour = 0; hour < 24; hour++) {
      let pct = 15; // default base occupancy
      if (peakHours.includes(hour)) {
        pct = Math.round(75 + Math.random() * 15);
      } else if (hour >= 8 && hour <= 21) {
        pct = Math.round(45 + Math.random() * 20);
      } else if (hour >= 0 && hour <= 6) {
        pct = Math.round(5 + Math.random() * 10);
      }
      
      forecast.push({
        hour: `${hour}:00`,
        expected_occupancy_pct: pct,
        demand_level: pct > 75 ? 'HIGH' : (pct > 40 ? 'MEDIUM' : 'LOW')
      });
    }
    return forecast;
  },

  // ==========================================
  // ADMIN SYSTEM AUDITS
  // ==========================================
  async getAuditLogs(): Promise<AuditLog[]> {
    if (isRealSupabase && supabase) {
      const { data } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false });
      return data || [];
    } else {
      const logs = getLocalData<AuditLog>(KEYS.AUDIT_LOGS);
      return logs.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  },

  async addAuditLog(
    actorId: string, 
    actorName: string, 
    action: string, 
    entityType: string, 
    entityId: string, 
    metadata?: any
  ): Promise<AuditLog> {
    const newLog: Omit<AuditLog, 'id' | 'created_at'> = { actor_id: actorId, actor_name: actorName, action, entity_type: entityType, entity_id: entityId, metadata };
    if (isRealSupabase && supabase) {
      const { data } = await supabase.from('audit_logs').insert([newLog]).select().single();
      return data;
    } else {
      const logs = getLocalData<AuditLog>(KEYS.AUDIT_LOGS);
      const completeLog: AuditLog = {
        ...newLog,
        id: `audit-${uuid()}`,
        created_at: new Date().toISOString()
      };
      logs.push(completeLog);
      setLocalData(KEYS.AUDIT_LOGS, logs);
      return completeLog;
    }
  },

  // User Administration
  async getUsersAdmin(): Promise<Profile[]> {
    if (isRealSupabase && supabase) {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data || [];
    } else {
      return getLocalData<Profile>(KEYS.PROFILES);
    }
  },

  async toggleUserSuspension(userId: string, isSuspended: boolean): Promise<void> {
    if (isRealSupabase && supabase) {
      const { error } = await supabase.from('profiles').update({ is_suspended: isSuspended }).eq('id', userId);
      if (error) throw new Error(error.message);
      this.addAuditLog('admin', 'Admin', isSuspended ? 'SUSPEND_USER' : 'REACTIVATE_USER', 'USER', userId);
      this.sendNotification(
        userId,
        isSuspended ? 'Account Suspended 🛑' : 'Account Reactivated 🎉',
        isSuspended ? 'Your account has been suspended by an administrator.' : 'Your account has been reactivated. You can now use the app.',
        isSuspended ? 'ALERT' : 'SUCCESS'
      );
    } else {
      const profiles = getLocalData<Profile>(KEYS.PROFILES);
      const idx = profiles.findIndex(p => p.id === userId);
      if (idx !== -1) {
        profiles[idx].is_suspended = isSuspended;
        setLocalData(KEYS.PROFILES, profiles);
        const profile = profiles[idx];
        this.addAuditLog('admin', 'Admin', isSuspended ? 'SUSPEND_USER' : 'REACTIVATE_USER', 'USER', userId, { email: profile.email });
        this.sendNotification(
          userId,
          isSuspended ? 'Account Suspended 🛑' : 'Account Reactivated 🎉',
          isSuspended ? 'Your account has been suspended by an administrator.' : 'Your account has been reactivated. You can now use the app.',
          isSuspended ? 'ALERT' : 'SUCCESS'
        );
      }
    }
  },

  // ==========================================
  // ACCESS LOGS (ANPR/QR/RFID ACCESS ENGINE)
  // ==========================================
  async getAccessLogs(locationId?: string): Promise<AccessLog[]> {
    if (isRealSupabase && supabase) {
      let q = supabase.from('access_logs').select('*');
      if (locationId) q = q.eq('location_id', locationId);
      const { data, error } = await q.order('created_at', { ascending: false });
      if (error) return [];
      return data || [];
    } else {
      const logs = getLocalData<AccessLog>('parkly_access_logs');
      if (locationId) return logs.filter(l => l.location_id === locationId).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return logs.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  },

  async addAccessLog(log: Omit<AccessLog, 'id' | 'created_at'>): Promise<AccessLog> {
    if (isRealSupabase && supabase) {
      const { data, error } = await supabase.from('access_logs').insert([log]).select().single();
      if (error) throw new Error(error.message);
      return data;
    } else {
      const logs = getLocalData<AccessLog>('parkly_access_logs');
      const newLog: AccessLog = { ...log, id: `log-${uuid()}`, created_at: new Date().toISOString() };
      logs.push(newLog);
      setLocalData('parkly_access_logs', logs);
      return newLog;
    }
  },

  // ==========================================
  // OVERSTAY WORKFLOWS
  // ==========================================
  async getOverstayEvents(userId?: string): Promise<OverstayEvent[]> {
    if (isRealSupabase && supabase) {
      let q = supabase.from('overstay_events').select('*, booking:bookings(*)');
      const { data, error } = await q.order('created_at', { ascending: false });
      if (error) return [];
      const list = data || [];
      if (userId) return list.filter(o => o.booking?.user_id === userId);
      return list;
    } else {
      const events = getLocalData<OverstayEvent>('parkly_overstay_events');
      const bookings = getLocalData<Booking>(KEYS.BOOKINGS);
      const enriched = events.map(e => ({
        ...e,
        booking: bookings.find(b => b.id === e.booking_id)
      }));
      if (userId) return enriched.filter(e => e.booking?.user_id === userId);
      return enriched;
    }
  },

  async createOverstayEvent(event: Omit<OverstayEvent, 'id' | 'created_at'>): Promise<OverstayEvent> {
    if (isRealSupabase && supabase) {
      const { data, error } = await supabase.from('overstay_events').insert([event]).select().single();
      if (error) throw new Error(error.message);
      return data;
    } else {
      const events = getLocalData<OverstayEvent>('parkly_overstay_events');
      const newEvent: OverstayEvent = { ...event, id: `overstay-${uuid()}`, created_at: new Date().toISOString() };
      events.push(newEvent);
      setLocalData('parkly_overstay_events', events);
      return newEvent;
    }
  },

  // ==========================================
  // FINANCIAL INVOICES
  // ==========================================
  async getInvoices(userId?: string): Promise<Invoice[]> {
    if (isRealSupabase && supabase) {
      const { data, error } = await supabase.from('invoices').select('*, booking:bookings(*)');
      if (error) return [];
      const list = data || [];
      if (userId) return list.filter(i => i.booking?.user_id === userId);
      return list;
    } else {
      const invoices = getLocalData<Invoice>('parkly_invoices');
      const bookings = getLocalData<Booking>(KEYS.BOOKINGS);
      const slots = getLocalData<ParkingSlot>(KEYS.SLOTS);
      const locations = getLocalData<ParkingLocation>(KEYS.LOCATIONS);
      const enriched = invoices.map(i => {
        const booking = bookings.find(b => b.id === i.booking_id);
        const slot = booking ? slots.find(s => s.id === booking.slot_id) : undefined;
        const location = slot ? locations.find(l => l.id === slot.location_id) : undefined;
        return {
          ...i,
          booking: booking ? { ...booking, slot, location } : undefined
        };
      });
      if (userId) return enriched.filter(i => i.booking?.user_id === userId);
      return enriched;
    }
  },

  async getInvoiceById(id: string): Promise<Invoice | null> {
    if (isRealSupabase && supabase) {
      const { data, error } = await supabase.from('invoices').select('*, booking:bookings(*, slot:parking_slots(*, location:parking_locations(*)))').eq('id', id).maybeSingle();
      if (error || !data) return null;
      return {
        ...data,
        booking: {
          ...data.booking,
          location: data.booking?.slot?.location
        }
      };
    } else {
      const invoices = await this.getInvoices();
      return invoices.find(i => i.id === id) || null;
    }
  },

  async createInvoice(invoice: Omit<Invoice, 'id' | 'created_at'>): Promise<Invoice> {
    if (isRealSupabase && supabase) {
      const { data, error } = await supabase.from('invoices').insert([invoice]).select().single();
      if (error) throw new Error(error.message);
      return data;
    } else {
      const invoices = getLocalData<Invoice>('parkly_invoices');
      const newInvoice: Invoice = { ...invoice, id: `inv-${uuid()}`, created_at: new Date().toISOString() };
      invoices.push(newInvoice);
      setLocalData('parkly_invoices', invoices);
      return newInvoice;
    }
  },

  // ==========================================
  // REVENUE PAYOUTS
  // ==========================================
  async getPayouts(ownerId?: string): Promise<Payout[]> {
    if (isRealSupabase && supabase) {
      let q = supabase.from('payouts').select('*');
      if (ownerId) q = q.eq('owner_id', ownerId);
      const { data, error } = await q.order('created_at', { ascending: false });
      if (error) return [];
      return data || [];
    } else {
      const payouts = getLocalData<Payout>('parkly_payouts');
      if (ownerId) return payouts.filter(p => p.owner_id === ownerId).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return payouts.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  },

  async requestPayout(ownerId: string, amount: number): Promise<Payout> {
    const transactionRef = 'PAY-' + Math.random().toString(36).substring(2, 9).toUpperCase();
    const payout: Omit<Payout, 'id' | 'created_at'> = {
      owner_id: ownerId,
      amount,
      status: 'COMPLETED',
      transaction_reference: transactionRef
    };
    if (isRealSupabase && supabase) {
      const { data, error } = await supabase.from('payouts').insert([payout]).select().single();
      if (error) throw new Error(error.message);
      return data;
    } else {
      const payouts = getLocalData<Payout>('parkly_payouts');
      const newPayout: Payout = { ...payout, id: `pay-${uuid()}`, created_at: new Date().toISOString() };
      payouts.push(newPayout);
      setLocalData('parkly_payouts', payouts);
      return newPayout;
    }
  },

  // ==========================================
  // RFID CREDENTIALS
  // ==========================================
  async getRfidCredentials(userId: string): Promise<RfidCredential[]> {
    if (isRealSupabase && supabase) {
      const { data, error } = await supabase.from('rfid_credentials').select('*, vehicle:vehicles(*)').eq('user_id', userId);
      if (error) return [];
      return data || [];
    } else {
      const rfids = getLocalData<RfidCredential>('parkly_rfid_credentials');
      const vehicles = getLocalData<Vehicle>(KEYS.VEHICLES);
      return rfids.filter(r => r.user_id === userId).map(r => ({
        ...r,
        vehicle: vehicles.find(v => v.id === r.vehicle_id)
      }));
    }
  },

  async addRfidCredential(rfid: Omit<RfidCredential, 'id' | 'created_at'>): Promise<RfidCredential> {
    if (isRealSupabase && supabase) {
      const { data, error } = await supabase.from('rfid_credentials').insert([rfid]).select().single();
      if (error) throw new Error(error.message);
      return data;
    } else {
      const rfids = getLocalData<RfidCredential>('parkly_rfid_credentials');
      if (rfids.some(r => r.rfid_uid === rfid.rfid_uid)) throw new Error('RFID Tag UID already registered.');
      const newRfid: RfidCredential = { ...rfid, id: `rfid-${uuid()}`, created_at: new Date().toISOString() };
      rfids.push(newRfid);
      setLocalData('parkly_rfid_credentials', rfids);
      return newRfid;
    }
  },

  async deleteRfidCredential(id: string): Promise<void> {
    if (isRealSupabase && supabase) {
      const { error } = await supabase.from('rfid_credentials').delete().eq('id', id);
      if (error) throw new Error(error.message);
    } else {
      const rfids = getLocalData<RfidCredential>('parkly_rfid_credentials');
      const filtered = rfids.filter(r => r.id !== id);
      setLocalData('parkly_rfid_credentials', filtered);
    }
  }
};
