import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { DangerAction } from "@/components/DangerAction";
import { RuleForm } from "@/components/RuleForm";
import { getCommunityDetail } from "@/lib/data";
import { getCommunityRule } from "@/lib/data/rules";
import {
  deleteCommunityRuleAction,
  updateCommunityRuleAction,
} from "@/lib/data/rule-actions";

type CommunityRulePageProps = {
  params: Promise<{ communityId: string; ruleId: string }>;
};

export async function generateMetadata({
  params,
}: CommunityRulePageProps): Promise<Metadata> {
  const { communityId, ruleId } = await params;
  const rule = await getCommunityRule(communityId, ruleId);
  return {
    title: rule ? `${rule.form.name}を編集` : "ルールを編集",
  };
}

export const dynamic = "force-dynamic";

export default async function CommunityRulePage({
  params,
}: CommunityRulePageProps) {
  const { communityId, ruleId } = await params;
  const community = await getCommunityDetail(communityId);
  const rule = await getCommunityRule(communityId, ruleId);
  if (!community || !rule) {
    notFound();
  }

  return (
    <>
      <AppHeader
        title="ルールを編集"
        backHref={`/communities/${community.id}`}
      />
      <main className="px-4 py-4">
        <RuleForm
          mode="edit"
          data={rule.form}
          action={updateCommunityRuleAction}
          hiddenFields={{ communityId: community.id, ruleId: rule.id }}
        />
        <DangerAction
          label="このルールを削除する"
          dialogTitle="このルールを削除しますか？"
          dialogBody="麻雀グループの既定ルールから消えます。大会にコピー済みのルールは残ります。"
          confirmLabel="削除する"
          doneHref={`/communities/${community.id}`}
          action={deleteCommunityRuleAction}
          hiddenFields={{ communityId: community.id, ruleId: rule.id }}
        />
      </main>
    </>
  );
}
