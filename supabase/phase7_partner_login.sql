-- Run this once in the Supabase SQL Editor.
-- Adds real partner login (replacing the "anyone with the code" dashboard)
-- and separates "recruiter" from "partner" as distinct roles, since both now
-- share the same auth.users table.

-- ROLE TABLE: marks which auth.users are recruiters (admins). Existing admin
-- logins are backfilled below. Any NEW recruiter you create later must be
-- added here manually, e.g.:
--   insert into recruiter (user_id) values ('<new-user-uuid>');
create table if not exists recruiter (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table recruiter enable row level security;
create policy "read_own_recruiter_row" on recruiter for select using (user_id = auth.uid());

insert into recruiter (user_id)
select id from auth.users
on conflict do nothing;

-- PARTNER: link each partner row to its own auth.users login.
alter table partner add column if not exists auth_user_id uuid references auth.users(id);

drop policy if exists "public_read_partner" on partner;
create policy "partner_read_own" on partner for select using (auth_user_id = auth.uid());
create policy "recruiters_read_partners" on partner for select using (
  exists (select 1 from recruiter r where r.user_id = auth.uid())
);
-- public_insert_partner (signup) is unchanged — registration stays open.

-- ROLE SEPARATION: the policies below used to treat "any logged-in user" as
-- a recruiter. Now that partners can log in too, tighten them to actual
-- recruiters only.
drop policy if exists "recruiters_manage_jobs" on job;
create policy "recruiters_manage_jobs" on job for all
  using (exists (select 1 from recruiter r where r.user_id = auth.uid()))
  with check (exists (select 1 from recruiter r where r.user_id = auth.uid()));

drop policy if exists "recruiters_read_applications" on application;
create policy "recruiters_read_applications" on application for select
  using (exists (select 1 from recruiter r where r.user_id = auth.uid()));

drop policy if exists "recruiters_update_applications" on application;
create policy "recruiters_update_applications" on application for update
  using (exists (select 1 from recruiter r where r.user_id = auth.uid()));

drop policy if exists "recruiters_manage_notes" on note;
create policy "recruiters_manage_notes" on note for all
  using (exists (select 1 from recruiter r where r.user_id = auth.uid()))
  with check (exists (select 1 from recruiter r where r.user_id = auth.uid()));

drop policy if exists "recruiters_manage_call_logs" on call_log;
create policy "recruiters_manage_call_logs" on call_log for all
  using (exists (select 1 from recruiter r where r.user_id = auth.uid()))
  with check (exists (select 1 from recruiter r where r.user_id = auth.uid()));
