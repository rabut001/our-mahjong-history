import { AppHeader } from "@/components/AppHeader";

export default function NotFound() {
  return (
    <>
      <AppHeader title="見つかりません" backHref="/communities" />
      <main className="px-4 py-8">
        <p className="text-sm leading-relaxed">
          指定したページはありません。コミュニティ一覧からやり直してください。
        </p>
      </main>
    </>
  );
}
