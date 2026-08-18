BEGIN;
\ir helpers.inc
SELECT no_plan();
SELECT omh_test.seed_standard();

SELECT omh_test.insert_auth_user(
  'a0000000-0000-4000-8000-0000000000f1',
  'signup01@example.com',
  true
);
SELECT is(
  (
    SELECT count(*)::int
    FROM public.profiles
    WHERE auth_user_id = 'a0000000-0000-4000-8000-0000000000f1'
      AND withdrawn_at IS NULL
  ),
  1,
  'F-signup-01 count'
);
SELECT is(
  (
    SELECT display_name
    FROM public.profiles
    WHERE auth_user_id = 'a0000000-0000-4000-8000-0000000000f1'
  ),
  'signup01',
  'F-signup-01 display_name from email'
);
SELECT is(
  (
    SELECT avatar_url
    FROM public.profiles
    WHERE auth_user_id = 'a0000000-0000-4000-8000-0000000000f1'
  ),
  NULL,
  'F-signup-01 email avatar empty'
);

SELECT omh_test.set_auth(omh_test.auth_a());
SET LOCAL ROLE authenticated;
SELECT throws_ok(
  $q$INSERT INTO public.profiles (auth_user_id, display_name)
     VALUES ('a0000000-0000-4000-8000-000000000077', 'X')$q$,
  '42501',
  NULL,
  'F-signup-02'
);
RESET ROLE;

SELECT * FROM finish();
ROLLBACK;
