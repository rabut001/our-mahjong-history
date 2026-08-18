import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { DangerAction } from "@/components/DangerAction";
import { RuleForm } from "@/components/RuleForm";
import { toRuleFormData } from "@/components/rule-form-data";
import {
  getTournament,
  getTournamentRule,
  isTournamentRuleInUse,
} from "@/mock";

type TournamentRulePageProps = {
  params: Promise<{ tournamentId: string; ruleId: string }>;
};

export async function generateMetadata({
  params,
}: TournamentRulePageProps): Promise<Metadata> {
  const { ruleId } = await params;
  const rule = getTournamentRule(ruleId);
  const inUse = rule ? isTournamentRuleInUse(rule.id) : false;
  return {
    title: rule ? (inUse ? rule.name : `${rule.name}を編集`) : "ルール",
  };
}

export default async function TournamentRulePage({
  params,
}: TournamentRulePageProps) {
  const { tournamentId, ruleId } = await params;
  const tournament = getTournament(tournamentId);
  const rule = getTournamentRule(ruleId);
  if (!tournament || !rule || rule.tournamentId !== tournament.id) {
    notFound();
  }

  const inUse = isTournamentRuleInUse(rule.id);

  return (
    <>
      <AppHeader
        title={inUse ? "ルール" : "ルールを編集"}
        backHref={`/tournaments/${tournament.id}/edit`}
      />
      <main className="px-4 py-4">
        <RuleForm
          mode={inUse ? "view" : "edit"}
          data={toRuleFormData(rule)}
          addRuleHref={
            inUse ? `/tournaments/${tournament.id}/rules/new` : undefined
          }
        />
        <DangerAction
          label="このルールを削除する"
          dialogTitle="このルールを削除しますか？"
          dialogBody="この大会のルール一覧から消えます。元に戻せません。"
          confirmLabel="削除する"
          doneHref={`/tournaments/${tournament.id}/edit`}
          disabled={inUse}
          disabledNote="試合で使用中のため削除できません。"
        />
      </main>
    </>
  );
}
