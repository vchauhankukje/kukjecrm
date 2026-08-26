-- Run in the Supabase SQL Editor to fully delete the orphaned test partner
-- login (testkukje1@gmail.com), including any rows elsewhere that reference
-- it and would otherwise block the delete with a foreign-key error.

do $$
declare
  target_id uuid;
begin
  select id into target_id from auth.users where email = 'testkukje1@gmail.com';

  if target_id is null then
    raise notice 'No user found with that email — nothing to delete.';
    return;
  end if;

  delete from partner where auth_user_id = target_id;
  delete from note where recruiter_id = target_id;
  delete from call_log where recruiter_id = target_id;
  delete from recruiter where user_id = target_id;

  delete from auth.users where id = target_id;

  raise notice 'Deleted user % and any referencing rows.', target_id;
end $$;
