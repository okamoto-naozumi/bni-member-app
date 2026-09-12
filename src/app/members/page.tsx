"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy } from "@dnd-kit/sortable";
import { pdf } from "@react-pdf/renderer";
import { Download, Grid3x3, LayoutGrid, Search } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase";
import { deleteMember, fetchMembers, reorderMembers, type Member } from "@/lib/members";
import { getErrorMessage } from "@/lib/errorMessage";
import { generateQrDataUrl, memberProfileUrl } from "@/lib/qrcode";
import { registerPdfFonts } from "@/lib/pdf/fonts";
import MemberListDocument from "@/lib/pdf/MemberListDocument";
import { POWER_TEAM_SUGGESTIONS } from "@/lib/powerTeams";
import { buildPowerTeamGroups, getPowerTeamForCategory } from "@/lib/memberPowerTeams";
import MemberCard from "@/components/MemberCard";
import SortableMemberCard from "@/components/SortableMemberCard";
import MemberForm from "@/components/MemberForm";
import MemberDetailModal from "@/components/MemberDetailModal";
import PresenterReminderBanner from "@/components/PresenterReminderBanner";
import PowerTeamCircleMap from "@/components/PowerTeamCircleMap";

type Tab = "list" | "edit";
type SortKey = "kana" | "team" | "created" | "manual";
type ViewMode = "card" | "circle";
type BadgeTier = "gold" | "silver" | "bronze";

const BADGE_TIER_LABELS: Record<BadgeTier, string> = {
  gold: "金バッジ",
  silver: "銀バッジ",
  bronze: "銅バッジ",
};

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "created", label: "登録日順" },
  { value: "kana", label: "五十音順(フリガナ)" },
  { value: "team", label: "チーム順" },
  { value: "manual", label: "手動(ドラッグ&ドロップ)" },
];

