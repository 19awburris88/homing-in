# Homing In

A private house-hunting app for touring, rating, and comparing open houses —
with neighborhood insights pulled in automatically. Built for Austin & Adrienne.

## Features

- **Gallery** — house cards grouped by tour date, with a 5-category rating system,
  notes, price/sqft stats, and photos.
- **Tour Day** — a time-sorted checklist for the day of, with "up next" and
  copy-addresses.
- **Compare** — side-by-side table across any set of houses, with an automatic winner.
- **Area info** (tap a house's photo):
  - Income & demographics — median income, home value, education (US Census)
  - Walkability + nearby amenities (OpenStreetMap)
  - Nearby schools with distances
  - Drive time to Children's Medical Center Dallas
- **Add a house** — manual entry, paste an image link, or import from a Redfin listing URL.
- **Cloud sync** — optional; a shared list synced across devices behind a login.
  Runs local/browser-only until Supabase keys are added.

## Stack

React 19 + Vite. Optional Supabase (Postgres + Auth) for cloud sync. Area lookups
run through a small server function (Vite middleware in dev; a Supabase Edge
Function in production).

## Setup

```bash
npm install
cp .env.example .env.local   # fill in keys (all optional — blank = local mode)
npm run dev
```

- **Census key** (free) unlocks income/demographics — https://api.census.gov/data/key_signup.html
- **Supabase** turns on cloud sync + login — see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

With no keys set, the app runs fully in local/browser-only mode.

## Scripts

- `npm run dev` — dev server
- `npm run build` — production build
- `npm run preview` — preview the build
- `npm run lint` — lint
