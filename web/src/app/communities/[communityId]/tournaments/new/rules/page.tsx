import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { NavButton } from "@/components/NavButton";
import { getCommunityDetail } from "@/lib/data";
import { listCommunityRuleTemplates } from "@/lib/data/rules";
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

function withFrom(query: string, from: string) {
  const params = new URLSearchParams(
    query.startsWith("?") ? query.slice(1) : query,
  );
  params.set("from", from);
  return `?${params.toString()}`;
}

export default async function NewTournamentRulesPage({
  params,
  searchParams,
}: PageProps) {
  const { communityId } = await params;
  const draft = parseTournamentCreateDraft(await searchParams);
  const community = await getCommunityDetail(communityId);
  if (!community) {
    notFound();
  }

  const templates = await listCommunityRuleTemplates(community.id);
  const returnPath = `/communities/${community.id}/tournaments/new`;
  const draftQuery = tournamentCreateDraftQuery(draft);
  const formHref = `${returnPath}/rules/form${draftQuery}`;

  return (
    <>
      <AppHeader title="ルールを追加" backHref={`${returnPath}${draftQuery}`} />
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
                  <NavButton
                    href={`${returnPath}/rules/form${withFrom(draftQuery, rule.id)}`}
                  >
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
