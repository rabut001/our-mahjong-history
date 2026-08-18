-- ランナーのスモーク。業務ケースは 3-3 以降（正は docs/test-cases.md）。
begin;
select plan(1);
select ok(true, 'pgTAP is wired');
select * from finish();
rollback;
