import type { Metadata } from "next";
import { AppHeader } from "@/components/AppHeader";
import { JoinForm } from "@/components/JoinForm";
import { joinCommunityAction } from "@/lib/data/community-actions";

export const metadata: Metadata = {
  title: "招待コードで参加",
};

export default function JoinPage() {
  return (
    <>
      <AppHeader title="招待コードで参加" backHref="/communities" />
      <main className="px-4 py-4">
        <JoinForm action={joinCommunityAction} />
      </main>
    </>
  );
}
