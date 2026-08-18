"use client";

import { useActionState, useState } from "react";
import { blockButtonClass, outlineBlockButtonClass } from "@/components/ui";
import { formatHeldOn, INVITE_DEFAULT_DAYS } from "@/lib/domain";
import type { CommunityInvite, FormState } from "@/lib/data/types";

type InvitePanelProps = {
  communityId: string;
  invite: CommunityInvite | null;
  issueAction: (prev: FormState, formData: FormData) => Promise<FormState>;
  reissueAction: (prev: FormState, formData: FormData) => Promise<FormState>;
};

function expiryYmd(expiresAt: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
  }).format(new Date(expiresAt));
}

function copyText(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text).then(
      () => true,
      () => copyWithExecCommand(text),
    );
  }
  return Promise.resolve(copyWithExecCommand(text));
}

function copyWithExecCommand(text: string): boolean {
  const input = document.createElement("textarea");
  input.value = text;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.top = "0";
  input.style.left = "0";
  input.style.width = "2em";
  input.style.height = "2em";
  input.style.padding = "0";
  input.style.border = "none";
  input.style.outline = "none";
  input.style.boxShadow = "none";
  input.style.background = "transparent";
  document.body.appendChild(input);
  input.focus();
  input.select();
  input.setSelectionRange(0, text.length);
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  document.body.removeChild(input);
  return ok;
}

export function InvitePanel({
  communityId,
  invite,
  issueAction,
  reissueAction,
}: InvitePanelProps) {
  const [issueState, issueFormAction, issuePending] = useActionState(
    issueAction,
    {},
  );
  const [reissueState, reissueFormAction, reissuePending] = useActionState(
    reissueAction,
    {},
  );
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  async function copyCode() {
    if (!invite) {
      return;
    }
    const ok = await copyText(invite.code);
    setCopied(ok);
    setCopyFailed(!ok);
  }

  if (!invite) {
    return (
      <form action={issueFormAction} className="space-y-6">
        <input type="hidden" name="communityId" value={communityId} />
        <p className="text-sm text-muted">
          招待コードはまだありません。発行すると、発行から
          {INVITE_DEFAULT_DAYS}日間使えます。
        </p>
        {issueState.formError ? (
          <p className="text-sm text-muted">{issueState.formError}</p>
        ) : null}
        <button
          type="submit"
          disabled={issuePending}
          className={`${blockButtonClass} disabled:opacity-60`}
        >
          発行する
        </button>
      </form>
    );
  }

  const expiryDate = expiryYmd(invite.expiresAt);

  return (
    <div>
      <p className="text-sm text-muted">招待コード</p>
      <p className="mt-2 text-center font-mono text-2xl tracking-widest">
        {invite.code}
      </p>
      <p className="mt-4 text-sm text-muted">
        {formatHeldOn(expiryDate)}まで（発行から{INVITE_DEFAULT_DAYS}
        日間）
      </p>
      <p className="mt-2 text-sm text-muted">
        期限切れまで何度でも使えます。参加する人はログインしたあと、このコードを入力します。
      </p>
      <div className="mt-6 space-y-3">
        <button
          type="button"
          onClick={copyCode}
          className={outlineBlockButtonClass}
        >
          コピー
        </button>
        {copied ? <p className="text-sm text-muted">コピーしました。</p> : null}
        {copyFailed ? (
          <p className="text-sm text-muted">
            コピーできませんでした。コードを長押ししてコピーしてください。
          </p>
        ) : null}
        <form action={reissueFormAction}>
          <input type="hidden" name="communityId" value={communityId} />
          {reissueState.formError ? (
            <p className="mb-3 text-sm text-muted">{reissueState.formError}</p>
          ) : null}
          <button
            type="submit"
            disabled={reissuePending}
            className={`${outlineBlockButtonClass} disabled:opacity-60`}
          >
            再発行する
          </button>
        </form>
      </div>
    </div>
  );
}
