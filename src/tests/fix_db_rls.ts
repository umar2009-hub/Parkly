import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres:parkly26proj@db.xcyamisqmczyvtyofwvs.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL database.');

    const sql = `
      -- 1. Profiles Table Policies
      DROP POLICY IF EXISTS "Allow public read access to profiles" ON public.profiles;
      DROP POLICY IF EXISTS "Allow profile insertion during signup" ON public.profiles;
      DROP POLICY IF EXISTS "Allow update to own profile" ON public.profiles;
      CREATE POLICY "Allow public read access to profiles" ON public.profiles FOR SELECT USING (true);
      CREATE POLICY "Allow profile insertion during signup" ON public.profiles FOR INSERT WITH CHECK (true);
      CREATE POLICY "Allow update to own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

      -- 2. Vehicles Table Policies
      DROP POLICY IF EXISTS "Allow user all access to own vehicles" ON public.vehicles;
      CREATE POLICY "Allow user all access to own vehicles" ON public.vehicles FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

      -- 3. Parking Locations Table Policies
      DROP POLICY IF EXISTS "Allow public read access to approved locations" ON public.parking_locations;
      DROP POLICY IF EXISTS "Allow owner insert access to locations" ON public.parking_locations;
      DROP POLICY IF EXISTS "Allow owner update/delete access to locations" ON public.parking_locations;
      CREATE POLICY "Allow public read access to approved locations" ON public.parking_locations FOR SELECT USING (status = 'APPROVED' OR auth.uid() = owner_id);
      CREATE POLICY "Allow owner insert access to locations" ON public.parking_locations FOR INSERT WITH CHECK (auth.uid() = owner_id);
      CREATE POLICY "Allow owner update/delete access to locations" ON public.parking_locations FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

      -- 4. Parking Slots Table Policies
      DROP POLICY IF EXISTS "Allow public read access to slots" ON public.parking_slots;
      DROP POLICY IF EXISTS "Allow owner all access to slots" ON public.parking_slots;
      CREATE POLICY "Allow public read access to slots" ON public.parking_slots FOR SELECT USING (true);
      CREATE POLICY "Allow owner all access to slots" ON public.parking_slots FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.parking_locations 
          WHERE id = location_id AND owner_id = auth.uid()
        )
      );

      -- 5. Bookings Table Policies
      DROP POLICY IF EXISTS "Allow users to read own bookings" ON public.bookings;
      DROP POLICY IF EXISTS "Allow driver to insert own bookings" ON public.bookings;
      DROP POLICY IF EXISTS "Allow users or location owners to update bookings" ON public.bookings;
      CREATE POLICY "Allow users to read own bookings" ON public.bookings FOR SELECT USING (
        auth.uid() = user_id OR EXISTS (
          SELECT 1 FROM public.parking_slots s
          JOIN public.parking_locations l ON s.location_id = l.id
          WHERE s.id = slot_id AND l.owner_id = auth.uid()
        )
      );
      CREATE POLICY "Allow driver to insert own bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
      CREATE POLICY "Allow users or location owners to update bookings" ON public.bookings FOR UPDATE USING (
        auth.uid() = user_id OR EXISTS (
          SELECT 1 FROM public.parking_slots s
          JOIN public.parking_locations l ON s.location_id = l.id
          WHERE s.id = slot_id AND l.owner_id = auth.uid()
        )
      );
      DROP POLICY IF EXISTS "Allow users to delete own bookings" ON public.bookings;
      CREATE POLICY "Allow users to delete own bookings" ON public.bookings FOR DELETE USING (auth.uid() = user_id);

      -- 6. Payments Table Policies
      DROP POLICY IF EXISTS "Allow users or owners to read payments" ON public.payments;
      DROP POLICY IF EXISTS "Allow driver to insert payments" ON public.payments;
      DROP POLICY IF EXISTS "Allow users to update own payments" ON public.payments;
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
      );
      CREATE POLICY "Allow driver to insert payments" ON public.payments FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.bookings b
          WHERE b.id = booking_id AND b.user_id = auth.uid()
        )
      );
      CREATE POLICY "Allow users to update own payments" ON public.payments FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM public.bookings b
          WHERE b.id = booking_id AND b.user_id = auth.uid()
        )
      );

      -- Extra: Allow Drivers to update slots they have booked
      DROP POLICY IF EXISTS "Allow drivers to update booked slots" ON public.parking_slots;
      CREATE POLICY "Allow drivers to update booked slots" ON public.parking_slots FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM public.bookings b 
          WHERE b.slot_id = parking_slots.id AND b.user_id = auth.uid()
        )
      );

      -- 7. Reviews Table Policies
      DROP POLICY IF EXISTS "Allow public read access to reviews" ON public.reviews;
      DROP POLICY IF EXISTS "Allow driver to insert reviews" ON public.reviews;
      DROP POLICY IF EXISTS "Allow driver to edit own reviews" ON public.reviews;
      CREATE POLICY "Allow public read access to reviews" ON public.reviews FOR SELECT USING (true);
      CREATE POLICY "Allow driver to insert reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
      CREATE POLICY "Allow driver to edit own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);

      -- 8. Favorites Table Policies
      DROP POLICY IF EXISTS "Allow users to manage own favorites" ON public.favorites;
      CREATE POLICY "Allow users to manage own favorites" ON public.favorites FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

      -- 9. Notifications Table Policies
      DROP POLICY IF EXISTS "Allow users to manage own notifications" ON public.notifications;
      CREATE POLICY "Allow users to manage own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

      -- 10. Complaints Table Policies
      DROP POLICY IF EXISTS "Allow users to manage own complaints" ON public.complaints;
      CREATE POLICY "Allow users to manage own complaints" ON public.complaints FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

      -- 11. Audit Logs Table Policies
      DROP POLICY IF EXISTS "Allow authenticated users to read audit logs" ON public.audit_logs;
      DROP POLICY IF EXISTS "Allow logging audits" ON public.audit_logs;
      CREATE POLICY "Allow authenticated users to read audit logs" ON public.audit_logs FOR SELECT USING (true);
      CREATE POLICY "Allow logging audits" ON public.audit_logs FOR INSERT WITH CHECK (true);
    `;

    console.log('Applying RLS policies...');
    await client.query(sql);
    console.log('RLS policies applied successfully!');

  } catch (err: any) {
    console.error('Database query failed:', err.message);
  } finally {
    await client.end();
  }
}

run();
