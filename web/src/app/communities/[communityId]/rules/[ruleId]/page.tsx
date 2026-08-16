import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { RuleForm } from "@/components/RuleForm";
import { getCommunity, getCommunityRule, toRuleFormData } from "@/mock";

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
      </main>
    </>
  );
}
