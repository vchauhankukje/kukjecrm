-- Reassigns Devender's referral to the partner "Haldiram".
-- Uses the partner's business name to look up their code automatically.

update candidate
set referral_code = (select referral_code from partner where business_name = 'Haldiram')
where name = 'Devender';

-- Verify it worked:
select name, referral_code from candidate where name = 'Devender';