function sortMembers(members: Member[], sortKey: SortKey): Member[] {
  const sorted = [...members];
  switch (sortKey) {
    case "kana":
      sorted.sort((a, b) => (a.name_kana || a.name).localeCompare(b.name_kana || b.name, "ja"));
      break;
    case "team":
      sorted.sort((a, b) => {
        if (!a.team && !b.team) return 0;
        if (!a.team) return 1;
        if (!b.team) return -1;
        return a.team.localeCompare(b.team, "ja") || a.name.localeCompare(b.name, "ja");
      });
      break;
    case "manual":
      sorted.sort((a, b) => a.sort_order - b.sort_order);
      break;
    case "created":
    default:
      sorted.sort((a, b) => b.created_at.localeCompare(a.created_at));
      break;
  }
  return sorted;
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("list");
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("created");
  const [detailMember, setDetailMember] = useState<Member | null>(null);
  const [qrCodeMap, setQrCodeMap] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [search, setSearch] = useState("");
  const [wantedReferralOnly, setWantedReferralOnly] = useState(false);
  const [badgeFilters, setBadgeFilters] = useState<Set<BadgeTier>>(new Set());
  const [powerTeamFilter, setPowerTeamFilter] = useState<string | null>(null);
  const [downloadingFullPdf, setDownloadingFullPdf] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  useEffect(() => {
    fetchMembers()
      .then(setMembers)
      .catch((err) => setLoadError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const targets = members.filter((m) => m.show_qr_code);
    if (targets.length === 0) return;
    let cancelled = false;
    Promise.all(
      targets.map(async (m) => [m.id, await generateQrDataUrl(memberProfileUrl(m.id))] as const)
    ).then((entries) => {
      if (cancelled) return;
      setQrCodeMap((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
    });
    return () => {
      cancelled = true;
    };
  }, [members]);

  const sortedMembers = useMemo(() => sortMembers(members, sortKey), [members, sortKey]);

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return sortedMembers.filter((m) => {
      if (query) {
        const haystack = `${m.name} ${m.name_kana} ${m.company}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      if (wantedReferralOnly && !m.wanted_referral.trim()) return false;
      if (badgeFilters.size > 0) {
        const hasSelectedBadge = Array.from(badgeFilters).some((tier) => {
          if (tier === "gold") return Boolean(m.gold_referral.trim());
          if (tier === "silver") return Boolean(m.silver_referral.trim());
          return Boolean(m.bronze_referral.trim());
        });
        if (!hasSelectedBadge) return false;
      }
      if (powerTeamFilter && getPowerTeamForCategory(m.category) !== powerTeamFilter) return false;
      return true;
    });
  }, [sortedMembers, search, wantedReferralOnly, badgeFilters, powerTeamFilter]);

  const powerTeamGroups = useMemo(() => buildPowerTeamGroups(filteredMembers), [filteredMembers]);

  function toggleBadgeFilter(tier: BadgeTier) {
    setBadgeFilters((prev) => {
      const next = new Set(prev);
      if (next.has(tier)) next.delete(tier);
      else next.add(tier);
      return next;
    });
  }

  async function handleDownloadFullMemberListPdf() {
    setDownloadingFullPdf(true);
    setLoadError(null);
    try {
      registerPdfFonts();
      const blob = await pdf(
        <MemberListDocument
          members={members}
          chapterName={members[0]?.chapter ?? ""}
          slogan=""
          qrCodeMap={qrCodeMap}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "bni-member-list.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setLoadError(getErrorMessage(err));
    } finally {
      setDownloadingFullPdf(false);
    }
  }

  function handleSaved(member: Member) {
    setMembers((prev) => {
      const exists = prev.some((m) => m.id === member.id);
      return exists ? prev.map((m) => (m.id === member.id ? member : m)) : [member, ...prev];
    });
    setEditingMember(null);
    setTab("list");
  }

  async function handleDelete(member: Member) {
    if (!window.confirm(`${member.name} さんを削除しますか?この操作は取り消せません。`)) return;
    try {
      await deleteMember(member.id);
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
    } catch (err) {
      setLoadError(getErrorMessage(err));
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = filteredMembers.findIndex((m) => m.id === active.id);
    const newIndex = filteredMembers.findIndex((m) => m.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(filteredMembers, oldIndex, newIndex);
    const orderedIds = reordered.map((m) => m.id);
    const orderMap = new Map(orderedIds.map((id, index) => [id, index]));

    setMembers((prev) =>
      prev.map((m) => (orderMap.has(m.id) ? { ...m, sort_order: orderMap.get(m.id) as number } : m))
    );

    try {
      await reorderMembers(orderedIds);
    } catch (err) {
      setLoadError(getErrorMessage(err));
    }
  }

  function startEdit(member: Member) {
    setEditingMember(member);
    setTab("edit");
  }

  function startCreate() {
    setEditingMember(null);
    setTab("edit");
  }

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          メンバー管理
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadFullMemberListPdf}
            disabled={downloadingFullPdf || members.length === 0}
            className="flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-200 disabled:opacity-50 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <Download size={14} />
            {downloadingFullPdf ? "生成中..." : "全メンバーリストPDF出力"}
          </button>
          <div className="flex items-center gap-1 rounded-full bg-zinc-100 p-1 dark:bg-zinc-900">
            <button
              type="button"
              onClick={() => setTab("list")}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                tab === "list"
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              メンバー一覧
            </button>
            <button
              type="button"
              onClick={startCreate}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                tab === "edit"
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              追加・編集
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <PresenterReminderBanner />
      </div>

      {!isSupabaseConfigured && (
        <p className="mt-2 rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
          Supabase未設定のため、ダミーデータで動作しています(ブラウザのlocalStorageに保存されます)。
          .env.local を設定すると実データベースに接続されます。
        </p>
      )}

      <div className="mt-6">
        {tab === "list" ? (
          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                登録済みメンバー({filteredMembers.length}/{members.length}名)
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <span className="text-zinc-500 dark:text-zinc-400">並び替え:</span>
                  <select
                    value={sortKey}
                    onChange={(e) => setSortKey(e.target.value as SortKey)}
                    className="input w-52"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex items-center gap-1 rounded-full bg-zinc-100 p-1 dark:bg-zinc-900">
                  <button
                    type="button"
                    onClick={() => setViewMode("card")}
                    aria-pressed={viewMode === "card"}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                      viewMode === "card"
                        ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                        : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                    }`}
                  >
                    <LayoutGrid size={14} />
                    カード表示
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("circle")}
                    aria-pressed={viewMode === "circle"}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                      viewMode === "circle"
                        ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                        : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                    }`}
                  >
                    <Grid3x3 size={14} />
                    サークルマップ表示
                  </button>
                </div>
              </div>
            </div>

            <div className="mb-4 flex flex-col gap-2">
              <label className="relative block max-w-sm text-sm">
                <Search
                  size={14}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="氏名・フリガナ・会社名で検索"
                  className="input pl-8"
                />
              </label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setWantedReferralOnly((v) => !v)}
                  aria-pressed={wantedReferralOnly}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    wantedReferralOnly
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  }`}
                >
                  欲しいリファーラルあり
                </button>
                {(Object.keys(BADGE_TIER_LABELS) as BadgeTier[]).map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => toggleBadgeFilter(tier)}
                    aria-pressed={badgeFilters.has(tier)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      badgeFilters.has(tier)
                        ? "bg-amber-500 text-white"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {BADGE_TIER_LABELS[tier]}
                  </button>
                ))}
                {POWER_TEAM_SUGGESTIONS.map((team) => (
                  <button
                    key={team}
                    type="button"
                    onClick={() => setPowerTeamFilter((v) => (v === team ? null : team))}
                    aria-pressed={powerTeamFilter === team}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      powerTeamFilter === team
                        ? "bg-indigo-600 text-white"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {team}
                  </button>
                ))}
              </div>
            </div>

            {sortKey === "manual" && viewMode === "card" && filteredMembers.length > 0 && (
              <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
                カード左上のハンドル(⠿)をドラッグして並べ替えできます。
              </p>
            )}

            {loading ? (
              <p className="text-sm text-zinc-500">読み込み中...</p>
            ) : loadError ? (
              <p className="text-sm text-red-600 dark:text-red-400">{loadError}</p>
            ) : members.length === 0 ? (
              <p className="text-sm text-zinc-500">
                まだメンバーが登録されていません。「追加・編集」タブから登録してください。
              </p>
            ) : filteredMembers.length === 0 ? (
              <p className="text-sm text-zinc-500">
                該当するメンバーがいません。検索条件・タグを変更してください。
              </p>
            ) : viewMode === "circle" ? (
              <PowerTeamCircleMap groups={powerTeamGroups} />
            ) : sortKey === "manual" ? (
              <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                <SortableContext
                  items={filteredMembers.map((m) => m.id)}
                  strategy={rectSortingStrategy}
                >
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {filteredMembers.map((m) => (
                      <SortableMemberCard
                        key={m.id}
                        member={m}
                        qrCodeUrl={qrCodeMap[m.id]}
                        onDetail={() => setDetailMember(m)}
                        onEdit={() => startEdit(m)}
                        onDelete={() => handleDelete(m)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {filteredMembers.map((m) => (
                  <MemberCard
                    key={m.id}
                    member={m}
                    qrCodeUrl={qrCodeMap[m.id]}
                    onDetail={() => setDetailMember(m)}
                    onEdit={() => startEdit(m)}
                    onDelete={() => handleDelete(m)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-3xl">
            <h2 className="mb-3 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
              {editingMember ? `${editingMember.name} を編集` : "新規メンバーを登録"}
            </h2>
            <MemberForm
              key={editingMember?.id ?? "new"}
              initial={editingMember}
              onSaved={handleSaved}
              onCancel={editingMember ? () => setTab("list") : undefined}
            />
          </div>
        )}
      </div>

      {detailMember && (
        <MemberDetailModal member={detailMember} onClose={() => setDetailMember(null)} />
      )}
    </div>
  );
}
