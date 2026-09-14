"use client";

import { useEffect, useMemo, useState } from "react";
import { Images, Pencil, Plus, Trash2, X } from "lucide-react";
import { deletePortfolio, fetchPortfolios, type Portfolio } from "@/lib/portfolios";
import { fetchMembers, type Member } from "@/lib/members";
import { getErrorMessage } from "@/lib/errorMessage";
import PortfolioForm from "@/components/PortfolioForm";

const ALL_MEMBER = "すべて";

export default function PortfolioPage() {
  const [items, setItems] = useState<Portfolio[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [memberFilter, setMemberFilter] = useState<string>(ALL_MEMBER);
  const [formState, setFormState] = useState<{ open: boolean; editing: Portfolio | null }>({
    open: false,
    editing: null,
  });
  const [lightbox, setLightbox] = useState<Portfolio | null>(null);

  useEffect(() => {
    Promise.allSettled([fetchPortfolios(), fetchMembers()]).then(([itemsResult, membersResult]) => {
      if (itemsResult.status === "fulfilled") {
        setItems(itemsResult.value);
      } else {
        setLoadError(getErrorMessage(itemsResult.reason));
      }
      if (membersResult.status === "fulfilled") {
        setMembers(membersResult.value);
      }
      setLoading(false);
    });
  }, []);

  const memberMap = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  const contributingMembers = useMemo(() => {
    const ids = new Set(items.map((p) => p.member_id).filter((id): id is string => Boolean(id)));
    return members.filter((m) => ids.has(m.id));
  }, [items, members]);

  const filtered = useMemo(
    () => (memberFilter === ALL_MEMBER ? items : items.filter((p) => p.member_id === memberFilter)),
    [items, memberFilter]
  );

  function handleSaved(portfolio: Portfolio) {
    setItems((prev) => {
      const exists = prev.some((p) => p.id === portfolio.id);
      return exists ? prev.map((p) => (p.id === portfolio.id ? portfolio : p)) : [portfolio, ...prev];
    });
    setFormState({ open: false, editing: null });
  }

  async function handleDelete(portfolio: Portfolio) {
    if (!window.confirm(`「${portfolio.title}」を削除しますか?`)) return;
    try {
      await deletePortfolio(portfolio.id);
      setItems((prev) => prev.filter((p) => p.id !== portfolio.id));
      setLightbox((prev) => (prev?.id === portfolio.id ? null : prev));
    } catch (err) {
      setLoadError(getErrorMessage(err));
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-zinc-900 dark:text-zinc-50">
            <Images size={20} />
            商品・事例ポートフォリオ
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            メンバーの取扱商品・施工事例・サービス実績を写真付きで紹介するギャラリーです。
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormState({ open: true, editing: null })}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-300"
        >
          <Plus size={14} />
          ポートフォリオを追加
        </button>
      </div>

      {contributingMembers.length > 0 && (
        <div className="mt-5 flex w-fit flex-wrap items-center gap-1 rounded-full bg-zinc-100 p-1 dark:bg-zinc-900">
          <button
            type="button"
            onClick={() => setMemberFilter(ALL_MEMBER)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              memberFilter === ALL_MEMBER
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            すべて
          </button>
          {contributingMembers.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMemberFilter(m.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                memberFilter === m.id
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              {m.name}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <p className="mt-4 text-sm text-zinc-500">読み込み中...</p>
      ) : loadError ? (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">{loadError}</p>
      ) : filtered.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">
          該当するポートフォリオがありません。「ポートフォリオを追加」から登録してください。
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => {
            const member = p.member_id ? memberMap.get(p.member_id) : undefined;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setLightbox(p)}
                className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white text-left shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="aspect-[4/3] w-full shrink-0 overflow-hidden bg-zinc-100 dark:bg-zinc-900">
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element -- image_url may be a data URL or arbitrary remote host
                    <img src={p.image_url} alt={p.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-zinc-300 dark:text-zinc-700">
                      <Images size={28} />
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-1 p-3">
                  {p.category && (
                    <span className="w-fit rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                      {p.category}
                    </span>
                  )}
                  <h3 className="truncate font-semibold text-zinc-900 dark:text-zinc-50">
                    {p.title}
                  </h3>
                  {member && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{member.name}</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {formState.open && (
        <PortfolioForm
          initial={formState.editing}
          members={members}
          onSaved={handleSaved}
          onCancel={() => setFormState({ open: false, editing: null })}
        />
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setLightbox(null)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-y-auto rounded-xl bg-white shadow-xl dark:bg-zinc-950"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 pb-0">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {lightbox.title}
              </h2>
              <button
                type="button"
                onClick={() => setLightbox(null)}
                className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
                aria-label="閉じる"
              >
                <X size={16} />
              </button>
            </div>
            {lightbox.image_url && (
              // eslint-disable-next-line @next/next/no-img-element -- image_url may be a data URL or arbitrary remote host
              <img
                src={lightbox.image_url}
                alt={lightbox.title}
                className="mt-3 max-h-[50vh] w-full object-contain"
              />
            )}
            <div className="flex flex-col gap-2 p-4">
              <div className="flex flex-wrap items-center gap-2">
                {lightbox.category && (
                  <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                    {lightbox.category}
                  </span>
                )}
                {lightbox.member_id && memberMap.get(lightbox.member_id) && (
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {memberMap.get(lightbox.member_id)?.name}
                  </span>
                )}
              </div>
              {lightbox.description && (
                <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                  {lightbox.description}
                </p>
              )}
              <div className="mt-2 flex items-center gap-1 self-end">
                <button
                  type="button"
                  onClick={() => {
                    setFormState({ open: true, editing: lightbox });
                    setLightbox(null);
                  }}
                  className="flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  <Pencil size={12} />
                  編集
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(lightbox)}
                  className="flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
                >
                  <Trash2 size={12} />
                  削除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
