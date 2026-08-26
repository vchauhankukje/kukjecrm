-- One-time fix: some candidates signed up before the referral code was
-- forced to uppercase, so their referral_code doesn't match the partner's
-- code and the admin panel falls back to showing the raw code instead of
-- the business name. This uppercases all existing values to match.

update candidate set referral_code = upper(referral_code) where referral_code is not null;
