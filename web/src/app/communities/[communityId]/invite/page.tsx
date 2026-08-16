import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import {
  formatHeldOn,
  getCommunity,
  getCommunityInviteCode,
  INVITE_DEFAULT_DAYS,
} from "@/mock";

type InvitePageProps = {
  params: Promise<{ communityId: string }>;
};

export async function generateMetadata({
  params,
}: InvitePageProps): Promise<Metadata> {
  const { communityId } = await params;
  const community = getCommunity(communityId);
  return {
    title: community ? `${community.name}の招待` : "招待",
  };
}

export default async function CommunityInvitePage({ params }: InvitePageProps) {
  const { communityId } = await params;
  const community = getCommunity(communityId);
  if (!community) {
    notFound();
  }

  const invite = getCommunityInviteCode(community.id);
  const expiryDate = invite?.expiresAt.slice(0, 10);

  return (
    <>
      <AppHeader title="招待" backHref={`/communities/${community.id}`} />
      <main className="px-4 py-4">
        {invite && expiryDate ? (
          <>
            <p className="text-sm text-neutral-600">招待コード</p>
            <p className="mt-2 text-center font-mono text-2xl tracking-widest">
              {invite.code}
            </p>
            <p className="mt-4 text-sm text-neutral-600">
              {formatHeldOn(expiryDate)}まで（発行から{INVITE_DEFAULT_DAYS}
              日間）
            </p>
            <p className="mt-2 text-sm text-neutral-600">
              期限切れまで何度でも使えます。参加する人はログインしたあと、このコードを入力します。
            </p>
            <div className="mt-6 space-y-3">
              <button
                type="button"
                className="w-full border border-neutral-400 px-4 py-3 text-sm"
              >
                コピー
              </button>
              <button
                type="button"
                className="w-full border border-neutral-400 px-4 py-3 text-sm"
              >
                再発行する
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-neutral-600">
              招待コードはまだありません。発行すると、発行から
              {INVITE_DEFAULT_DAYS}日間使えます。
            </p>
            <button
              type="button"
              className="mt-6 w-full border border-neutral-400 px-4 py-3 text-sm"
            >
              発行する
            </button>
          </>
        )}
      </main>
    </>
  );
}
