-- HOTFIX: "This login doesn't have admin access" for existing admins.
-- Root cause: the recruiter table's own SELECT policy
-- (recruiters_read_all_recruiters) queries the recruiter table from within
-- its own policy — a self-referencing RLS check. Postgres evaluates that
-- inner query under RLS too, so it can end up seeing zero rows and blocking
-- everyone, including admins reading their own row.
--
-- Fix: a SECURITY DEFINER function bypasses RLS for just this internal
-- check, breaking the self-reference. Used here and going forward wherever
-- a policy needs to ask "is this user a recruiter?".

create or replace function is_recruiter(uid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists(select 1 from recruiter r where r.user_id = uid);
$$;

-- Replace the broken self-referencing policy on recruiter.
drop policy if exists "recruiters_read_all_recruiters" on recruiter;
create policy "recruiters_read_all_recruiters" on recruiter for select
  using (is_recruiter(auth.uid()));

drop policy if exists "recruiters_insert_recruiter" on recruiter;
create policy "recruiters_insert_recruiter" on recruiter for insert
  with check (is_recruiter(auth.uid()));

drop policy if exists "recruiter_claim_or_manage" on recruiter;
create policy "recruiter_claim_or_manage" on recruiter for update
  using (user_id is null or user_id = auth.uid() or is_recruiter(auth.uid()))
  with check (profile_id is null or is_recruiter(auth.uid()));

-- Same helper used everywhere else too, for consistency and to avoid this
-- class of bug recurring (these were correct before, just simplified now).
drop policy if exists "recruiters_manage_permission" on permission;
create policy "recruiters_manage_permission" on permission for all using (is_recruiter(auth.uid())) with check (is_recruiter(auth.uid()));

drop policy if exists "recruiters_manage_profile" on profile;
create policy "recruiters_manage_profile" on profile for all using (is_recruiter(auth.uid())) with check (is_recruiter(auth.uid()));

drop policy if exists "recruiters_manage_profile_permission" on profile_permission;
create policy "recruiters_manage_profile_permission" on profile_permission for all using (is_recruiter(auth.uid())) with check (is_recruiter(auth.uid()));

drop policy if exists "recruiters_manage_permission_set" on permission_set;
create policy "recruiters_manage_permission_set" on permission_set for all using (is_recruiter(auth.uid())) with check (is_recruiter(auth.uid()));

drop policy if exists "recruiters_manage_permission_set_permission" on permission_set_permission;
create policy "recruiters_manage_permission_set_permission" on permission_set_permission for all using (is_recruiter(auth.uid())) with check (is_recruiter(auth.uid()));

drop policy if exists "recruiters_manage_recruiter_permission_set" on recruiter_permission_set;
create policy "recruiters_manage_recruiter_permission_set" on recruiter_permission_set for all using (is_recruiter(auth.uid())) with check (is_recruiter(auth.uid()));

drop policy if exists "recruiters_manage_client" on client;
create policy "recruiters_manage_client" on client for all using (is_recruiter(auth.uid())) with check (is_recruiter(auth.uid()));

drop policy if exists "recruiters_manage_lead" on lead;
create policy "recruiters_manage_lead" on lead for all using (is_recruiter(auth.uid())) with check (is_recruiter(auth.uid()));

drop policy if exists "recruiters_read_audit_log" on audit_log;
create policy "recruiters_read_audit_log" on audit_log for select using (is_recruiter(auth.uid()));
drop policy if exists "recruiters_insert_audit_log" on audit_log;
create policy "recruiters_insert_audit_log" on audit_log for insert with check (is_recruiter(auth.uid()));
