-- TEMPORARY Phase 0 policy — allows public read access to candidate table
-- so the placeholder app can confirm the Supabase connection works.
-- This will be replaced with real access rules in Phase 1/2.

alter table candidate enable row level security;

create policy "phase0_public_read" on candidate
  for select using (true);

create policy "phase0_public_upload" on storage.objects
  for insert with check (bucket_id = 'candidate-files');
create policy "phase0_public_read_files" on storage.objects
  for select using (bucket_id = 'candidate-files');

create policy "phase0_public_insert" on candidate
  for insert with check (true);
create policy "phase0_public_update" on candidate
  for update using (true);
