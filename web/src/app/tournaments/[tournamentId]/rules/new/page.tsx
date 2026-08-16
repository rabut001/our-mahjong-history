import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { NavButton } from "@/components/NavButton";
import { getTournament, listCommunityRules } from "@/mock";

type NewTournamentRulePageProps = {
  params: Promise<{ tournamentId: string }>;
};

export async function generateMetadata({
  params,
}: NewTournamentRulePageProps): Promise<Metadata> {
  const { tournamentId } = await params;
  const tournament = getTournament(tournamentId);
  return {
    title: tournament ? `${tournament.name}のルールを追加` : "ルールを追加",
  };
}

export default async function NewTournamentRulePage({
  params,
}: NewTournamentRulePageProps) {
  const { tournamentId } = await params;
  const tournament = getTournament(tournamentId);
  if (!tournament) {
    notFound();
  }

  const templates = listCommunityRules(tournament.communityId);
  const formHref = `/tournaments/${tournament.id}/rules/new/form`;

  return (
    <>
      <AppHeader
        title="ルールを追加"
        backHref={`/tournaments/${tournament.id}/edit`}
      />
      <main className="px-4 py-4">
        {templates.length > 0 ? (
          <>
            <p className="text-sm text-neutral-600">
              コミュニティの既定ルールをこの大会へコピーできます。コピー後に大会用へ直せます。
            </p>
            <ul className="mt-4 divide-y divide-neutral-200 border-y border-neutral-200">
              {templates.map((rule) => (
                <li
                  key={rule.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <span className="min-w-0">
                    <span className="block font-medium">{rule.name}</span>
                    <span className="mt-0.5 block text-sm text-neutral-600">
                      {rule.playerCount === 4 ? "四麻" : "三麻"}
                    </span>
                  </span>
                  <NavButton href={`${formHref}?from=${rule.id}`}>
                    コピー
                  </NavButton>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-sm text-neutral-600">
            コミュニティに既定ルールがありません。いちから作成できます。
          </p>
        )}
        <div className="mt-6">
          <NavButton href={formHref} variant="block">
            いちから作成
          </NavButton>
        </div>
      </main>
    </>
  );
}
