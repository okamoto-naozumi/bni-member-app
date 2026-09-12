"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2, UserPlus, Users } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase";
import { fetchMembers, type Member } from "@/lib/members";
import {
  deleteVisitorInvite,
  fetchVisitorInvites,
  VISITOR_STATUS_LABELS,
  VISITOR_STATUS_OPTIONS,
  type VisitorInvite,
  type VisitorInviteStatus,
} from "@/lib/visitorInvites";
import { getCategoryColor } from "@/lib/categoryColors";
import { getErrorMessage } from "@/lib/errorMessage";
import VisitorInviteForm from "@/components/VisitorInviteForm";

const COLUMN_STYLES: Record<VisitorInviteStatus, string> = {
  invited: "border-t-4 border-t-sky-400",
  confirmed: "border-t-4 border-t-indigo-400",
  considering: "border-t-4 border-t-amber-400",
  joined: "border-t-4 border-t-emerald-400",
};

export default function VisitorsPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<VisitorInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formState, setFormState] = useState<{
    open: boolean;
    editing: VisitorInvite | null;
    defaultStatus?: VisitorInviteStatus;
  }>({ open: false, editing: null });

  useEffect(() => {
    Promise.allSettled([fetchMembers(), fetchVisitorInvites()]).then(
      ([membersResult, invitesResult]) => {
        if (membersResult.status === "fulfilled") {
          setMembers(membersResult.value);
        } else {
          setLoadError(getErrorMessage(membersResult.reason));
        }
        if (invitesResult.status === "fulfilled") {
          setInvites(invitesResult.value);
        } else {
          setLoadError((prev) => prev ?? getErrorMessage(invitesResult.reason));
        }
        setLoading(false);
      }
    );
  }, []);

  const memberMap = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  const invitesByStatus = useMemo(() => {
    const map = new Map<VisitorInviteStatus, VisitorInvite[]>();
    for (const status of VISITOR_STATUS_OPTIONS) map.set(status, []);
    for (const invite of invites) {
      map.get(invite.status)?.push(invite);
    }
    return map;
  }, [invites]);

  function handleSaved(invite: VisitorInvite) {
    setInvites((prev) => {
      const exists = prev.some((v) => v.id === invite.id);
      return exists ? prev.map((v) => (v.id === invite.id ? invite : v)) : [invite, ...prev];
    });
    setFormState({ open: false, editing: null });
  }

  async function handleDelete(invite: VisitorInvite) {
    if (!window.confirm(`「${invite.visitor_name}」さんの招待記録を削除しますか?`)) return;
    try {
      await deleteVisitorInvite(invite.id);
      setInvites((prev) => prev.filter((v) => v.id !== invite.id));
    } catch (err) {
      setLoadError(getErrorMessage(err));
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-zinc-900 dark:text-zinc-50">
            <UserPlus size={20} />
            ビジター招待・追跡ボード
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            打診中から入会済までのステータスを4カラムで管理します。
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormState({ open: true, editing: null })}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-300"
        >
          <Plus size={14} />
          招待を追加
        </button>
      </div>

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
        <p className="mt-4 text-sm text-zinc-500">読み込み中...</p>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {VISITOR_STATUS_OPTIONS.map((status) => {
            const items = invitesByStatus.get(status) ?? [];
            return (
              <div
                key={status}
                className={`flex flex-col gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/40 ${COLUMN_STYLES[status]}`}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                    {VISITOR_STATUS_LABELS[status]}
                  </h2>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
                    {items.length}
                  </span>
                </div>

                {items.length === 0 ? (
                  <p className="text-xs text-zinc-400 dark:text-zinc-600">該当なし</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {items.map((invite) => {
                      const color = getCategoryColor(invite.category);
                      const inviter = invite.inviter_member_id
                        ? memberMap.get(invite.inviter_member_id)
                        : undefined;
                      return (
                        <div
                          key={invite.id}
                          className="flex flex-col gap-1.5 rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                              {invite.visitor_name}
                            </span>
                            {invite.category && (
                              <span
                                className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                                style={{ backgroundColor: color.bg, color: color.text }}
                              >
                                {invite.category}
                              </span>
                            )}
                          </div>

                          {invite.notes && (
                            <p className="line-clamp-3 whitespace-pre-wrap text-xs text-zinc-600 dark:text-zinc-400">
                              {invite.notes}
                            </p>
                          )}

                          <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                            <Users size={11} />
                            招待担当: {inviter?.name ?? "未設定"}
                          </div>

                          <div className="mt-1 flex items-center gap-1 self-end">
                            <button
                              type="button"
                              onClick={() => setFormState({ open: true, editing: invite })}
                              className="flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                            >
                              <Pencil size={12} />
                              編集
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(invite)}
                              className="flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
                            >
                              <Trash2 size={12} />
                              削除
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {formState.open && (
        <VisitorInviteForm
          initial={formState.editing}
          members={members}
          onSaved={handleSaved}
          onDeleted={(invite) => {
            setInvites((prev) => prev.filter((v) => v.id !== invite.id));
            setFormState({ open: false, editing: null });
          }}
          onCancel={() => setFormState({ open: false, editing: null })}
        />
      )}
    </div>
  );
}
