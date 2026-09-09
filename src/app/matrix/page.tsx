"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase";
import { fetchMembers, type Member } from "@/lib/members";
import { CONTACT_CIRCLES, buildMatrixCategories, getContactCircle } from "@/lib/contactCircles";

export default function MatrixPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembers()
      .then(setMembers)
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(
    () => buildMatrixCategories(members.map((m) => m.category)),
    [members]
  );

  const membersByCategory = useMemo(() => {
    const map = new Map<string, Member[]>();
    for (const m of members) {
      if (!m.category) continue;
      const list = map.get(m.category) ?? [];
      list.push(m);
      map.set(m.category, list);
    }
    return map;
  }, [members]);

  const openSlotCount = useMemo(() => {
    let count = 0;
    for (const circle of CONTACT_CIRCLES) {
      for (const category of categories) {
        if (getContactCircle(category).id !== circle.id) continue;
        if (!membersByCategory.get(category)?.length) count += 1;
      }
    }
    return count;
  }, [categories, membersByCategory]);

  return (
    <div className="mx-auto w-full max-w-none flex-1 px-4 py-8 sm:px-6">
      <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
        コンタクトサークルマップ
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        縦軸: コンタクトサークル / 横軸: カテゴリー・専門分野。
        <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
          <Sparkles size={11} />
          絶賛募集中
        </span>
        の枠は空席のカテゴリーです。
      </p>

      {!isSupabaseConfigured && (
        <p className="mt-2 rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
          Supabase未設定のため、ダミーデータをもとに表示しています。
        </p>
      )}

      {loading ? (
        <p className="mt-6 text-sm text-zinc-500">読み込み中...</p>
      ) : (
        <>
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            現在の空き枠(募集中カテゴリー): <span className="font-semibold text-amber-700 dark:text-amber-400">{openSlotCount}</span> 件
          </p>

          <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 min-w-[140px] border-b border-r border-zinc-200 bg-zinc-50 px-3 py-2 text-left font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                    コンタクトサークル ＼ カテゴリー
                  </th>
                  {categories.map((category) => (
                    <th
                      key={category}
                      className="min-w-[130px] border-b border-zinc-200 bg-zinc-50 px-2 py-2 text-left text-xs font-semibold text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
                    >
                      {category}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CONTACT_CIRCLES.map((circle) => (
                  <tr key={circle.id}>
                    <th className="sticky left-0 z-10 border-b border-r border-zinc-200 bg-white px-3 py-2 text-left text-sm font-semibold text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
                      {circle.name}
                    </th>
                    {categories.map((category) => {
                      const relevant = getContactCircle(category).id === circle.id;
                      const inCell = membersByCategory.get(category) ?? [];

                      if (!relevant) {
                        return (
                          <td
                            key={category}
                            className="border-b border-zinc-100 bg-zinc-50/50 px-2 py-2 text-center text-xs text-zinc-300 dark:border-zinc-900 dark:bg-zinc-950 dark:text-zinc-700"
                          >
                            ―
                          </td>
                        );
                      }

                      if (inCell.length === 0) {
                        return (
                          <td
                            key={category}
                            className="border-b border-dashed border-amber-300 bg-amber-50 px-2 py-2 text-center align-middle dark:border-amber-800 dark:bg-amber-950/30"
                          >
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
                              <Sparkles size={11} />
                              募集中
                            </span>
                          </td>
                        );
                      }

                      return (
                        <td
                          key={category}
                          className="border-b border-zinc-100 bg-white px-2 py-2 align-top dark:border-zinc-900 dark:bg-zinc-950"
                        >
                          <div className="flex flex-col gap-1.5">
                            {inCell.map((m) => (
                              <Link
                                key={m.id}
                                href={`/m/${m.id}`}
                                target="_blank"
                                className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-1.5 py-1 text-xs text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300 dark:hover:bg-emerald-950/50"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element -- photo_icon_url may be a data URL or arbitrary remote host */}
                                <img
                                  src={m.photo_icon_url}
                                  alt={m.name}
                                  className="h-5 w-5 shrink-0 rounded-full object-cover"
                                />
                                <span className="truncate">{m.name}</span>
                              </Link>
                            ))}
                          </div>
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
    </div>
  );
}
