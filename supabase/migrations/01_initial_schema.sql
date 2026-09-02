-- Create Custom Types and Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist"; -- Required for GIST range/exclusion constraints

-- 1. PROFILES Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('DRIVER', 'OWNER', 'ADMIN')),
    avatar_url TEXT,
    is_suspended BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. VEHICLES Table
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('CAR', 'SUV', 'BIKE', 'EV', 'ACCESSIBLE')),
    brand_model TEXT NOT NULL,
    registration_number TEXT NOT NULL,
    color TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexing vehicles by user
CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON public.vehicles(user_id);

-- 3. PARKING LOCATIONS Table
CREATE TABLE IF NOT EXISTS public.parking_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    description TEXT NOT NULL,
    opening_hours JSONB NOT NULL DEFAULT '{"open": "00:00", "close": "24:00"}'::jsonb,
    amenities TEXT[] NOT NULL DEFAULT '{}'::text[],
    status TEXT NOT NULL DEFAULT 'PENDING_REVIEW' CHECK (status IN ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED')),
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexing geo-coordinates and owners
CREATE INDEX IF NOT EXISTS idx_parking_locations_owner ON public.parking_locations(owner_id);
CREATE INDEX IF NOT EXISTS idx_parking_locations_status ON public.parking_locations(status);

-- 4. PARKING SLOTS Table
CREATE TABLE IF NOT EXISTS public.parking_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID NOT NULL REFERENCES public.parking_locations(id) ON DELETE CASCADE,
    slot_number TEXT NOT NULL,
    floor TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('CAR', 'SUV', 'BIKE', 'EV', 'ACCESSIBLE')),
    price_per_hour NUMERIC(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(location_id, slot_number)
);

CREATE INDEX IF NOT EXISTS idx_parking_slots_location ON public.parking_slots(location_id);
CREATE INDEX IF NOT EXISTS idx_parking_slots_status ON public.parking_slots(status);

-- 5. BOOKINGS Table
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    slot_id UUID NOT NULL REFERENCES public.parking_slots(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    total_price NUMERIC(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PENDING_ENTRY', 'CONFIRMED', 'ACTIVE', 'PENDING_PAYMENT', 'COMPLETED', 'CANCELLED', 'EXPIRED', 'REFUNDED')),
    qr_code_token TEXT UNIQUE NOT NULL,
    booking_type TEXT NOT NULL DEFAULT 'ADVANCE' CHECK (booking_type IN ('ADVANCE', 'WALKIN')),
    entry_fee NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    exit_qr_token TEXT UNIQUE,
    entry_scanned_at TIMESTAMP WITH TIME ZONE,
    exit_scanned_at TIMESTAMP WITH TIME ZONE,
    actual_entry_at TIMESTAMP WITH TIME ZONE,
    actual_exit_at TIMESTAMP WITH TIME ZONE,
    final_amount NUMERIC(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT chk_times CHECK (start_time < end_time)
);

CREATE INDEX IF NOT EXISTS idx_bookings_user ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_slot ON public.bookings(slot_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_times ON public.bookings(start_time, end_time);

-- STRICT CONCURRENCY CONSTRAINT
-- This prevents the same slot from being booked for overlapping times.
-- status IN ('CONFIRMED', 'ACTIVE', 'PENDING')
-- Excludes duplicate bookings for the same slot when status is active.
ALTER TABLE public.bookings ADD CONSTRAINT no_overlapping_bookings
EXCLUDE USING gist (
  slot_id WITH =,
  tstzrange(start_time, end_time) WITH &&
) WHERE (status IN ('CONFIRMED', 'ACTIVE', 'PENDING'));

-- 6. PAYMENTS Table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'SUCCESSFUL', 'FAILED', 'REFUNDED')),
    payment_method TEXT NOT NULL,
    transaction_id TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. REVIEWS Table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    parking_id UUID NOT NULL REFERENCES public.parking_locations(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    cleanliness INTEGER NOT NULL CHECK (cleanliness >= 1 AND cleanliness <= 5),
    security INTEGER NOT NULL CHECK (security >= 1 AND security <= 5),
    location INTEGER NOT NULL CHECK (location >= 1 AND location <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. FAVORITES Table
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    parking_id UUID NOT NULL REFERENCES public.parking_locations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, parking_id)
);

-- 9. NOTIFICATIONS Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('INFO', 'SUCCESS', 'WARNING', 'ALERT')),
    is_read BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read);

