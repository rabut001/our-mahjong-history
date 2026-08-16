"use client";

import { useState } from "react";

type AvatarProps = {
  url: string | null;
  name: string;
  sizeClass?: string;
  className?: string;
};

export function Avatar({
  url,
  name,
  sizeClass = "h-12 w-12",
  className = "",
}: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(url) && !failed;

  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-200 text-base ${sizeClass} ${className}`}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url ?? ""}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        name.slice(0, 1)
      )}
    </span>
  );
}
