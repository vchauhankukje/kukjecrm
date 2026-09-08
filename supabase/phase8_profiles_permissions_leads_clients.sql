-- Phase 8 demo build: Profile/Permission Set access model, Job lifecycle +
-- Audit log, basic Employer/Client Portal, basic Lead CRM.
-- Run once in the Supabase SQL Editor.

-- ============================================================
-- 1. PROFILE + PERMISSION SET ACCESS MODEL (Salesforce-style)
-- ============================================================

create table permission (
  id uuid primary key default gen_random_uuid(),
  object text not null,        -- e.g. 'candidate', 'job', 'partner', 'lead', 'client'
  action text not null,        -- e.g. 'read', 'write', 'delete', 'manage'
  unique (object, action)
);

create table profile (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  description text
);

create table profile_permission (
  profile_id uuid references profile(id) on delete cascade,
  permission_id uuid references permission(id) on delete cascade,
  primary key (profile_id, permission_id)
);

create table permission_set (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  description text
);

create table permission_set_permission (
  permission_set_id uuid references permission_set(id) on delete cascade,
  permission_id uuid references permission(id) on delete cascade,
  primary key (permission_set_id, permission_id)
);

-- IMPORTANT: `recruiter` already exists (from phase7_partner_login.sql) with
-- `user_id uuid primary key references auth.users(id)` as its only column —
-- it was a simple role marker, always created via a manual SQL insert after
-- the auth account already existed. To support the same invite-before-signup
-- flow used for Partner/Client, we add a synthetic `id` PK and make
-- `user_id` nullable (a row can now exist "pending" with no linked auth user
-- yet, exactly like partner.auth_user_id / client.auth_user_id).
alter table recruiter drop constraint recruiter_pkey;
alter table recruiter add column id uuid not null default gen_random_uuid();
alter table recruiter add primary key (id);
alter table recruiter alter column user_id drop not null;
alter table recruiter add constraint recruiter_user_id_unique unique (user_id);
alter table recruiter add column name text;
alter table recruiter add column email text;
alter table recruiter add column invite_token text unique;
alter table recruiter add column profile_id uuid references profile(id);
alter table recruiter add column created_at timestamptz default now();

create table recruiter_permission_set (
  recruiter_id uuid references recruiter(id) on delete cascade,
  permission_set_id uuid references permission_set(id) on delete cascade,
  primary key (recruiter_id, permission_set_id)
);

alter table permission enable row level security;
alter table profile enable row level security;
alter table profile_permission enable row level security;
alter table permission_set enable row level security;
alter table permission_set_permission enable row level security;
alter table recruiter_permission_set enable row level security;

-- All of these are recruiter-managed only, mirroring the rest of the admin panel.
create policy "recruiters_manage_permission" on permission for all
  using (exists (select 1 from recruiter r where r.user_id = auth.uid()))
  with check (exists (select 1 from recruiter r where r.user_id = auth.uid()));
create policy "recruiters_manage_profile" on profile for all
  using (exists (select 1 from recruiter r where r.user_id = auth.uid()))
  with check (exists (select 1 from recruiter r where r.user_id = auth.uid()));
create policy "recruiters_manage_profile_permission" on profile_permission for all
  using (exists (select 1 from recruiter r where r.user_id = auth.uid()))
  with check (exists (select 1 from recruiter r where r.user_id = auth.uid()));
create policy "recruiters_manage_permission_set" on permission_set for all
  using (exists (select 1 from recruiter r where r.user_id = auth.uid()))
  with check (exists (select 1 from recruiter r where r.user_id = auth.uid()));
create policy "recruiters_manage_permission_set_permission" on permission_set_permission for all
  using (exists (select 1 from recruiter r where r.user_id = auth.uid()))
  with check (exists (select 1 from recruiter r where r.user_id = auth.uid()));
create policy "recruiters_manage_recruiter_permission_set" on recruiter_permission_set for all
  using (exists (select 1 from recruiter r where r.user_id = auth.uid()))
  with check (exists (select 1 from recruiter r where r.user_id = auth.uid()));

