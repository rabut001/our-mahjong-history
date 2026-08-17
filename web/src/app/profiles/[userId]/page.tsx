import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { Avatar } from "@/components/Avatar";
import { getProfile } from "@/mock";

type ProfileDetailPageProps = {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ from?: string }>;
};

function safeBackHref(from: string | undefined): string {
  if (
    from &&
    from.startsWith("/") &&
    !from.startsWith("//") &&
    !from.includes("://")
  ) {
    return from;
  }
  return "/communities";
}

export async function generateMetadata({
  params,
}: ProfileDetailPageProps): Promise<Metadata> {
  const { userId } = await params;
  const profile = getProfile(userId);
  return {
    title: profile?.displayName ?? "ユーザ",
  };
}

export default async function ProfileDetailPage({
  params,
  searchParams,
}: ProfileDetailPageProps) {
  const { userId } = await params;
  const { from } = await searchParams;
  const profile = getProfile(userId);
  if (!profile) {
    notFound();
  }

  return (
    <>
      <AppHeader title={profile.displayName} backHref={safeBackHref(from)} />
      <main className="px-4 py-4">
        <div className="text-center">
          <Avatar
            url={profile.avatarUrl}
            name={profile.displayName}
            sizeClass="h-20 w-20 text-xl"
            className="mx-auto"
          />
          <p className="mt-3 font-medium">{profile.displayName}</p>
        </div>
        {profile.comment ? (
          <p className="mt-6 whitespace-pre-wrap text-sm leading-5 text-muted">
            {profile.comment}
          </p>
        ) : null}
      </main>
    </>
  );
}
