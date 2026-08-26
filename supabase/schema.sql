-- Phase 0 schema — run this once in the Supabase SQL Editor
-- Tables for all phases are created now so the schema doesn't change later.

create table if not exists candidate (
  id uuid primary key default gen_random_uuid(),
  name text,
  phone text,
  city text,
  created_at timestamptz default now(),
  job_categories text[],
  experience jsonb,
  voice_note_url text,
  availability text,
  preferred_location text,
  contract_type text,
  referral_code text,
  auth_verified boolean default false
);

create table if not exists job (
  id uuid primary key default gen_random_uuid(),
  title text,
  category text,
  city text,
  country text,
  pay_range text,
  created_at timestamptz default now(),
  slots_open int,
  slots_total int,
  status text default 'active'
);

create table if not exists application (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid references candidate(id),
  job_id uuid references job(id),
  status text default 'applied',
  status_updated_at timestamptz default now()
);

create table if not exists note (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid references candidate(id),
  recruiter_id uuid references auth.users(id),
  body text,
  created_at timestamptz default now()
);

create table if not exists call_log (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid references candidate(id),
  recruiter_id uuid references auth.users(id),
  duration_seconds int,
  outcome text,
  recording_url text,
  created_at timestamptz default now()
);

create table if not exists partner (
  id uuid primary key default gen_random_uuid(),
  business_name text,
  owner_name text,
  phone text,
  city text,
  referral_code text,
  payout_method text
);

-- Phase 0 test row, used to confirm the app can read/write to Supabase.
-- Safe to delete later.
insert into candidate (name, phone, city) values ('Test Candidate', '+10000000000', 'Test City');
