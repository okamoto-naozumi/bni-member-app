"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Handshake, Sparkles } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase";
import { fetchMembers, type Member } from "@/lib/members";
import { fetchOneOnOnes, pairKey, type OneOnOne } from "@/lib/oneOnOnes";
import { getErrorMessage } from "@/lib/errorMessage";
import OneOnOneForm from "@/components/OneOnOneForm";

export default function OneOnOnesPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [records, setRecords] = useState<OneOnOne[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activePair, setActivePair] = useState<{ a: Member; b: Member } | null>(null);

  useEffect(() => {
    Promise.allSettled([fetchMembers(), fetchOneOnOnes()]).then(([membersResult, recordsResult]) => {
      if (membersResult.status === "fulfilled") {
        setMembers(
          [...membersResult.value].sort((a, b) =>
            (a.name_kana || a.name).localeCompare(b.name_kana || b.name, "ja")
          )
        );
      } else {
        setLoadError(getErrorMessage(membersResult.reason));
      }
      if (recordsResult.status === "fulfilled") {
        setRecords(recordsResult.value);
      } else {
        setLoadError((prev) => prev ?? getErrorMessage(recordsResult.reason));
      }
      setLoading(false);
    });
  }, []);

  const recordMap = useMemo(() => {
    const map = new Map<string, OneOnOne>();
    for (const r of records) map.set(pairKey(r.member_a_id, r.member_b_id), r);
    return map;
  }, [records]);

  const totalPairs = (members.length * (members.length - 1)) / 2;
  const donePairCount = useMemo(() => {
    const ids = new Set(members.map((m) => m.id));
    let count = 0;
    for (const r of records) {
      if (ids.has(r.member_a_id) && ids.has(r.member_b_id)) count++;
    }
    return count;
  }, [records, members]);
  const completionRate = totalPairs > 0 ? Math.round((donePairCount / totalPairs) * 100) : 0;

  function handleSaved(record: OneOnOne) {
    setRecords((prev) => {
      const key = pairKey(record.member_a_id, record.member_b_id);
      const exists = prev.some((r) => pairKey(r.member_a_id, r.member_b_id) === key);
      return exists
        ? prev.map((r) => (pairKey(r.member_a_id, r.member_b_id) === key ? record : r))
        : [...prev, record];
    });
    setActivePair(null);
  }

  function handleDeleted(id: string) {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    setActivePair(null);
  }

  return (
    <div className="mx-auto w-full max-w-none flex-1 px-4 py-8 sm:px-6">
      <h1 className="flex items-center gap-2 text-xl font-bold text-zinc-900 dark:text-zinc-50">
        <Handshake size={20} />
        1to1実施マトリクス
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        セルをクリックして1to1の実施日・メモを記録できます。
        <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
          <Sparkles size={11} />
          未実施
        </span>
        のペアはハイライト表示されます。
      </p>

      {!isSupabaseConfigured && (
        <p className="mt-3 rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
          Supabase未設定のため、ダミーデータで動作しています(ブラウザのlocalStorageに保存されます)。
        </p>
      )}
      {loadError && (
        <p className="mt-3 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {loadError}
        </p>
      )}

      {loading ? (
        <p className="mt-6 text-sm text-zinc-500">読み込み中...</p>
      ) : members.length < 2 ? (
        <p className="mt-6 text-sm text-zinc-500">
          1to1マトリクスの表示にはメンバーが2名以上必要です。
        </p>
      ) : (
        <>
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            実施率:{" "}
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
              {donePairCount} / {totalPairs}ペア({completionRate}%)
            </span>
          </p>

          <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 min-w-[140px] border-b border-r border-zinc-200 bg-zinc-50 px-3 py-2 text-left font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                    実施者 ＼ 相手
                  </th>
                  {members.map((m) => (
                    <th
                      key={m.id}
                      className="min-w-[90px] border-b border-zinc-200 bg-zinc-50 px-2 py-2 text-center text-xs font-semibold text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
                    >
                      {m.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.map((rowMember) => (
                  <tr key={rowMember.id}>
                    <th className="sticky left-0 z-10 border-b border-r border-zinc-200 bg-white px-3 py-2 text-left text-sm font-semibold text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
                      {rowMember.name}
                    </th>
                    {members.map((colMember) => {
                      if (rowMember.id === colMember.id) {
                        return (
                          <td
                            key={colMember.id}
                            className="border-b border-zinc-100 bg-zinc-50 px-2 py-2 text-center text-zinc-300 dark:border-zinc-900 dark:bg-zinc-900 dark:text-zinc-700"
                          >
                            ―
                          </td>
                        );
                      }
                      const record = recordMap.get(pairKey(rowMember.id, colMember.id));
                      return (
                        <td
                          key={colMember.id}
                          className="border-b border-zinc-100 p-1 text-center dark:border-zinc-900"
                        >
                          <button
                            type="button"
                            onClick={() => setActivePair({ a: rowMember, b: colMember })}
                            title={
                              record
                                ? `実施日: ${record.completed_at}${record.note ? ` / ${record.note}` : ""}`
                                : "クリックして1to1を記録"
                            }
                            className={`flex h-9 w-full items-center justify-center rounded-md text-xs font-medium transition-colors ${
                              record
                                ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60"
                                : "bg-amber-50 text-amber-500 hover:bg-amber-100 dark:bg-amber-950/20 dark:text-amber-500 dark:hover:bg-amber-950/40"
                            }`}
                          >
                            {record ? <Check size={14} /> : <Sparkles size={12} />}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activePair && (
        <OneOnOneForm
          memberA={activePair.a}
          memberB={activePair.b}
          existing={recordMap.get(pairKey(activePair.a.id, activePair.b.id)) ?? null}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
          onCancel={() => setActivePair(null)}
        />
      )}
    </div>
  );
}
