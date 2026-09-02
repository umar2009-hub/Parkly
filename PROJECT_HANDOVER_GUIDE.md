# Parkly: Complete Project Handover & Setup Guide

This document is a complete guide to transferring ownership of the Parkly project to another person or PC, setting it up locally, configuring the database, and hosting it on Vercel. It also includes specific troubleshooting steps for the exact problems we encountered during development.

---

## Part 1: Transferring Ownership

To fully hand over this project, you need to transfer three accounts/projects:

### 1. GitHub Repository Transfer
1. Go to your repository on GitHub (`umar2009-hub/Parkly`).
2. Navigate to **Settings** > **General**.
3. Scroll down to the **Danger Zone** at the very bottom.
4. Click **Transfer ownership**.
5. Enter the new owner''s GitHub username and confirm. The new owner will receive an email to accept the transfer.

### 2. Vercel Hosting Transfer
*Note: Vercel projects are tied to GitHub repositories. It is easiest for the new owner to just import the transferred GitHub repo into their own Vercel account.*
1. The new owner logs into Vercel and clicks **Add New...** > **Project**.
2. They select the newly transferred `Parkly` GitHub repository.
3. They follow the deployment steps in **Part 4** below. 
4. Once their deployment is live, you can delete the project from your Vercel account.

### 3. Supabase (Database) Transfer
1. Go to your Supabase project dashboard.
2. Navigate to **Project Settings** > **General**.
3. Scroll to **Transfer Project** and select the new owner''s organization. 
*(Alternatively, the new owner can just create a brand new Supabase project and run the SQL schema file we have in the codebase).*

---

## Part 2: Setting up on a New PC

If you or the new owner are setting this up on a fresh computer, follow these steps:

### Prerequisites
- Install **Git**.
- Install **Node.js** (v18 or higher recommended).
- A code editor like **VS Code**.

### Installation Steps
1. **Clone the repository:**
   ```bash
   git clone https://github.com/new-owner-username/Parkly.git
   cd Parkly
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Start the local development server:**
   ```bash
   npm run dev
   ```
4. **Access the app:** Open `http://localhost:5173` in your browser.

> **Note**: By default, if no Supabase environment variables are provided, Parkly will run in **Local Emulation Mode**. This means it uses your browser''s `LocalStorage` as a database. It''s great for quick UI testing, but **data will not sync between different devices or browsers**.

---

## Part 3: Setting up the Real Database (Supabase)

To get real-time cross-device syncing (like the exit QR popup showing on a driver''s phone when an owner scans it), you must use a real database.

1. Go to [Supabase](https://supabase.com) and create a new project.
2. Once the project is created, go to the **SQL Editor** on the left sidebar.
3. Click **New Query**.
4. Open the file `supabase/migrations/01_initial_schema.sql` from your codebase, copy all the text, paste it into the Supabase SQL editor, and hit **Run**.
   * **Why this is critical:** We ran into an issue where just providing the API keys wasn''t enough. If you don''t run this SQL file, the database tables don''t exist, and the app will break or fail to log you in.
5. Go to **Project Settings** > **API**.
6. Copy your **Project URL** and your **anon `public` API Key**.

---

## Part 4: Hosting on Vercel

When the new owner imports the project into Vercel, they need to configure it correctly:

1. **Framework Preset:** Vercel should automatically detect **Vite**.
2. **Build Command:** `npm run build`
3. **Output Directory:** `dist`
4. **Environment Variables:** 
   Add the following variables using the keys you got from Supabase:
   - `VITE_SUPABASE_URL` = `your_supabase_project_url`
   - `VITE_SUPABASE_ANON_KEY` = `your_supabase_anon_key`

> **WARNING - Vite Environment Variable "Baking"**
> We discovered that Vite permanently "bakes" environment variables into the code during the Build phase. If you add these variables *after* deploying, the live app won''t see them! **Solution:** Whenever you add or change an environment variable in Vercel, you MUST manually trigger a **Redeploy** so Vercel can rebuild the app with the new keys.

---

## Part 5: Solutions to Problems Encountered

Here is a quick cheat-sheet of the specific bugs we fixed, so the new owner understands how the system works:

### 1. The Vercel 404 "Not Found" Error on Refresh
**The Problem:** When refreshing a page like `/admin/signup`, Vercel showed a 404 error because it''s a Single Page Application (SPA).
**The Solution:** We added a `vercel.json` file to the root of the project that rewrites all traffic back to `index.html`. This file is already in the codebase, so the new owner won''t have this issue, but they should not delete this file!

### 2. The Real-time Popup Not Showing on Mobile
**The Problem:** Testing the Owner scanner on a PC did not trigger the checkout popup on the Driver''s phone.
**The Solution:** This happens if the app is falling back to Local Emulation mode (meaning the environment variables aren''t working). LocalStorage doesn''t sync across devices. Ensure the Supabase keys are in Vercel and **redeploy**.

### 3. Walk-in Checkout Popup Not Appearing
**The Problem:** Scanning an exit QR for a walk-in immediately granted exit without asking for payment.
**The Solution:** This was a math feature, not a bug! We had set a 5 Rs entry fee. Because we checked out only 1 minute later, the total time cost was less than the 5 Rs already paid. Since the driver owed 0 Rs, no payment popup was needed. We temporarily set the entry fee back to `0.00` in `createWalkinBooking` so testing the popup is easier.

### 4. Secure Admin Registration
**The Problem:** The secret key to register an admin account cannot be hardcoded in the frontend React bundle, as anyone could find it.
**The Solution:** We moved the validation to the server side (Edge functions / secure DB logic) and decoupled the secret from the `.env` variables that get prefixed with `VITE_`.

---

## Summary Checklist for the New Owner
- [ ] Accept GitHub Transfer
- [ ] Clone to PC and `npm install`
- [ ] Create a Supabase Project and run `01_initial_schema.sql`
- [ ] Import repo to Vercel
- [ ] Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to Vercel Environment Variables
- [ ] Deploy!
