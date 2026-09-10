"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, LayoutGrid, FileText, Grid3x3, CalendarClock, Megaphone } from "lucide-react";

const NAV_ITEMS = [
  { href: "/members", label: "メンバー登録", icon: Users },
  { href: "/groups", label: "グループ編成", icon: LayoutGrid },
  { href: "/matrix", label: "サークルマップ", icon: Grid3x3 },
  { href: "/presenters", label: "メインプレゼン", icon: CalendarClock },
  { href: "/referrals", label: "リファーラル掲示板", icon: Megaphone },
  { href: "/pdf", label: "PDF出力", icon: FileText },
];

export default function NavHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-black/90">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3 sm:px-6">
        <span className="text-sm font-semibold tracking-wide text-zinc-900 dark:text-zinc-50">
          BNI ENISHIチャプター メンバー管理
        </span>
        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname?.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-black"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
