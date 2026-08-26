-- Run once in the Supabase SQL Editor.
-- Lets candidates (anon) read their own applications for the new
-- "Check your status" self-service screen. Same trial-stage trade-off as
-- the existing public policies on `candidate` and `partner` — anyone with
-- the anon key can technically read all applications, not just their own,
-- since there's no candidate-level auth yet. Tighten before a real launch.

create policy "public_read_applications" on application for select using (true);
