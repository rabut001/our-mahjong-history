-- 大会参加者を消すとき、その人の試合結果も消す（修正ポイントは既存どおり CASCADE）。
-- 試合の行は残る。

ALTER TABLE public.match_results
  DROP CONSTRAINT match_results_tournament_participant_id_fkey;

ALTER TABLE public.match_results
  ADD CONSTRAINT match_results_tournament_participant_id_fkey
    FOREIGN KEY (tournament_participant_id)
    REFERENCES public.tournament_participants (id)
    ON DELETE CASCADE;
