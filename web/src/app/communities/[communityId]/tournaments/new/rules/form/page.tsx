import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { RuleForm } from "@/components/RuleForm";
import {
  emptyRuleFormData,
  getCommunity,
  getCommunityRule,
  toRuleFormData,
} from "@/mock";

type NewTournamentRuleFormPageProps = {
  params: Promise<{ communityId: string }>;
  searchParams: Promise<{ from?: string }>;
};

export const metadata: Metadata = {
  title: "ルールを追加",
};

export default async function NewTournamentRuleFormPage({
  params,
  searchParams,
}: NewTournamentRuleFormPageProps) {
  const { communityId } = await params;
  const { from } = await searchParams;
  const community = getCommunity(communityId);
  if (!community) {
    notFound();
  }

  let data = emptyRuleFormData();
  if (from) {
    const template = getCommunityRule(from);
    if (!template || template.communityId !== community.id) {
      notFound();
    }
    data = toRuleFormData(template);
  }

  const backHref = `/communities/${community.id}/tournaments/new/rules`;

  return (
    <>
      <AppHeader title="ルールを追加" backHref={backHref} />
      <main className="px-4 py-4">
        <RuleForm mode="create" data={data} />
      </main>
    </>
  );
}
