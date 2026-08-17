import Link from "next/link";
import { Avatar } from "@/components/Avatar";

type MemberIcon = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  isCurrentUser: boolean;
};

type MemberIconRowProps = {
  members: MemberIcon[];
  from: string;
};

export function MemberIconRow({ members, from }: MemberIconRowProps) {
  return (
    <div className="overflow-x-auto">
      <ul className="flex w-max gap-3">
        {members.map((member) => {
          const label = member.isCurrentUser ? "自分" : member.displayName;
          return (
            <li key={member.userId} className="w-16 shrink-0 text-center">
              <Link
                href={`/profiles/${member.userId}?from=${encodeURIComponent(from)}`}
                aria-label={`${label}の詳細`}
                className="block"
              >
                <Avatar
                  url={member.avatarUrl}
                  name={member.displayName}
                  className="mx-auto"
                />
                <span className="mt-1 block truncate text-xs">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
