# Parkly — Find a spot. Park smartly.

Parkly is a smart mobility parking marketplace and real-time reservation SaaS platform. It connects drivers looking for parking spaces with property owners who want to rent out empty driveways, garages, apartment slots, or commercial parking bays. It also provides a supervisory console for system administrators.

---

## 1. Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, React Router DOM, Lucide Icons
- **Visuals & Charts**: Leaflet (with OpenStreetMap tiles) for dark interactive maps, Recharts for financial and occupancy analytics
- **Backend & Database**: Supabase (PostgreSQL, Row Level Security, Auth modules, SQL migrations)
- **Utilities**: `qrcode.react` (pass generation), `canvas-confetti` (payout and booking animations), Zod (form validation)

---

## 2. Core Architecture: Dual Database Adapter Mode

Parkly implements a **Service Adapter Pattern** to decouple the React UI components from database-specific clients.

- **Supabase Cloud Mode**: Uses the live `@supabase/supabase-js` client for cloud database storage, real-time subscriptions, and authentication.
- **Local Emulation Mode (Default)**: If `VITE_SUPABASE_URL` is omitted, the application runs entirely client-side using a browser `localStorage` engine. This engine simulates session persistence, role permissions, check-in QR scanner operations, dynamic dynamic pricing, and concurrent booking exclusion logic.

---

## 3. Pre-Seeded Demo Accounts

To test the application immediately with zero configuration, use the following pre-loaded accounts:

| Role | Username / Email | Password | Seeded Profile Name |
|---|---|---|---|
| **Driver** | `driver@parkly.com` | `password` | Rahul Sharma (KA-03 Nexon EV) |
| **Owner** | `owner@parkly.com` | `password` | Ananya Patel (Metro Plaza MG Road) |
| **Admin** | `admin@parkly.com` | `password` | Vikram Singh (Superuser Console) |

---

## 4. Key Database Schema

The database schema is organized around the following relation tables:

1. **`profiles`**: User profiles with roles (`DRIVER`, `OWNER`, `ADMIN`).
2. **`vehicles`**: Driver vehicles details (registration codes, colors, EV chargers compatibility).
3. **`parking_locations`**: Listings details, geopoints coordinates, status flags (`PENDING_REVIEW`, `APPROVED`).
4. **`parking_slots`**: Individual bays mapped to locations with floor coordinates and statuses (`AVAILABLE`, `RESERVED`, `OCCUPIED`).
5. **`bookings`**: Reservations logs checking overlap constraints.
6. **`payments`**: Transaction records auditing gross revenue and platform fee deductions.
7. **`reviews`**: Ratings categories feedback (Cleanliness, Security, Location).
8. **`favorites`**: Saved parking shortcuts.
9. **`complaints`**: Dispute solver tickets queue.
10. **`audit_logs`**: Platform activity logs auditing logins, status overrides, and listings approvals.

## Admin secret key
PARKLY-ADMIN-2026

### Concurrency Protection Exclusion Check (PostgreSQL)

Overlapping bookings for the same slot are strictly prohibited at the database level using an exclusion constraint:

```sql
ALTER TABLE public.bookings ADD CONSTRAINT no_overlapping_bookings
EXCLUDE USING gist (
  slot_id WITH =,
  tstzrange(start_time, end_time) WITH &&
) WHERE (status IN ('CONFIRMED', 'ACTIVE', 'PENDING'));
```

---

## 5. Local Setup Instructions

Ensure you have [Node.js](https://nodejs.org/) installed (v18+ recommended).

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Run Automated Tests
Execute the integration test suite to verify auth rules, pricing checks, and overlap exclusions:
```bash
npx tsx src/tests/run_tests.ts
```

### 4. Build for Production
```bash
npm run build
```

---

## 6. Supabase Deployment Setup

To connect a live Supabase PostgreSQL database:

1. Create a new project on [Supabase Console](https://supabase.com/).
2. Run the migration SQL code located inside [supabase/migrations/01_initial_schema.sql](supabase/migrations/01_initial_schema.sql) in your Supabase SQL Editor.
3. Configure the following keys in your `.env` file in the project root:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
4. Restart the development server. The application will automatically connect to Supabase Cloud.

<!-- db paa
parkly26proj -->
