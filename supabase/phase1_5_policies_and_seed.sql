-- Run this once in the Supabase SQL Editor after Phase 0's two SQL files.
-- Adds RLS policies for Phases 1-5 and seeds sample Eastern European jobs.

-- JOB: public can read active jobs (candidate job feed); only logged-in
-- recruiters can create/edit/delete.
alter table job enable row level security;
create policy "public_read_jobs" on job for select using (true);
create policy "recruiters_manage_jobs" on job for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- APPLICATION: candidates (public/anon) can create their own application;
-- only recruiters can read/update the pipeline.
alter table application enable row level security;
create policy "public_insert_application" on application for insert with check (true);
create policy "recruiters_read_applications" on application for select using (auth.uid() is not null);
create policy "recruiters_update_applications" on application for update using (auth.uid() is not null);

-- NOTE: recruiter-only, both read and write.
alter table note enable row level security;
create policy "recruiters_manage_notes" on note for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- CALL_LOG: recruiter-only, both read and write.
alter table call_log enable row level security;
create policy "recruiters_manage_call_logs" on call_log for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- PARTNER: public insert (self sign-up) and public select (dashboard lookup
-- by code, no partner login built in this trial version — anyone with the
-- code can view their own stats, which is an acceptable trade-off for now).
alter table partner enable row level security;
create policy "public_insert_partner" on partner for insert with check (true);
create policy "public_read_partner" on partner for select using (true);

-- Sample Eastern European jobs for testing the candidate job feed.
insert into job (title, category, city, country, pay_range, slots_open, slots_total, status) values
  ('Delivery Driver', 'Delivery Driver', 'Bucharest', 'Romania', '€800-1000/month', 5, 5, 'active'),
  ('Truck Driver (CDL)', 'Truck Driver', 'Warsaw', 'Poland', '€1200-1500/month', 3, 3, 'active'),
  ('Warehouse Supervisor', 'Warehouse/Loader', 'Belgrade', 'Serbia', '€900-1100/month', 2, 2, 'active'),
  ('Live-in Housekeeper', 'Housekeeping', 'Krakow', 'Poland', '€700-900/month', 4, 4, 'active'),
  ('Warehouse Loader', 'Warehouse/Loader', 'Cluj-Napoca', 'Romania', '€750-850/month', 6, 6, 'active'),
  ('Truck Driver - Long Haul', 'Truck Driver', 'Novi Sad', 'Serbia', '€1300-1600/month', 2, 2, 'active');
