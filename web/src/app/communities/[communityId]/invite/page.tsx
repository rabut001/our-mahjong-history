import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { InvitePanel } from "@/components/InvitePanel";
import { getCommunityDetail, getCommunityInvite } from "@/lib/data";
import {
  issueInviteAction,
  reissueInviteAction,
} from "@/lib/data/community-actions";

type InvitePageProps = {
  params: Promise<{ communityId: string }>;
};

export async function generateMetadata({
  params,
}: InvitePageProps): Promise<Metadata> {
  const { communityId } = await params;
  const community = await getCommunityDetail(communityId);
  return {
    title: community ? `${community.name}の招待` : "招待",
  };
}

export const dynamic = "force-dynamic";

export default async function CommunityInvitePage({ params }: InvitePageProps) {
  const { communityId } = await params;
  const community = await getCommunityDetail(communityId);
  if (!community) {
    notFound();
  }

  const invite = await getCommunityInvite(community.id);

  return (
    <>
      <AppHeader title="招待" backHref={`/communities/${community.id}`} />
      <main className="px-4 py-4">
        <InvitePanel
          communityId={community.id}
          invite={invite}
          issueAction={issueInviteAction}
          reissueAction={reissueInviteAction}
        />
      </main>
    </>
  );
}
