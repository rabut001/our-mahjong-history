"use client";

import Link from "next/link";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { NavButton } from "@/components/NavButton";
import {
  blockButtonClass,
  compactButtonClass,
  fieldClass,
  labelClass,
} from "@/components/ui";

export function SignupForm() {
  const [step, setStep] = useState<"method" | "password">("method");
  const [email, setEmail] = useState("");

  if (step === "password") {
    return (
      <>
        <AppHeader
          title="アカウント作成"
          back={
            <button
              type="button"
              onClick={() => setStep("method")}
              className={compactButtonClass}
            >
              戻る
            </button>
          }
        />
        <main className="px-4 py-4">
          <p className="text-sm text-muted">{email || "メール"}</p>
          <div className="mt-6 space-y-6">
            <label className={labelClass}>
              表示名
              <input type="text" name="displayName" className={fieldClass} />
            </label>
            <label className={labelClass}>
              パスワード
              <input
                type="password"
                name="password"
                autoComplete="new-password"
                className={fieldClass}
              />
            </label>
            <NavButton href="/communities" variant="block">
              登録する
            </NavButton>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <AppHeader title="アカウント作成" backHref="/login" />
      <main className="px-4 py-4">
        <div className="space-y-6">
          <label className={labelClass}>
            メール
            <input
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={fieldClass}
            />
          </label>
          <button
            type="button"
            onClick={() => setStep("password")}
            className={blockButtonClass}
          >
            次へ
          </button>
        </div>
        <div className="mt-6 space-y-3">
          <NavButton href="/communities" variant="outline">
            Googleで登録
          </NavButton>
          <NavButton href="/communities" variant="outline">
            LINEで登録
          </NavButton>
        </div>
        <p className="mt-6 text-center text-sm">
          <Link href="/login" className="underline">
            ログイン
          </Link>
        </p>
      </main>
    </>
  );
}
