-- Lets admins record the partner's intended email at invite time, so it can
-- be pre-filled on their onboarding page (not used for auth until they
-- actually submit the onboarding form themselves).
alter table partner add column invited_email text;
