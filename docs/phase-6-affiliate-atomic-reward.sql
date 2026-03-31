create or replace function public.award_affiliate_referral(
  referred_by_code_input text,
  referred_profile_id_input uuid,
  plan_input text,
  credits_awarded_input integer
)
returns boolean as $$
declare
  affiliate_row public.affiliates%rowtype;
begin
  if coalesce(trim(referred_by_code_input), '') = '' or credits_awarded_input <= 0 then
    return false;
  end if;

  select *
  into affiliate_row
  from public.affiliates
  where code = upper(trim(referred_by_code_input));

  if not found then
    return false;
  end if;

  if affiliate_row.profile_id = referred_profile_id_input then
    return false;
  end if;

  update public.profiles
  set credits = credits + credits_awarded_input
  where id = affiliate_row.profile_id;

  update public.affiliates
  set conversions = conversions + 1,
      credits_earned = credits_earned + credits_awarded_input
  where id = affiliate_row.id;

  insert into public.affiliate_referrals (
    affiliate_id,
    referred_profile_id,
    plan,
    credits_awarded,
    status
  ) values (
    affiliate_row.id,
    referred_profile_id_input,
    plan_input,
    credits_awarded_input,
    'awarded'
  );

  return true;
end;
$$ language plpgsql;
