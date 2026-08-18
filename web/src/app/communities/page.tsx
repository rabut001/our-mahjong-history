import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { Avatar } from "@/components/Avatar";
import { NavButton } from "@/components/NavButton";
import { RowLink, rowTitleClass, SectionCard } from "@/components/ui";
import { getHomePageData } from "@/lib/data";
import { LOGIN_PATH } from "@/lib/supabase/paths";

export const metadata: Metadata = {
  title: {
    absolute: "俺たちの雀歴",
  },
};

export const dynamic = "force-dynamic";

export default async function TopPage() {
  const data = await getHomePageData();
  if (!data) {
    redirect(LOGIN_PATH);
  }

  const { profile, communities } = data;

  return (
    <>
      <AppHeader title="俺たちの雀歴" />
      <main className="px-3 py-3">
        <section className="mb-6 flex items-start gap-3 px-1">
          <Avatar
            url={profile?.avatarUrl ?? null}
            name={profile?.displayName ?? ""}
            sizeClass="h-20 w-20 text-xl"
          />
          <div className="min-w-0 flex-1">
            <p className="text-heading font-medium">{profile?.displayName}</p>
            {profile?.comment ? (
              <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-sm leading-5 text-muted">
                {profile.comment}
              </p>
            ) : null}
          </div>
          <NavButton href="/profile">編集</NavButton>
        </section>

        <SectionCard
          title="麻雀グループ"
          action={<NavButton href="/communities/new">追加</NavButton>}
        >
          <ul className="divide-y divide-line border-y border-line">
            {communities.map((community) => (
              <li key={community.id}>
                <RowLink
                  href={`/communities/${community.id}`}
                  label={`${community.name}の詳細`}
                >
                  <span className={`block truncate ${rowTitleClass}`}>
                    {community.name}
                  </span>
                  <span className="mt-0.5 block text-sm text-muted">
                    メンバー {community.memberCount}人
                  </span>
                </RowLink>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-end">
            <NavButton href="/join">招待コードで参加</NavButton>
          </div>
        </SectionCard>
        <p className="mt-3 px-1 text-right">
          <Link href="/help/community" className="text-sm text-muted underline">
            麻雀グループってなに？
          </Link>
        </p>
      </main>
    </>
  );
}
