import type { Metadata } from "next";
import { AppHeader } from "@/components/AppHeader";
import { ProfileForm } from "@/components/ProfileForm";
import { requireActiveProfile } from "@/lib/data/auth";
import {
  updateProfileAction,
  withdrawAccountAction,
} from "@/lib/data/profile-actions";

export const metadata: Metadata = {
  title: "プロフィール",
};

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const { profile } = await requireActiveProfile();

  return (
    <>
      <AppHeader title="プロフィール" backHref="/communities" />
      <main className="px-4 py-4">
        <ProfileForm
          profile={profile}
          updateAction={updateProfileAction}
          withdrawAction={withdrawAccountAction}
        />
      </main>
    </>
  );
}
