"use client";

import { useState } from "react";
import { NavButton } from "@/components/NavButton";
import { Field, fieldClass } from "@/components/ui";

type AddGuestFormProps = {
  backHref: string;
};

export function AddGuestForm({ backHref }: AddGuestFormProps) {
  const [name, setName] = useState("");

  return (
    <div className="space-y-6">
      <Field label="表示名">
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
      <NavButton href={backHref} variant="block">
        追加する
      </NavButton>
    </div>
  );
}
