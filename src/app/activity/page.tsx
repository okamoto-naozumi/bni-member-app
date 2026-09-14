"use client";

import { useEffect, useMemo, useState } from "react";
import { DoorOpen, Handshake, History, Megaphone, UserCog, UserPlus } from "lucide-react";
import { fetchActivityLogs, type ActivityActionType, type ActivityLog } from "@/lib/activityLogs";
import { fetchMembers, type Member } from "@/lib/members";
import { getErrorMessage } from "@/lib/errorMessage";

const ACTION_META: Record<
  ActivityActionType,
  { label: string; icon: React.ComponentType<{ size?: number }>; badge: string }
> = {
  member_created: {
    label: "メンバー登録",
    icon: UserPlus,
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
  member_updated: {
    label: "メンバー更新",
    icon: UserCog,
    badge: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  },
  referral_created: {
    label: "リファーラル追加",
    icon: Megaphone,
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  },
  one_on_one_completed: {
    label: "1to1実施",
    icon: Handshake,
    badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  },
  visitor_created: {
    label: "ビジター追加",
    icon: DoorOpen,
    badge: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-300",
  },
};

function formatDateTime(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ActivityPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ActivityActionType | "all">("all");

  useEffect(() => {
    Promise.allSettled([fetchActivityLogs(200), fetchMembers()]).then(
      ([logsResult, membersResult]) => {
        if (logsResult.status === "fulfilled") {
          setLogs(logsResult.value);
        } else {
          setLoadError(getErrorMessage(logsResult.reason));
        }
        if (membersResult.status === "fulfilled") {
          setMembers(membersResult.value);
        }
        setLoading(false);
      }
    );
  }, []);

  const memberMap = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  const filtered = useMemo(
    () => (filter === "all" ? logs : logs.filter((l) => l.action_type === filter)),
    [logs, filter]
  );

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
      <h1 className="flex items-center gap-2 text-xl font-bold text-zinc-900 dark:text-zinc-50">
        <History size={20} />
        活動タイムライン
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        メンバー登録・更新、リファーラル追加、1to1実施、ビジター追加などの操作履歴を新しい順に表示します。
      </p>

      <div className="mt-5 flex w-fit flex-wrap items-center gap-1 rounded-full bg-zinc-100 p-1 dark:bg-zinc-900">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            filter === "all"
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
              : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          }`}
        >
          すべて
        </button>
        {(Object.keys(ACTION_META) as ActivityActionType[]).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setFilter(type)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === type
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            {ACTION_META[type].label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-zinc-500">読み込み中...</p>
      ) : loadError ? (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">{loadError}</p>
      ) : filtered.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">まだ活動履歴がありません。</p>
      ) : (
        <ol className="mt-6 flex flex-col gap-3">
          {filtered.map((log) => {
            const meta = ACTION_META[log.action_type];
            const Icon = meta?.icon ?? History;
            const member = log.member_id ? memberMap.get(log.member_id) : undefined;
            return (
              <li
                key={log.id}
                className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    meta?.badge ?? "bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300"
                  }`}
                >
                  <Icon size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                      {meta?.label ?? log.action_type}
                    </span>
                    {member && (
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                        {member.name}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-zinc-800 dark:text-zinc-200">
                    {log.description}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                    {formatDateTime(log.created_at)}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
