-- Adds a short, human-readable, unique Candidate ID (e.g. KJ-7F3B2) that
-- candidates can quote when contacting support, and admins can search by
-- to find an exact record even when free-text fields (city, country) are
-- messy or mistyped.

alter table candidate add column candidate_code text unique;

-- Backfill existing candidates with a code so nobody is left without one.
-- Uses part of their id as a stand-in — good enough for uniqueness, doesn't
-- need to match the app's KJ-XXXXX generator format exactly.
update candidate
set candidate_code = 'KJ-' || upper(substr(id::text, 1, 5))
where candidate_code is null;
