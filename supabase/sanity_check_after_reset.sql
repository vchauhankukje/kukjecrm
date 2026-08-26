-- Run in the Supabase SQL Editor after reset_data.sql to confirm the wipe
-- worked and reference data (jobs/locations/categories) is still intact.

select 'candidate' as table_name, count(*) as row_count from candidate
union all
select 'partner', count(*) from partner
union all
select 'application', count(*) from application
union all
select 'note', count(*) from note
union all
select 'call_log', count(*) from call_log
union all
select 'job', count(*) from job
union all
select 'recruiter', count(*) from recruiter
order by table_name;

-- Expect: candidate, partner, application, note, call_log = 0
-- Expect: job > 0 (your retained reference data)
-- Expect: recruiter > 0 (your existing admin logins, untouched by reset_data.sql)

-- Spot-check that retained job data still looks right:
select id, title, category, city, country, status, slots_open, slots_total
from job
order by created_at desc
limit 10;

-- Any leftover partner auth logins from before the reset (rows here mean
-- someone can still log in at /partner/login but will see "No partner
-- profile linked" since their partner row is gone):
select au.id, au.email, au.created_at
from auth.users au
left join partner p on p.auth_user_id = au.id
left join recruiter r on r.user_id = au.id
where p.id is null and r.user_id is null;
