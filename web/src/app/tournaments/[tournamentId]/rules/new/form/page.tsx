import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { RuleForm } from "@/components/RuleForm";
import {
  emptyRuleFormData,
  getCommunityRule,
  getTournament,
  toRuleFormData,
} from "@/mock";

type NewTournamentRuleFormPageProps = {
  params: Promise<{ tournamentId: string }>;
  searchParams: Promise<{ from?: string }>;
};

export async function generateMetadata({
  params,
}: NewTournamentRuleFormPageProps): Promise<Metadata> {
  const { tournamentId } = await params;
  const tournament = getTournament(tournamentId);
  return {
    title: tournament ? `${tournament.name}のルールを追加` : "ルールを追加",
  };
}

export default async function NewTournamentRuleFormPage({
  params,
  searchParams,
}: NewTournamentRuleFormPageProps) {
  const { tournamentId } = await params;
  const { from } = await searchParams;
  const tournament = getTournament(tournamentId);
  if (!tournament) {
    notFound();
  }

  let data = emptyRuleFormData();
  if (from) {
    const template = getCommunityRule(from);
    if (!template || template.communityId !== tournament.communityId) {
      notFound();
    }
    data = toRuleFormData(template);
  }

  return (
    <>
      <AppHeader
        title="ルールを追加"
        backHref={`/tournaments/${tournament.id}/rules/new`}
      />
      <main className="px-4 py-4">
        <RuleForm mode="create" data={data} />
      </main>
    </>
  );
}