-- 10. COMPLAINTS Table
CREATE TABLE IF NOT EXISTS public.complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_REVIEW', 'RESOLVED', 'CLOSED')),
    internal_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. AUDIT LOGS Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    actor_name TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security (RLS) Configuration Example
-- All tables are secure under PostgreSQL RLS by default.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Table Policies
CREATE POLICY "Allow public read access to profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow profile insertion during signup" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update to own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Vehicles Table Policies
CREATE POLICY "Allow user all access to own vehicles" ON public.vehicles FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. Parking Locations Table Policies
CREATE POLICY "Allow public read access to approved locations" ON public.parking_locations FOR SELECT USING (
  status = 'APPROVED' 
  OR auth.uid() = owner_id 
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
);
CREATE POLICY "Allow owner insert access to locations" ON public.parking_locations FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Allow owner or admin update/delete access to locations" ON public.parking_locations FOR ALL USING (
  auth.uid() = owner_id 
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
) WITH CHECK (
  auth.uid() = owner_id 
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
);

-- 4. Parking Slots Table Policies
CREATE POLICY "Allow public read access to slots" ON public.parking_slots FOR SELECT USING (true);
CREATE POLICY "Allow owner all access to slots" ON public.parking_slots FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.parking_locations 
    WHERE id = location_id AND owner_id = auth.uid()
  )
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
);

-- 5. Bookings Table Policies
CREATE POLICY "Allow users to read own bookings" ON public.bookings FOR SELECT USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.parking_slots s
    JOIN public.parking_locations l ON s.location_id = l.id
    WHERE s.id = slot_id AND l.owner_id = auth.uid()
  )
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
);
CREATE POLICY "Allow driver to insert own bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow users or location owners to update bookings" ON public.bookings FOR UPDATE USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.parking_slots s
    JOIN public.parking_locations l ON s.location_id = l.id
    WHERE s.id = slot_id AND l.owner_id = auth.uid()
  )
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
);

-- 6. Payments Table Policies
CREATE POLICY "Allow users or owners to read payments" ON public.payments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = booking_id AND (
      b.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.parking_slots s
        JOIN public.parking_locations l ON s.location_id = l.id
        WHERE s.id = b.slot_id AND l.owner_id = auth.uid()
      )
    )
  )
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
);
CREATE POLICY "Allow driver to insert payments" ON public.payments FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = booking_id AND b.user_id = auth.uid()
  )
);

-- 7. Reviews Table Policies
CREATE POLICY "Allow public read access to reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Allow driver to insert reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow driver to edit own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);

-- 8. Favorites Table Policies
CREATE POLICY "Allow users to manage own favorites" ON public.favorites FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 9. Notifications Table Policies
CREATE POLICY "Allow users to manage own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 10. Complaints Table Policies
CREATE POLICY "Allow users to manage own complaints" ON public.complaints FOR ALL USING (
  auth.uid() = user_id 
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
) WITH CHECK (
  auth.uid() = user_id 
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
);

-- 11. Audit Logs Table Policies
CREATE POLICY "Allow authenticated users to read audit logs" ON public.audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
);
CREATE POLICY "Allow logging audits" ON public.audit_logs FOR INSERT WITH CHECK (true);


