import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { RuleForm } from "@/components/RuleForm";
import { emptyRuleFormData, getCommunity } from "@/mock";

type NewCommunityRulePageProps = {
  params: Promise<{ communityId: string }>;
};

export const metadata: Metadata = {
  title: "ルールを追加",
};

export default async function NewCommunityRulePage({
  params,
}: NewCommunityRulePageProps) {
  const { communityId } = await params;
  const community = getCommunity(communityId);
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
        <RuleForm mode="create" data={emptyRuleFormData()} />
      </main>
    </>
  );
}
