"use client";

import { useActionState, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Field, fieldClass, blockButtonClass } from "@/components/ui";
import { parseGuestName } from "@/lib/domain";
import type { FormState } from "@/lib/data/types";
import { tournamentCreateDraftQuery } from "@/lib/tournament-create-query";

type AddGuestFormProps = {
  tournamentId?: string;
  action?: (prev: FormState, formData: FormData) => Promise<FormState>;
  draft?: {
    returnPath: string;
    heldOn: string;
    name: string;
    memo: string;
    userIds: string[];
    guestNames: string[];
  };
};

export function AddGuestForm({
  tournamentId,
  action,
  draft,
}: AddGuestFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [localError, setLocalError] = useState("");
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action ?? (async () => ({})),
    {},
  );

  function handleDraftSubmit(event: FormEvent<HTMLFormElement>) {
    if (!draft) {
      return;
    }
    event.preventDefault();
    const parsed = parseGuestName(name, draft.guestNames);
    if (!parsed.ok) {
      setLocalError(parsed.error);
      return;
    }
    router.push(
      `${draft.returnPath}${tournamentCreateDraftQuery({
        heldOn: draft.heldOn,
        name: draft.name,
        memo: draft.memo,
        userIds: draft.userIds,
        guestNames: [...draft.guestNames, parsed.value],
      })}`,
    );
  }

  return (
    <form
      action={action ? formAction : undefined}
      onSubmit={draft ? handleDraftSubmit : undefined}
      className="space-y-6"
    >
      {tournamentId ? (
        <input type="hidden" name="tournamentId" value={tournamentId} />
      ) : null}
      <Field
        label="表示名"
        error={localError || state.fieldErrors?.displayName}
      >
        <input
          type="text"
          name="displayName"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="例: 山田"
          className={fieldClass}
        />
      </Field>
      <p className="text-sm text-muted">
        アカウントを持っていない人を、名前だけで追加します。
      </p>
      {state.formError ? (
        <p className="text-sm text-muted">{state.formError}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className={`${blockButtonClass} disabled:opacity-60`}
      >
        追加する
      </button>
    </form>
  );
}
