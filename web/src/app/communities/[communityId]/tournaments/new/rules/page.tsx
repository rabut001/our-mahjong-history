import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { NavButton } from "@/components/NavButton";
import { getCommunity, listCommunityRules } from "@/mock";

type NewTournamentRulesPageProps = {
  params: Promise<{ communityId: string }>;
};

export const metadata: Metadata = {
  title: "ルールを追加",
};

export default async function NewTournamentRulesPage({
  params,
}: NewTournamentRulesPageProps) {
  const { communityId } = await params;
  const community = getCommunity(communityId);
  if (!community) {
    notFound();
  }

  const templates = listCommunityRules(community.id);
  const backHref = `/communities/${community.id}/tournaments/new`;
  const formHref = `/communities/${community.id}/tournaments/new/rules/form`;

  return (
    <>
      <AppHeader title="ルールを追加" backHref={backHref} />
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
          <p className="text-sm text-muted">
            麻雀グループに既定ルールがありません。いちから作成できます。
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
