import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { DangerAction } from "@/components/DangerAction";
import { RuleForm } from "@/components/RuleForm";
import { toRuleFormData } from "@/components/rule-form-data";
import { getCommunity, getCommunityRule } from "@/mock";

type CommunityRulePageProps = {
  params: Promise<{ communityId: string; ruleId: string }>;
};

export async function generateMetadata({
  params,
}: CommunityRulePageProps): Promise<Metadata> {
  const { ruleId } = await params;
  const rule = getCommunityRule(ruleId);
  return {
    title: rule ? `${rule.name}を編集` : "ルールを編集",
  };
}

export default async function CommunityRulePage({
  params,
}: CommunityRulePageProps) {
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
        backHref={`/communities/${community.id}`}
      />
      <main className="px-4 py-4">
        <RuleForm mode="edit" data={toRuleFormData(rule)} />
        <DangerAction
          label="このルールを削除する"
          dialogTitle="このルールを削除しますか？"
          dialogBody="麻雀グループの既定ルールから消えます。大会にコピー済みのルールは残ります。"
          confirmLabel="削除する"
          doneHref={`/communities/${community.id}`}
        />
      </main>
    </>
  );
}