-- RPC function to handle double-booking exclusion atomic transaction checks
CREATE OR REPLACE FUNCTION public.create_booking_atomic(
  p_user_id UUID,
  p_slot_id UUID,
  p_vehicle_id UUID,
  p_start_time TIMESTAMP WITH TIME ZONE,
  p_end_time TIMESTAMP WITH TIME ZONE,
  p_payment_method TEXT,
  p_booking_type TEXT DEFAULT 'ADVANCE',
  p_entry_fee NUMERIC DEFAULT 0.00
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_price_per_hour NUMERIC(10,2);
  v_duration_hours NUMERIC;
  v_total_price NUMERIC(10,2);
  v_booking_id UUID;
  v_qr_token TEXT;
  v_overlap BOOLEAN;
  v_slot_status TEXT;
  v_booking_record RECORD;
BEGIN
  -- 1. Check if slot status is MAINTENANCE
  SELECT status, price_per_hour INTO v_slot_status, v_price_per_hour 
  FROM public.parking_slots 
  WHERE id = p_slot_id;

  IF v_slot_status = 'MAINTENANCE' THEN
    RAISE EXCEPTION 'This slot is currently under maintenance.';
  END IF;

  -- 2. Check for overlapping bookings (P0 Concurrency Exclusion check)
  SELECT EXISTS (
    SELECT 1 FROM public.bookings
    WHERE slot_id = p_slot_id
      AND status IN ('CONFIRMED', 'ACTIVE', 'PENDING')
      AND p_start_time < end_time 
      AND p_end_time > start_time
  ) INTO v_overlap;

  IF v_overlap THEN
    RAISE EXCEPTION 'This parking slot was just reserved by another user. Please choose another slot.';
  END IF;

  -- 2b. Check if the same vehicle is already booked elsewhere for this time
  SELECT EXISTS (
    SELECT 1 FROM public.bookings
    WHERE vehicle_id = p_vehicle_id
      AND status IN ('CONFIRMED', 'ACTIVE', 'PENDING', 'PENDING_ENTRY', 'PENDING_PAYMENT')
      AND p_start_time < end_time 
      AND p_end_time > start_time
  ) INTO v_overlap;

  IF v_overlap THEN
    RAISE EXCEPTION 'This vehicle is already booked for another parking slot during this time period.';
  END IF;

  -- 3. Calculate pricing
  v_duration_hours := EXTRACT(EPOCH FROM (p_end_time - p_start_time)) / 3600;
  IF v_duration_hours <= 0 THEN
    RAISE EXCEPTION 'Invalid duration. Arrival must be before checkout.';
  END IF;

  v_total_price := CEIL(v_duration_hours * v_price_per_hour);

  -- 4. Generate random unique pass token (e.g. PKG-XXXXX)
  v_qr_token := 'PKG-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 5));

  -- 5. Insert new Booking
  INSERT INTO public.bookings (
    user_id,
    slot_id,
    vehicle_id,
    start_time,
    end_time,
    total_price,
    status,
    qr_code_token,
    booking_type,
    entry_fee
  ) VALUES (
    p_user_id,
    p_slot_id,
    p_vehicle_id,
    p_start_time,
    p_end_time,
    v_total_price,
    CASE WHEN p_booking_type = 'WALKIN' THEN 'PENDING_ENTRY' ELSE 'CONFIRMED' END,
    v_qr_token,
    p_booking_type,
    p_entry_fee
  ) RETURNING id INTO v_booking_id;

  -- 6. Insert new Payment
  INSERT INTO public.payments (
    booking_id,
    amount,
    status,
    payment_method,
    transaction_id
  ) VALUES (
    v_booking_id,
    CASE WHEN p_booking_type = 'WALKIN' THEN p_entry_fee ELSE v_total_price END,
    'SUCCESSFUL',
    p_payment_method,
    'TXN-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8))
  );

  -- 7. Update slot status to RESERVED
  UPDATE public.parking_slots 
  SET status = 'RESERVED' 
  WHERE id = p_slot_id;

  -- 8. Fetch and return the newly created booking record joined with slot info
  SELECT 
    b.id,
    b.user_id,
    b.slot_id,
    b.vehicle_id,
    b.start_time,
    b.end_time,
    b.total_price,
    b.status,
    b.qr_code_token,
    b.booking_type,
    b.entry_fee,
    b.created_at
  INTO v_booking_record
  FROM public.bookings b
  WHERE b.id = v_booking_id;

  RETURN row_to_json(v_booking_record)::jsonb;
END;
$$;


-- ==========================================
-- EXTENDED SCHEMA TABLES (SECTION 6)
-- ==========================================

-- 12. ACCESS LOGS Table
CREATE TABLE IF NOT EXISTS public.access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID REFERENCES public.parking_locations(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    method TEXT CHECK (method IN ('ANPR', 'QR', 'RFID', 'MANUAL')),
    event_type TEXT CHECK (event_type IN ('ENTRY', 'EXIT')),
    result TEXT CHECK (result IN ('GRANTED', 'DENIED')),
    plate_number TEXT,
    rfid_uid TEXT,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_access_logs_location ON public.access_logs(location_id);
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to location owners" ON public.access_logs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.parking_locations l
    WHERE l.id = location_id AND l.owner_id = auth.uid()
  )
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
);
CREATE POLICY "Allow insertions of access logs" ON public.access_logs FOR INSERT WITH CHECK (true);

