import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { RuleForm } from "@/components/RuleForm";
import { emptyRuleFormData } from "@/components/rule-form-data";
import { getCommunityDetail } from "@/lib/data";
import { createCommunityRuleAction } from "@/lib/data/rule-actions";

type NewCommunityRulePageProps = {
  params: Promise<{ communityId: string }>;
};

export const metadata: Metadata = {
  title: "ルールを追加",
};

export const dynamic = "force-dynamic";

export default async function NewCommunityRulePage({
  params,
}: NewCommunityRulePageProps) {
  const { communityId } = await params;
  const community = await getCommunityDetail(communityId);
  if (!community) {
    notFound();
  }

  return (
    <>
      <AppHeader
        title="ルールを追加"
        backHref={`/communities/${community.id}`}
      />
      <main className="px-4 py-4">
        <RuleForm
          mode="create"
          data={emptyRuleFormData()}
          action={createCommunityRuleAction}
          hiddenFields={{ communityId: community.id }}
          existingRuleNames={community.rules.map((rule) => rule.name)}
        />
      </main>
    </>
  );
}
