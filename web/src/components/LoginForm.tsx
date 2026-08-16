"use client";

import { useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { NavButton } from "@/components/NavButton";

const fieldClass =
  "mt-1 w-full border border-neutral-400 bg-white px-3 py-2 text-base";
const labelClass = "block text-sm";
const backButtonClass =
  "inline-flex shrink-0 items-center justify-center border border-neutral-400 px-3 py-1 text-sm";
const blockButtonClass =
  "block w-full border border-neutral-400 px-4 py-3 text-center text-sm";

export function LoginForm() {
  const [step, setStep] = useState<"email" | "password">("email");
  const [email, setEmail] = useState("");

  if (step === "password") {
    return (
      <>
        <AppHeader
          title="ログイン"
          back={
            <button
              type="button"
              onClick={() => setStep("email")}
              className={backButtonClass}
            >
              戻る
            </button>
          }
        />
        <main className="px-4 py-4">
          <p className="text-sm text-neutral-600">{email || "メール"}</p>
          <div className="mt-6 space-y-6">
            <label className={labelClass}>
              パスワード
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                className={fieldClass}
              />
            </label>
            <NavButton href="/communities" variant="block">
              ログイン
            </NavButton>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <AppHeader title="ログイン" />
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
          <NavButton href="/communities" variant="block">
            Googleでログイン
          </NavButton>
          <NavButton href="/communities" variant="block">
            LINEでログイン
          </NavButton>
        </div>
        <p className="mt-6 text-center text-sm">
          <Link href="/signup" className="underline">
            アカウントを作成
          </Link>
        </p>
      </main>
    </>
  );
}