-- Recruiter table itself: existing recruiters can see/manage everyone
-- (needed for the Access Control screen's recruiter list), and anyone
-- holding a valid invite_token can find + claim their own pending row.
create policy "recruiters_read_all_recruiters" on recruiter for select
  using (exists (select 1 from recruiter r where r.user_id = auth.uid()));
create policy "recruiters_insert_recruiter" on recruiter for insert
  with check (exists (select 1 from recruiter r where r.user_id = auth.uid()));
create policy "recruiter_claim_or_manage" on recruiter for update
  using (user_id is null or user_id = auth.uid() or exists (select 1 from recruiter r where r.user_id = auth.uid()))
  with check (true);
-- Lets an unclaimed invite be found by token without already being a recruiter.
create policy "public_read_unclaimed_invite" on recruiter for select
  using (user_id is null and invite_token is not null);

-- Seed baseline permissions
insert into permission (object, action) values
  ('candidate', 'read'), ('candidate', 'write'),
  ('job', 'read'), ('job', 'write'),
  ('partner', 'read'), ('partner', 'write'),
  ('lead', 'read'), ('lead', 'write'),
  ('client', 'read'), ('client', 'write'),
  ('admin_users', 'manage');

-- Seed baseline profiles
insert into profile (name, description) values
  ('Super Admin', 'Full access to everything, including managing profiles and users'),
  ('Recruiter', 'Manage candidates and jobs, read-only on partners/leads/clients'),
  ('KAM', 'Manage clients and jobs, read-only on candidates'),
  ('Read Only', 'View everything, change nothing');

insert into profile_permission (profile_id, permission_id)
select p.id, perm.id from profile p, permission perm where p.name = 'Super Admin';

insert into profile_permission (profile_id, permission_id)
select p.id, perm.id from profile p, permission perm
where p.name = 'Recruiter' and (
  (perm.object = 'candidate') or (perm.object = 'job') or
  (perm.object = 'partner' and perm.action = 'read') or
  (perm.object = 'lead' and perm.action = 'read') or
  (perm.object = 'client' and perm.action = 'read')
);

insert into profile_permission (profile_id, permission_id)
select p.id, perm.id from profile p, permission perm
where p.name = 'KAM' and (
  (perm.object = 'client') or (perm.object = 'job') or
  (perm.object = 'candidate' and perm.action = 'read') or
  (perm.object = 'lead')
);

insert into profile_permission (profile_id, permission_id)
select p.id, perm.id from profile p, permission perm
where p.name = 'Read Only' and perm.action = 'read';

-- ============================================================
-- 2. JOB LIFECYCLE STAGE + AUDIT LOG
-- ============================================================

-- Separate from the existing `status` (active/paused/filled, which controls
-- candidate-feed visibility) so nothing about the current job feed breaks.
alter table job add column stage text default 'draft';

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_email text,
  action text not null,        -- e.g. 'update', 'create', 'status_change'
  object_type text not null,   -- e.g. 'candidate', 'job', 'partner'
  object_id uuid,
  before jsonb,
  after jsonb,
  created_at timestamptz default now()
);

alter table audit_log enable row level security;
create policy "recruiters_read_audit_log" on audit_log for select using (auth.uid() is not null);
create policy "recruiters_insert_audit_log" on audit_log for insert with check (auth.uid() is not null);

-- ============================================================
-- 3. BASIC EMPLOYER/CLIENT PORTAL
-- ============================================================

create table client (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  industry text,
  city text,
  country text,
  contact_name text,
  contact_email text,
  contact_phone text,
  invited_email text,
  auth_user_id uuid unique,
  invite_token text unique,
  created_at timestamptz default now()
);

alter table job add column client_id uuid references client(id);
alter table application add column client_visible boolean default false;
alter table application add column client_rating int;
alter table application add column client_feedback text;

alter table client enable row level security;
create policy "recruiters_manage_client" on client for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "client_claim_or_self_update" on client for update using (auth_user_id is null or auth_user_id = auth.uid()) with check (true);
create policy "client_self_read" on client for select using (auth_user_id = auth.uid());

-- Clients can read/update applications explicitly shared with them, for jobs
-- that belong to them.
create policy "client_read_shared_applications" on application for select using (
  client_visible = true and job_id in (select id from job where client_id in (select id from client where auth_user_id = auth.uid()))
);
create policy "client_update_shared_applications" on application for update using (
  client_visible = true and job_id in (select id from job where client_id in (select id from client where auth_user_id = auth.uid()))
);
create policy "client_read_own_jobs" on job for select using (
  client_id in (select id from client where auth_user_id = auth.uid())
);

-- ============================================================
-- 4. BASIC LEAD CRM
-- ============================================================

create table lead (
  id uuid primary key default gen_random_uuid(),
  lead_type text not null,     -- 'employer' | 'candidate' | 'student'
  name text,
  phone text,
  email text,
  company text,
  source text,
  status text default 'new',   -- new | contacted | qualified | converted | lost
  notes text,
  converted_candidate_id uuid references candidate(id),
  converted_client_id uuid references client(id),
  created_at timestamptz default now()
);

alter table lead enable row level security;
create policy "recruiters_manage_lead" on lead for all using (auth.uid() is not null) with check (auth.uid() is not null);
