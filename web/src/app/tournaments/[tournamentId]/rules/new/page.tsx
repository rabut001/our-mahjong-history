import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { NavButton } from "@/components/NavButton";
import { getTournamentDetail } from "@/lib/data/tournaments";
import { listCommunityRuleTemplates } from "@/lib/data/rules";

type NewTournamentRulePageProps = {
  params: Promise<{ tournamentId: string }>;
};

export async function generateMetadata({
  params,
}: NewTournamentRulePageProps): Promise<Metadata> {
  const { tournamentId } = await params;
  const tournament = await getTournamentDetail(tournamentId);
  return {
    title: tournament ? `${tournament.name}のルールを追加` : "ルールを追加",
  };
}

export const dynamic = "force-dynamic";

export default async function NewTournamentRulePage({
  params,
}: NewTournamentRulePageProps) {
  const { tournamentId } = await params;
  const tournament = await getTournamentDetail(tournamentId);
  if (!tournament) {
    notFound();
  }

  const templates = await listCommunityRuleTemplates(tournament.communityId);
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
            <p className="text-sm text-muted">
              麻雀グループの既定ルールをこの大会へコピーできます。コピー後に大会用へ直せます。
            </p>
            <ul className="mt-4 divide-y divide-line border-y border-line">
              {templates.map((rule) => (
                <li
                  key={rule.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <span className="min-w-0">
                    <span className="block font-medium">{rule.name}</span>
                    <span className="mt-0.5 block text-sm text-muted">
                      {rule.player_count === 4 ? "四麻" : "三麻"}
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
          <p className="text-sm text-muted">
            麻雀グループに既定ルールがありません。作成してください。
          </p>
        )}
        <div className="mt-6">
          <NavButton href={formHref} variant="block">
            新規作成
          </NavButton>
        </div>
      </main>
    </>
  );
}
