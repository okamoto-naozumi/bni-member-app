import Link from "next/link";
import { Sparkles, Users } from "lucide-react";
import type { PowerTeamGroup } from "@/lib/memberPowerTeams";

export default function PowerTeamCircleMap({ groups }: { groups: PowerTeamGroup[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {groups.map((group) => (
        <div
          key={group.name}
          className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {group.name}
            </h3>
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
              <Users size={11} />
              {group.members.length}名
            </span>
          </div>

          {group.members.length === 0 ? (
            <p className="text-xs text-zinc-400 dark:text-zinc-600">所属メンバーがいません。</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {group.members.map((m) => (
                <Link
                  key={m.id}
                  href={`/m/${m.id}`}
                  target="_blank"
                  className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300 dark:hover:bg-emerald-950/50"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- photo_icon_url may be a data URL or arbitrary remote host */}
                  <img
                    src={m.photo_icon_url}
                    alt={m.name}
                    className="h-4 w-4 shrink-0 rounded-full object-cover"
                  />
                  <span className="truncate">{m.name}</span>
                </Link>
              ))}
            </div>
          )}

          {group.openCategories.length > 0 && (
            <div className="flex flex-wrap gap-1.5 border-t border-dashed border-amber-200 pt-3 dark:border-amber-900">
              {group.openCategories.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                >
                  <Sparkles size={10} />
                  {c} 募集中
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
