"use client";

import { useActionState } from "react";
import {
  Field,
  fieldClass,
  textareaClass,
  TEXTAREA_ROWS,
  blockButtonClass,
} from "@/components/ui";
import type { FormState } from "@/lib/data/types";

type CommunityFormProps = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
  communityId?: string;
  defaultName?: string;
  defaultComment?: string;
  namePlaceholder?: string;
  commentPlaceholder?: string;
};

export function CommunityForm({
  action,
  submitLabel,
  communityId,
  defaultName = "",
  defaultComment = "",
  namePlaceholder,
  commentPlaceholder,
}: CommunityFormProps) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-6">
      {communityId ? (
        <input type="hidden" name="communityId" value={communityId} />
      ) : null}
      <Field label="麻雀グループ名" error={state.fieldErrors?.name}>
        <input
          type="text"
          name="name"
          defaultValue={defaultName}
          placeholder={namePlaceholder}
          className={fieldClass}
        />
      </Field>
      <Field label="コメント" error={state.fieldErrors?.comment}>
        <textarea
          name="comment"
          rows={TEXTAREA_ROWS}
          defaultValue={defaultComment}
          placeholder={commentPlaceholder}
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
        {submitLabel}
      </button>
    </form>
  );
}
