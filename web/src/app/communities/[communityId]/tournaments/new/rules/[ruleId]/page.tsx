import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { DangerAction } from "@/components/DangerAction";
import { RuleForm } from "@/components/RuleForm";
import { toRuleFormData } from "@/components/rule-form-data";
import { getCommunity, getCommunityRule } from "@/mock";

type NewTournamentRuleEditPageProps = {
  params: Promise<{ communityId: string; ruleId: string }>;
};

export async function generateMetadata({
  params,
}: NewTournamentRuleEditPageProps): Promise<Metadata> {
  const { ruleId } = await params;
  const rule = getCommunityRule(ruleId);
  return {
    title: rule ? `${rule.name}を編集` : "ルールを編集",
  };
}

export default async function NewTournamentRuleEditPage({
  params,
}: NewTournamentRuleEditPageProps) {
  const { communityId, ruleId } = await params;
  const community = getCommunity(communityId);
  const rule = getCommunityRule(ruleId);
  if (!community || !rule || rule.communityId !== community.id) {
    notFound();
  }

  return (
    <>
      <AppHeader
        title="ルールを編集"
        backHref={`/communities/${community.id}/tournaments/new`}
      />
      <main className="px-4 py-4">
        <RuleForm mode="edit" data={toRuleFormData(rule)} />
        <DangerAction
          label="このルールを削除する"
          dialogTitle="このルールを削除しますか？"
          dialogBody="作成中の大会のルール一覧から消えます。"
          confirmLabel="削除する"
          doneHref={`/communities/${community.id}/tournaments/new`}
        />
      </main>
    </>
  );
}