-- 13. OVERSTAY EVENTS Table
CREATE TABLE IF NOT EXISTS public.overstay_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    grace_period_minutes INTEGER NOT NULL,
    overstay_minutes INTEGER NOT NULL,
    additional_charge NUMERIC(10,2) NOT NULL,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.overstay_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read to owners, drivers and admins" ON public.overstay_events FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = booking_id AND (
      b.user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.parking_slots s
        JOIN public.parking_locations l ON s.location_id = l.id
        WHERE s.id = b.slot_id AND l.owner_id = auth.uid()
      )
    )
  )
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
);
CREATE POLICY "Allow inserts on overstay_events" ON public.overstay_events FOR INSERT WITH CHECK (true);

-- 14. PRICING RULES Table
CREATE TABLE IF NOT EXISTS public.pricing_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID NOT NULL UNIQUE REFERENCES public.parking_locations(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT false NOT NULL,
    min_price NUMERIC(10,2) NOT NULL,
    max_price NUMERIC(10,2) NOT NULL,
    occupancy_threshold_1 NUMERIC(5,2) NOT NULL DEFAULT 50.00,
    multiplier_1 NUMERIC(5,2) NOT NULL DEFAULT 1.10,
    occupancy_threshold_2 NUMERIC(5,2) NOT NULL DEFAULT 80.00,
    multiplier_2 NUMERIC(5,2) NOT NULL DEFAULT 1.20,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow select on pricing_rules" ON public.pricing_rules FOR SELECT USING (true);
CREATE POLICY "Allow owner manage on pricing_rules" ON public.pricing_rules FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.parking_locations l
    WHERE l.id = location_id AND l.owner_id = auth.uid()
  )
);

-- 15. INVOICES Table
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
    invoice_number TEXT UNIQUE NOT NULL,
    base_amount NUMERIC(10,2) NOT NULL,
    overstay_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'UNPAID' CHECK (status IN ('UNPAID', 'PAID', 'REFUNDED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read on invoices" ON public.invoices FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = booking_id AND (
      b.user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.parking_slots s
        JOIN public.parking_locations l ON s.location_id = l.id
        WHERE s.id = b.slot_id AND l.owner_id = auth.uid()
      )
    )
  )
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
);
CREATE POLICY "Allow insert/update on invoices" ON public.invoices FOR ALL USING (true);

-- 16. PAYOUTS Table
CREATE TABLE IF NOT EXISTS public.payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'PROCESSING' CHECK (status IN ('PROCESSING', 'COMPLETED', 'FAILED')),
    transaction_reference TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow owners or admins to select own payouts" ON public.payouts FOR SELECT USING (
  auth.uid() = owner_id
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
);
CREATE POLICY "Allow inserts on payouts" ON public.payouts FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Allow update on payouts" ON public.payouts FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
);

-- 17. RFID CREDENTIALS Table
CREATE TABLE IF NOT EXISTS public.rfid_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL UNIQUE REFERENCES public.vehicles(id) ON DELETE CASCADE,
    rfid_uid TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.rfid_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read on rfid_credentials" ON public.rfid_credentials FOR SELECT USING (true);
CREATE POLICY "Allow manage own rfid" ON public.rfid_credentials FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

