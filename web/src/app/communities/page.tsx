import type { Metadata } from "next";
import { AppHeader } from "@/components/AppHeader";
import { NavButton } from "@/components/NavButton";
import { countMembers, listCommunities } from "@/mock";

export const metadata: Metadata = {
  title: "コミュニティ",
};

export default function CommunitiesPage() {
  const communities = listCommunities();

  return (
    <>
      <AppHeader title="コミュニティ" />
      <main className="px-4 py-4">
        <ul className="divide-y divide-neutral-200 border-y border-neutral-200">
          {communities.map((community) => (
            <li
              key={community.id}
              className="flex items-center justify-between gap-3 py-3"
            >
              <span className="min-w-0">
                <span className="block truncate font-medium">
                  {community.name}
                </span>
                <span className="mt-0.5 block text-sm text-neutral-600">
                  メンバー {countMembers(community.id)}人
                </span>
              </span>
              <NavButton href={`/communities/${community.id}`}>詳細</NavButton>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="mt-6 w-full border border-neutral-400 px-4 py-3 text-sm"
        >
          コミュニティを作成
        </button>
      </main>
    </>
  );
}
