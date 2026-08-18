import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { RuleForm } from "@/components/RuleForm";
import { emptyRuleFormData } from "@/components/rule-form-data";
import { getCommunityDetail } from "@/lib/data";
import { getCommunityRule } from "@/lib/data/rules";
import { createCommunityRuleAction } from "@/lib/data/rule-actions";
import {
  parseTournamentCreateDraft,
  tournamentCreateDraftQuery,
  type TournamentCreateDraftParams,
} from "@/lib/tournament-create-query";

export const metadata: Metadata = {
  title: "ルールを追加",
};

type PageProps = {
  params: Promise<{ communityId: string }>;
  searchParams: Promise<TournamentCreateDraftParams>;
};

export const dynamic = "force-dynamic";

export default async function NewTournamentRuleFormPage({
  params,
  searchParams,
}: PageProps) {
  const { communityId } = await params;
  const raw = await searchParams;
  const draft = parseTournamentCreateDraft(raw);
  const from = Array.isArray(raw.from) ? raw.from[0] : raw.from;
  const community = await getCommunityDetail(communityId);
  if (!community) {
    notFound();
  }

  let data = emptyRuleFormData();
  if (from) {
    const template = await getCommunityRule(community.id, from);
    if (!template) {
      notFound();
    }
    data = template.form;
  }

  const returnPath = `/communities/${community.id}/tournaments/new`;
  const draftQuery = tournamentCreateDraftQuery(draft);
  const next = `${returnPath}${draftQuery}`;

  return (
    <>
      <AppHeader
        title="ルールを追加"
        backHref={`${returnPath}/rules${draftQuery}`}
      />
      <main className="px-4 py-4">
        <RuleForm
          mode="create"
          data={data}
          action={createCommunityRuleAction}
          hiddenFields={{ communityId: community.id, next }}
          existingRuleNames={community.rules.map((rule) => rule.name)}
        />
      </main>
    </>
  );
}
