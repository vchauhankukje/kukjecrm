-- Clears all candidate-generated test data. Keeps table structure intact.
-- Jobs are NOT cleared by default since they're admin-managed reference data,
-- not candidate test data — uncomment the last line if you want those gone too.

truncate table note, call_log, application, candidate, partner restart identity cascade;

-- truncate table job restart identity cascade;
