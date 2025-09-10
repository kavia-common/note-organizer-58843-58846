# Supabase Integration Guide for Notes Frontend

This app can sync notes with a Supabase Postgres database using `@supabase/supabase-js`.

## Environment variables

Create `notes_frontend/.env` using the template:

- REACT_APP_SUPABASE_URL: Your Supabase project URL
- REACT_APP_SUPABASE_ANON_KEY: Public anon key (from Project Settings -> API)
- REACT_APP_SITE_URL: App URL (optional, used for auth redirect if added later)

Important: The app expects REACT_APP_SUPABASE_ANON_KEY exactly. Do not use REACT_APP_SUPABASE_KEY.

Example:
REACT_APP_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOi...

## Database schema

Create a `notes` table with the following columns (SQL example):

```sql
create table if not exists public.notes (
  id uuid primary key,
  user_id text not null,
  title text default '' not null,
  content text default '' not null,
  tags text[] default '{}'::text[] not null,
  folder_id text null,
  pinned boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists notes_user_id_idx on public.notes (user_id);
```

Row Level Security recommended (if enabled, create policies to allow the user to read/write their own rows).

## How it works

- On startup, the app loads localStorage cache immediately for fast UI.
- If Supabase env vars are configured, it fetches notes from the `notes` table for the current pseudo user id (stored in `localStorage` under `notes_user_id` as `local-user` by default).
- Creating, updating, or deleting a note will sync to Supabase (optimistic update in UI). LocalStorage is used as a cache/offline fallback.

## Troubleshooting: notes not visible

1) Verify env vars in `notes_frontend/.env`:
   - REACT_APP_SUPABASE_URL is set to your project URL
   - REACT_APP_SUPABASE_ANON_KEY is set (do not use REACT_APP_SUPABASE_KEY)

2) Open browser console and reload the app.
   - You should see logs like:
     - `[Notes] Supabase configured: true config: { hasUrl: true, hasAnonKey: true, urlHost: "..."} user_id: "local-user"`
     - `[Notes] Fetched notes from Supabase: N`
   - If configured is false, fix env var names/values and rebuild.

3) Check `user_id` values in your `notes` table.
   - The app queries `where user_id = <notes_user_id from localStorage>`, defaulting to `local-user`.
   - Either update your table rows to use `user_id = 'local-user'` or set localStorage `notes_user_id` to match your rows.

4) Confirm schema/column names match this guide.

## Future improvements (optional)

- Replace pseudo user id with Supabase Auth (email/password, OAuth, etc.).
- Use `onAuthStateChange` and `supabase.auth.getUser()` to scope `user_id` to the authenticated user.
- Add real-time subscriptions (`supabase.channel`) to sync changes across tabs/sessions.
