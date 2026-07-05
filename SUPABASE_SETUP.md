# Homing In — Supabase setup (one-time, ~10 minutes)

Nothing breaks while you do this. The app stays in local mode until step 5.
Follow these in order. Where it says **paste**, use the files already in this repo.

---

## 1. Create the project
1. Go to **https://supabase.com** → sign in (free) → **New project**.
2. Name: `homing-in`. Set a **database password** (save it somewhere — you rarely need it).
3. Region: pick **East US** or **Central US** (closest to Dallas).
4. Click **Create** and wait ~2 minutes for it to finish setting up.

## 2. Create the database table
1. Left sidebar → **SQL Editor** → **New query**.
2. Open the file **`sql/schema.sql`** in this repo, copy everything, paste it in.
3. Click **Run**. You should see "Success". (Safe to run again if unsure.)

## 3. Create your 3 login accounts
1. Left sidebar → **Authentication** → **Users** → **Add user** → **Create new user**.
2. Enter an **email** and **password**. ✅ **Check "Auto Confirm User"** (so login works right away).
3. Click **Create user**. Repeat for all 3 people (you, Adrienne, +1).

*(Optional but recommended for privacy: Authentication → Sign In / Providers → Email →
turn OFF "Allow new users to sign up". Only your 3 admin accounts will exist.)*

## 4. Copy your two keys
1. Left sidebar → **Settings** (gear) → **API**.
2. Copy the **Project URL** (looks like `https://abcdxyz.supabase.co`).
3. Copy the **anon public** key (a long string; newer projects may label it **Publishable key**).

## 5. Turn it on
1. Open **`.env.local`** in this repo and paste your two values:
   ```
   VITE_SUPABASE_URL=https://abcdxyz.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...your-long-anon-key...
   ```
2. Restart the dev server: stop it (Ctrl-C) and run `npm run dev` again.
3. Reload the app — you'll now see a **login screen**. Sign in with one of your 3 accounts. 🎉

The house list is now shared and synced across every device you log in on.

---

### Notes
- The **anon key is meant to be public** — it's safe in the browser. Row Level Security
  (set up by the SQL) blocks anyone who isn't signed in.
- Your first sign-in starts with an **empty list** (the 4 sample houses only show in local
  mode). Add your real houses and they'll sync everywhere.
- The **Census key** stays in `.env.local` for now (dev). When we deploy, it moves to a
  server-side secret so it's never exposed.
