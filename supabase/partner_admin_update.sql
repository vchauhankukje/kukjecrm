-- Fixes a gap found in code review: the existing partner update policy
-- ("partner_claim_or_self_update") only lets a partner claim an unclaimed
-- record or edit their own already-claimed one — it does NOT let an admin
-- edit an already-active partner's details, since the admin's auth.uid()
-- is neither null-matched nor equal to that partner's own auth_user_id.
-- This adds the missing "any logged-in recruiter can manage partners" policy,
-- matching how every other admin-managed table (job, note, call_log) works.

create policy "recruiters_manage_partner" on partner
  for update using (auth.uid() is not null)
  with check (auth.uid() is not null);
