import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { DangerAction } from "@/components/DangerAction";
import { RuleForm } from "@/components/RuleForm";
import { getTournamentRule } from "@/lib/data/rules";
import { getTournamentDetail } from "@/lib/data/tournaments";
import {
  deleteTournamentRuleAction,
  updateTournamentRuleAction,
} from "@/lib/data/rule-actions";

type TournamentRulePageProps = {
  params: Promise<{ tournamentId: string; ruleId: string }>;
};

export async function generateMetadata({
  params,
}: TournamentRulePageProps): Promise<Metadata> {
  const { tournamentId, ruleId } = await params;
  const rule = await getTournamentRule(tournamentId, ruleId);
  return {
    title: rule
      ? rule.inUse
        ? rule.form.name
        : `${rule.form.name}を編集`
      : "ルール",
  };
}

export const dynamic = "force-dynamic";

export default async function TournamentRulePage({
  params,
}: TournamentRulePageProps) {
  const { tournamentId, ruleId } = await params;
  const tournament = await getTournamentDetail(tournamentId);
  const rule = await getTournamentRule(tournamentId, ruleId);
  if (!tournament || !rule) {
    notFound();
  }

  return (
    <>
      <AppHeader
        title={rule.inUse ? "ルール" : "ルールを編集"}
        backHref={`/tournaments/${tournament.id}/edit`}
      />
      <main className="px-4 py-4">
        <RuleForm
          mode={rule.inUse ? "view" : "edit"}
          data={rule.form}
          action={rule.inUse ? undefined : updateTournamentRuleAction}
          hiddenFields={{ tournamentId: tournament.id, ruleId: rule.id }}
          addRuleHref={
            rule.inUse ? `/tournaments/${tournament.id}/rules/new` : undefined
          }
        />
        <DangerAction
          label="このルールを削除する"
          dialogTitle="このルールを削除しますか？"
          dialogBody="この大会のルール一覧から消えます。元に戻せません。"
          confirmLabel="削除する"
          doneHref={`/tournaments/${tournament.id}/edit`}
          disabled={rule.inUse}
          disabledNote="試合で使用中のため削除できません。"
          action={deleteTournamentRuleAction}
          hiddenFields={{ tournamentId: tournament.id, ruleId: rule.id }}
        />
      </main>
    </>
  );
}
