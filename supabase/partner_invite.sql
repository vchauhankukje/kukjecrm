-- Adds admin-invited partner onboarding: admin creates a partner record with
-- an invite_token and no auth account yet; the partner uses a link containing
-- that token to set their own email/password and "claim" the record.

alter table partner add column invite_token text unique;

-- Allow claiming (auth_user_id is null -> set it) or a partner updating their
-- own already-claimed record. Same trial-stage trade-off as other tables here.
create policy "partner_claim_or_self_update" on partner
  for update using (auth_user_id is null or auth_user_id = auth.uid())
  with check (true);
