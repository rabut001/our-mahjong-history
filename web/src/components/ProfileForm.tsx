"use client";

import { useActionState } from "react";
import { Avatar } from "@/components/Avatar";
import { DangerAction } from "@/components/DangerAction";
import {
  Field,
  fieldClass,
  textareaClass,
  TEXTAREA_ROWS,
  blockButtonClass,
} from "@/components/ui";
import { signOutToLoginAction } from "@/lib/data/auth-actions";
import type { FormState, HomeProfile } from "@/lib/data/types";

type ProfileFormProps = {
  profile: HomeProfile;
  updateAction: (prev: FormState, formData: FormData) => Promise<FormState>;
  withdrawAction: (prev: FormState, formData: FormData) => Promise<FormState>;
};

export function ProfileForm({
  profile,
  updateAction,
  withdrawAction,
}: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(updateAction, {});

  return (
    <>
      <form action={formAction} className="space-y-6">
        <div className="text-center">
          <Avatar
            url={profile.avatarUrl}
            name={profile.displayName}
            sizeClass="h-20 w-20 text-xl"
            className="mx-auto"
          />
        </div>
        <Field label="表示名" error={state.fieldErrors?.displayName}>
          <input
            type="text"
            name="displayName"
            defaultValue={profile.displayName}
            className={fieldClass}
          />
        </Field>
        <Field label="コメント" error={state.fieldErrors?.comment}>
          <textarea
            name="comment"
            rows={TEXTAREA_ROWS}
            defaultValue={profile.comment}
            placeholder="例: 金曜はだいたい参加します"
            className={textareaClass}
          />
        </Field>
        {state.formError ? (
          <p className="text-sm text-muted">{state.formError}</p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className={`${blockButtonClass} disabled:opacity-60`}
        >
          保存する
        </button>
      </form>
      <form action={signOutToLoginAction} className="mt-8 text-center">
        <button type="submit" className="text-sm text-muted">
          ログアウト
        </button>
      </form>
      <DangerAction
        label="アプリを退会する"
        dialogTitle="アプリを退会しますか？"
        dialogBody="アカウントが消え、参加している麻雀グループから外れます。元に戻せません。"
        confirmLabel="退会する"
        doneHref="/login"
        action={withdrawAction}
      />
    </>
  );
}
