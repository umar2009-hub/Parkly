// User Roles
export type UserRole = 'DRIVER' | 'OWNER' | 'ADMIN';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar_url?: string;
  is_suspended?: boolean;
  created_at: string;
}

// Vehicle Types
export type VehicleType = 'CAR' | 'SUV' | 'BIKE' | 'EV' | 'ACCESSIBLE';

export interface Vehicle {
  id: string;
  user_id: string;
  type: VehicleType;
  brand_model: string;
  registration_number: string;
  color: string;
  is_default: boolean;
  created_at: string;
}

// Parking Statuses
export type ParkingStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export interface ParkingLocation {
  id: string;
  owner_id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  description: string;
  opening_hours: {
    open: string; // e.g. "00:00"
    close: string; // e.g. "24:00"
  };
  amenities: string[]; // e.g. ["CCTV", "EV_CHARGER", "COVERED", "24_7", "WASHROOM", "ACCESSIBLE"]
  status: ParkingStatus;
  rejection_reason?: string;
  created_at: string;
}

// Slot Statuses
export type SlotStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';
export type SlotType = 'CAR' | 'SUV' | 'BIKE' | 'EV' | 'ACCESSIBLE';

export interface ParkingSlot {
  id: string;
  location_id: string;
  slot_number: string;
  floor: string;
  type: SlotType;
  price_per_hour: number;
  status: SlotStatus;
  created_at: string;
}

// Booking Statuses
export type BookingStatus = 'PENDING' | 'PENDING_ENTRY' | 'CONFIRMED' | 'ACTIVE' | 'PENDING_PAYMENT' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED' | 'REFUNDED';
export type BookingType = 'ADVANCE' | 'WALKIN';

export interface Booking {
  id: string;
  user_id: string;
  slot_id: string;
  vehicle_id: string;
  start_time: string; // ISO String
  end_time: string; // ISO String
  total_price: number;
  status: BookingStatus;
  qr_code_token: string; // e.g. "PKG-12AB3"
  booking_type: BookingType;
  entry_fee: number;
  exit_qr_token?: string;
  entry_scanned_at?: string;
  exit_scanned_at?: string;
  actual_entry_at?: string;
  actual_exit_at?: string;
  final_amount?: number;
  created_at: string;
  
  // Joined fields (for convenience in UI)
  slot?: ParkingSlot;
  location?: ParkingLocation;
  vehicle?: Vehicle;
  driver?: Profile;
}

// Payment Statuses
export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'SUCCESSFUL' | 'FAILED' | 'REFUNDED';

export interface Payment {
  id: string;
  booking_id: string;
  amount: number;
  status: PaymentStatus;
  payment_method: string;
  transaction_id: string;
  created_at: string;
}

export interface Review {
  id: string;
  booking_id: string;
  user_id: string;
  parking_id: string;
  rating: number; // 1-5
  comment: string;
  cleanliness: number; // 1-5
  security: number; // 1-5
  location: number; // 1-5
  created_at: string;
  
  // Joined field
  driver_name?: string;
  avatar_url?: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  parking_id: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
  is_read: boolean;
  created_at: string;
}

export interface Complaint {
  id: string;
  user_id: string;
  booking_id?: string;
  subject: string;
  description: string;
  category: string;
  status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'CLOSED';
  internal_notes?: string;
  created_at: string;
  
  // Joined fields
  driver_name?: string;
  driver_email?: string;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  actor_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata?: any;
  created_at: string;
}

// Pricing Rules config
export interface PricingRule {
  id: string;
  location_id: string;
  rule_name: string;
  is_enabled: boolean;
  min_price: number;
  max_price: number;
  occupancy_threshold_1: number; // e.g. 50
  multiplier_1: number; // e.g. 1.1 (+10%)
  occupancy_threshold_2: number; // e.g. 80
  multiplier_2: number; // e.g. 1.2 (+20%)
}

// Demand Forecast
export interface DemandForecast {
  location_id: string;
  hour: number; // 0-23
  expected_occupancy_pct: number; // 0-100
  demand_level: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface AccessLog {
  id: string;
  location_id: string;
  booking_id?: string;
  method: 'ANPR' | 'QR' | 'RFID' | 'MANUAL';
  event_type: 'ENTRY' | 'EXIT';
  result: 'GRANTED' | 'DENIED';
  plate_number?: string;
  rfid_uid?: string;
  reason?: string;
  created_at: string;
}

export interface OverstayEvent {
  id: string;
  booking_id: string;
  grace_period_minutes: number;
  overstay_minutes: number;
  additional_charge: number;
  status: 'PENDING' | 'PAID';
  created_at: string;
  
  // Joined fields
  booking?: Booking;
}

export interface Invoice {
  id: string;
  booking_id: string;
  invoice_number: string;
  base_amount: number;
  overstay_amount: number;
  total_amount: number;
  status: 'UNPAID' | 'PAID' | 'REFUNDED';
  created_at: string;

  // Joined fields
  booking?: Booking;
}

export interface Payout {
  id: string;
  owner_id: string;
  amount: number;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  transaction_reference: string;
  created_at: string;
}

export interface RfidCredential {
  id: string;
  user_id: string;
  vehicle_id: string;
  rfid_uid: string;
  created_at: string;
  
  // Joined fields
  vehicle?: Vehicle;
}
