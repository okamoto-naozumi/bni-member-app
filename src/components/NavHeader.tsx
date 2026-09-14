"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  LayoutGrid,
  FileText,
  Grid3x3,
  CalendarClock,
  CalendarDays,
  Handshake,
  UserPlus,
  Megaphone,
  Library,
  Info,
  Sparkles,
  DatabaseBackup,
  History,
  Images,
} from "lucide-react";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import FontSizeSwitcher from "@/components/FontSizeSwitcher";

const NAV_ITEMS = [
  { href: "/members", label: "メンバー登録", icon: Users },
  { href: "/groups", label: "グループ編成", icon: LayoutGrid },
  { href: "/matrix", label: "サークルマップ", icon: Grid3x3 },
  { href: "/presenters", label: "メインプレゼン", icon: CalendarClock },
  { href: "/calendar", label: "カレンダー", icon: CalendarDays },
  { href: "/one-on-ones", label: "1to1マトリクス", icon: Handshake },
  { href: "/referrals", label: "リファーラル掲示板", icon: Megaphone },
  { href: "/visitors", label: "ビジター追跡", icon: UserPlus },
  { href: "/visitor-generator", label: "招待文ジェネレーター", icon: Sparkles },
  { href: "/portfolio", label: "ポートフォリオ", icon: Images },
  { href: "/activity", label: "活動タイムライン", icon: History },
  { href: "/library", label: "ライブラリ", icon: Library },
  { href: "/pdf", label: "PDF出力", icon: FileText },
  { href: "/admin", label: "バックアップ", icon: DatabaseBackup },
  { href: "/about", label: "概要・ガイド", icon: Info },
];

export default function NavHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-black/90">
      <div className="mx-auto flex max-w-6xl flex-col gap-1.5 px-4 py-2.5 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold tracking-wide text-zinc-900 dark:text-zinc-50">
            BNI ENISHIチャプター メンバー管理
          </span>
          <div className="flex shrink-0 items-center gap-1">
            <FontSizeSwitcher />
            <ThemeSwitcher />
          </div>
        </div>
        <nav className="flex flex-wrap items-center gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname?.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  active
                    ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-black"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
                }`}
              >
                <Icon size={14} />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
