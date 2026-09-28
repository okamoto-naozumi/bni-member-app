"use client";

import { getBusinessLinks } from "@/lib/businessLinks";
import type { Member } from "@/lib/members";

/**
 * ビジネス・営業リンク7項目のうち入力済みのものだけをワンタップ遷移ボタンとして並べる。
 * MemberCard(一覧・/team/[id])とMemberDetailModalで共通利用する。
 */
export default function BusinessLinkButtons({
  member,
  size = "sm",
}: {
  member: Member;
  size?: "sm" | "md";
}) {
  const links = getBusinessLinks(member);
  if (links.length === 0) return null;

  const sizeClassName =
    size === "md" ? "gap-2 rounded-full px-3 py-2 text-sm" : "gap-1 rounded-full px-2.5 py-1 text-xs";
  const iconSize = size === "md" ? 16 : 12;

  return (
    <div className="flex flex-wrap gap-1.5">
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <a
            key={link.key}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center font-medium transition-opacity hover:opacity-90 ${sizeClassName} ${link.colorClassName}`}
          >
            <Icon size={iconSize} />
            {link.label}
          </a>
        );
      })}
    </div>
  );
}
