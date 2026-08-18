import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { RuleForm } from "@/components/RuleForm";
import { emptyRuleFormData } from "@/components/rule-form-data";
import { getCommunityRule } from "@/lib/data/rules";
import { getTournamentDetail } from "@/lib/data/tournaments";
import { createTournamentRuleAction } from "@/lib/data/rule-actions";

type NewTournamentRuleFormPageProps = {
  params: Promise<{ tournamentId: string }>;
  searchParams: Promise<{ from?: string }>;
};

export async function generateMetadata({
  params,
}: NewTournamentRuleFormPageProps): Promise<Metadata> {
  const { tournamentId } = await params;
  const tournament = await getTournamentDetail(tournamentId);
  return {
    title: tournament ? `${tournament.name}のルールを追加` : "ルールを追加",
  };
}

export const dynamic = "force-dynamic";

export default async function NewTournamentRuleFormPage({
  params,
  searchParams,
}: NewTournamentRuleFormPageProps) {
  const { tournamentId } = await params;
  const { from } = await searchParams;
  const tournament = await getTournamentDetail(tournamentId);
  if (!tournament) {
    notFound();
  }

  let data = emptyRuleFormData();
  if (from) {
    const template = await getCommunityRule(tournament.communityId, from);
    if (!template) {
      notFound();
    }
    data = template.form;
  }

  return (
    <>
      <AppHeader
        title="ルールを追加"
        backHref={`/tournaments/${tournament.id}/rules/new`}
      />
      <main className="px-4 py-4">
        <RuleForm
          mode="create"
          data={data}
          action={createTournamentRuleAction}
          hiddenFields={{ tournamentId: tournament.id }}
          existingRuleNames={tournament.rules.map((rule) => rule.name)}
        />
      </main>
    </>
  );
}
