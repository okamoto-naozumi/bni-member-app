"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { Download } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase";
import { fetchMembers, type Member } from "@/lib/members";
import {
  emptyBoardFor,
  loadPatterns,
  loadProxyBadges,
  savePatterns,
  syncBoardWithRoster,
  type Board,
  type GroupDef,
  type GroupPattern,
} from "@/lib/groupBoard";
import { registerPdfFonts } from "@/lib/pdf/fonts";
import { generateQrDataUrl, memberProfileUrl } from "@/lib/qrcode";
import MemberListDocument from "@/lib/pdf/MemberListDocument";
import GroupBoardDocument from "@/lib/pdf/GroupBoardDocument";

type DocKind = "members" | "groups";

const DEBOUNCE_MS = 400;

export default function PdfExportPage() {
  const [ready, setReady] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [patterns, setPatterns] = useState<GroupPattern[]>([]);
  const [selectedPatternId, setSelectedPatternId] = useState<string>("");
  const [chapterName, setChapterName] = useState("BNI サンプルチャプター");
  const [slogan, setSlogan] = useState("Givers Gain® 与える者は与えられる");
  const [activeDoc, setActiveDoc] = useState<DocKind>("members");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [downloading, setDownloading] = useState<DocKind | null>(null);
  const [qrCodeMap, setQrCodeMap] = useState<Record<string, string>>({});

  useEffect(() => {
    registerPdfFonts();
    fetchMembers().then((ms) => {
      const badges = loadProxyBadges();
      const syncedPatterns = loadPatterns().map((p) => syncBoardWithRoster(p, ms, badges));
      savePatterns(syncedPatterns);
      setMembers(ms);
      setPatterns(syncedPatterns);
      setSelectedPatternId(syncedPatterns[0]?.id ?? "");
      setReady(true);
    });
  }, []);

  useEffect(() => {
    const targets = members.filter((m) => m.show_qr_code);
    Promise.all(
      targets.map(async (m) => [m.id, await generateQrDataUrl(memberProfileUrl(m.id))] as const)
    ).then((entries) => setQrCodeMap(Object.fromEntries(entries)));
  }, [members]);

  const selectedPattern = patterns.find((p) => p.id === selectedPatternId) ?? null;
  const selectedBoard: Board = useMemo(
    () => selectedPattern?.board ?? emptyBoardFor([]),
    [selectedPattern]
  );
  const selectedGroups: GroupDef[] = useMemo(
    () => selectedPattern?.groups ?? [],
    [selectedPattern]
  );

  const buildDocument = useCallback(
    (kind: DocKind) =>
      kind === "members" ? (
        <MemberListDocument
          members={members}
          chapterName={chapterName}
          slogan={slogan}
          qrCodeMap={qrCodeMap}
        />
      ) : (
        <GroupBoardDocument
          board={selectedBoard}
          groups={selectedGroups}
          chapterName={chapterName}
        />
      ),
    [members, selectedBoard, selectedGroups, chapterName, slogan, qrCodeMap]
  );

  useEffect(() => {
    if (!ready) return;

    let cancelled = false;
    let objectUrl: string | null = null;

    const timer = setTimeout(() => {
      setPreviewLoading(true);
      pdf(buildDocument(activeDoc))
        .toBlob()
        .then((blob) => {
          if (cancelled) return;
          objectUrl = URL.createObjectURL(blob);
          setPreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return objectUrl;
          });
          setPreviewLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [ready, activeDoc, buildDocument]);

  async function handleDownload(kind: DocKind) {
    setDownloading(kind);
    try {
      const blob = await pdf(buildDocument(kind)).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = kind === "members" ? "bni-member-list.pdf" : "bni-group-assignment.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 sm:px-6">
      <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">PDF出力</h1>

      {!isSupabaseConfigured && (
        <p className="mt-2 rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
          Supabase未設定のため、ダミーデータ・ローカル保存されたグループ配置をもとにPDFを生成しています。
        </p>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-zinc-700 dark:text-zinc-300">
            チャプター名
          </span>
          <input
            value={chapterName}
            onChange={(e) => setChapterName(e.target.value)}
            className="input"
            placeholder="BNI ○○チャプター"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-zinc-700 dark:text-zinc-300">
            スローガン
          </span>
          <input
            value={slogan}
            onChange={(e) => setSlogan(e.target.value)}
            className="input"
            placeholder="Givers Gain® 与える者は与えられる"
          />
        </label>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-full bg-zinc-100 p-1 dark:bg-zinc-900">
          <button
            type="button"
            onClick={() => setActiveDoc("members")}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              activeDoc === "members"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            帳票① メンバーリスト
          </button>
          <button
            type="button"
            onClick={() => setActiveDoc("groups")}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              activeDoc === "groups"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            帳票② グループ配置
          </button>
        </div>

        {activeDoc === "groups" && (
          <label className="flex items-center gap-2 text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">編成パターン:</span>
            <select
              value={selectedPatternId}
              onChange={(e) => setSelectedPatternId(e.target.value)}
              className="input w-56"
            >
              {patterns.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleDownload("members")}
            disabled={!ready || downloading !== null}
            className="flex items-center gap-1.5 rounded-full bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-300"
          >
            <Download size={14} />
            {downloading === "members" ? "生成中..." : "メンバーリストPDF"}
          </button>
          <button
            type="button"
            onClick={() => handleDownload("groups")}
            disabled={!ready || downloading !== null}
            className="flex items-center gap-1.5 rounded-full bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-300"
          >
            <Download size={14} />
            {downloading === "groups" ? "生成中..." : "グループ配置PDF"}
          </button>
        </div>
      </div>

      <div className="relative mt-4 flex-1 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900">
        {!ready ? (
          <p className="p-6 text-sm text-zinc-500">読み込み中...</p>
        ) : (
          <>
            {previewLoading && (
              <div className="absolute right-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs text-white">
                プレビュー更新中...
              </div>
            )}
            {previewUrl ? (
              <iframe
                title="PDFプレビュー"
                src={previewUrl}
                className="h-[75vh] w-full"
              />
            ) : (
              <p className="p-6 text-sm text-zinc-500">プレビューを生成しています...</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
