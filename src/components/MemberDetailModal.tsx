"use client";

import { useEffect, useState } from "react";
import {
  X,
  Mail,
  Phone,
  Globe,
  Award,
  FileText,
  Download,
  ExternalLink,
  BookUser,
  ClipboardList,
  MapPin,
  Home,
  Clock,
  Users,
  Heart,
  PawPrint,
  Music,
  Coffee,
  Briefcase,
  Sparkles,
  Target,
  Trophy,
  Network,
  Wrench,
  Flame,
  Key,
  ChevronDown,
  Copy,
  Check,
  QrCode,
  Info,
  LayoutGrid,
  Images,
  Calendar,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import type { Member } from "@/lib/members";
import { registerPdfFonts } from "@/lib/pdf/fonts";
import { resolveImageDataUri } from "@/lib/pdf/imageSrc";
import { generateQrDataUrl, memberProfileUrl } from "@/lib/qrcode";
import OneToOneSheetDocument from "@/lib/pdf/OneToOneSheetDocument";
import { getErrorMessage } from "@/lib/errorMessage";
import { fetchPortfolios, type Portfolio } from "@/lib/portfolios";
import ShareButtons from "@/components/ShareButtons";
import MemberWorksheetModal from "@/components/MemberWorksheetModal";
import BusinessLinkButtons from "@/components/BusinessLinkButtons";
import { getBusinessLinks } from "@/lib/businessLinks";

const PERSONAL_ITEMS: Array<{ key: keyof Member; label: string; icon: LucideIcon }> = [
  { key: "bio_hometown", label: "出身地", icon: MapPin },
  { key: "bio_residence", label: "居住地", icon: Home },
  { key: "bio_residence_years", label: "居住年数", icon: Clock },
  { key: "bio_family", label: "家族", icon: Users },
  { key: "bio_spouse", label: "配偶者", icon: Heart },
  { key: "bio_pet", label: "ペット", icon: PawPrint },
  { key: "bio_hobby", label: "趣味", icon: Music },
  { key: "bio_other_interests", label: "その他の関心事", icon: Coffee },
  { key: "bio_past_occupation", label: "過去に経験した職業", icon: Briefcase },
  { key: "bio_unknown_fact", label: "誰も知らない私", icon: Sparkles },
];

const GAINS_ITEMS: Array<{
  key: keyof Member;
  label: string;
  sub: string;
  icon: LucideIcon;
  colorClassName: string;
}> = [
  {
    key: "gains_goals",
    label: "Goals",
    sub: "目標",
    icon: Target,
    colorClassName: "border-blue-200 bg-blue-50 dark:border-blue-800/50 dark:bg-blue-950/30",
  },
  {
    key: "gains_accomplishments",
    label: "Accomplishments",
    sub: "実績",
    icon: Trophy,
    colorClassName:
      "border-emerald-200 bg-emerald-50 dark:border-emerald-800/50 dark:bg-emerald-950/30",
  },
  {
    key: "gains_interests",
    label: "Interests",
    sub: "興味",
    icon: Sparkles,
    colorClassName: "border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-950/30",
  },
  {
    key: "gains_networks",
    label: "Networks",
    sub: "人脈",
    icon: Network,
    colorClassName:
      "border-purple-200 bg-purple-50 dark:border-purple-800/50 dark:bg-purple-950/30",
  },
  {
    key: "gains_skills",
    label: "Skills",
    sub: "スキル",
    icon: Wrench,
    colorClassName:
      "border-indigo-200 bg-indigo-50 dark:border-indigo-800/50 dark:bg-indigo-950/30",
  },
];

const DETAIL_TABS = [
  { key: "overview", label: "概要・基本情報", icon: Info },
  { key: "gains", label: "G.A.I.N.S. (1to1)", icon: Sparkles },
  { key: "portfolio", label: "実績・ポートフォリオ", icon: LayoutGrid },
] as const;
type DetailTab = (typeof DETAIL_TABS)[number]["key"];

export default function MemberDetailModal({
  member,
  onClose,
}: {
  member: Member;
  onClose: () => void;
}) {
  const [generatingSheet, setGeneratingSheet] = useState(false);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [worksheet, setWorksheet] = useState<"bio" | "gains" | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrLightboxOpen, setQrLightboxOpen] = useState(false);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [portfoliosLoading, setPortfoliosLoading] = useState(true);

  useEffect(() => {
    if (!member.show_qr_code) return;
    let cancelled = false;
    generateQrDataUrl(memberProfileUrl(member.id)).then((url) => {
      if (!cancelled) setQrDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [member.id, member.show_qr_code]);

  useEffect(() => {
    let cancelled = false;
    fetchPortfolios()
      .then((all) => {
        if (!cancelled) setPortfolios(all.filter((p) => p.member_id === member.id));
      })
      .finally(() => {
        if (!cancelled) setPortfoliosLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [member.id]);

  async function handleDownloadOneToOneSheet() {
    setGeneratingSheet(true);
    setSheetError(null);
    try {
      registerPdfFonts();
      const qrCodeDataUrl = member.show_qr_code
        ? await generateQrDataUrl(memberProfileUrl(member.id))
        : null;
      const photoDataUri = await resolveImageDataUri(
        member.photo_bust_url || member.photo_icon_url
      );
      const blob = await pdf(
        <OneToOneSheetDocument
          member={member}
          qrCodeDataUrl={qrCodeDataUrl}
          photoDataUri={photoDataUri}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `1to1シート_${member.name || member.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setSheetError(getErrorMessage(err));
    } finally {
      setGeneratingSheet(false);
    }
  }

  function handleCardSave() {
    if (member.show_qr_code && qrDataUrl) {
      setQrLightboxOpen(true);
      return;
    }
    window.open(`/m/${member.id}`, "_blank", "noopener,noreferrer");
  }

  const hasReferralInfo =
    member.wanted_referral || member.gold_referral || member.silver_referral || member.bronze_referral;
  const hasDocuments =
    member.one_to_one_attachment_url ||
    member.one_to_one_sheet_url ||
    member.attachment_url ||
    member.custom_fields.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-zinc-100 shadow-2xl dark:bg-zinc-950"
        onClick={(e) => e.stopPropagation()}
      >
        {/* カバー画像・ガラスモルフィズムのアクションバー */}
        <div className="relative h-32 shrink-0 sm:h-44">
          {member.cover_image_url ? (
            /* eslint-disable-next-line @next/next/no-img-element -- cover_image_url may be a data URL or arbitrary remote host */
            <img
              src={member.cover_image_url}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-indigo-400 via-sky-400 to-emerald-400 dark:from-indigo-700 dark:via-sky-800 dark:to-emerald-700" />
          )}
          <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 bg-white/80 p-3 backdrop-blur-md dark:bg-zinc-900/80">
            <h2 className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              メンバー詳細 — 1to1シート
            </h2>
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
              <button
                type="button"
                onClick={handleDownloadOneToOneSheet}
                disabled={generatingSheet}
                className="flex items-center gap-1 rounded-full bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-300"
              >
                <Download size={12} />
                {generatingSheet ? "生成中..." : "1to1シート出力"}
              </button>
              <button
                type="button"
                onClick={() => setWorksheet("bio")}
                className="flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-white dark:bg-zinc-800/70 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <BookUser size={12} />
                略歴シート
              </button>
              <button
                type="button"
                onClick={() => setWorksheet("gains")}
                className="flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-white dark:bg-zinc-800/70 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <ClipboardList size={12} />
                GAINSシート
              </button>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-full bg-white/70 p-1.5 text-zinc-500 hover:bg-white hover:text-zinc-700 dark:bg-zinc-800/70 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                aria-label="閉じる"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-24 sm:p-6 md:pb-6">
          {sheetError && (
            <p className="mb-3 text-xs text-red-600 dark:text-red-400">{sheetError}</p>
          )}

          {/* ヘッダーセクション(写真をカバー画像に少し重ねて配置) */}
          <div className="-mt-14 mb-4 flex flex-col gap-4 sm:-mt-20 sm:flex-row sm:items-end">
            <div className="relative shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element -- photo_icon_url may be a data URL or arbitrary remote host */}
              <img
                src={member.photo_icon_url}
                alt={member.name}
                className="h-24 w-24 rounded-full object-cover shadow-lg ring-4 ring-zinc-100 sm:h-28 sm:w-28 dark:ring-zinc-950"
              />
              {member.show_qr_code && (
                <button
                  type="button"
                  onClick={() => qrDataUrl && setQrLightboxOpen(true)}
                  title="QRコードを拡大表示"
                  className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-white shadow ring-2 ring-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-black dark:ring-zinc-950 dark:hover:bg-zinc-300"
                >
                  {qrDataUrl ? <QrCode size={16} /> : <span className="h-3 w-3 animate-pulse rounded-full bg-current" />}
                </button>
              )}
            </div>
            <div className="min-w-0 flex-1 pb-1">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <h3 className="truncate text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  {member.name}
                </h3>
                {member.name_kana && (
                  <span className="truncate text-sm text-zinc-500 dark:text-zinc-400">
                    {member.name_kana}
                  </span>
                )}
              </div>
              {(member.chapter || member.role) && (
                <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
                  {[member.chapter, member.role].filter(Boolean).join(" / ")}
                </p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {member.category && (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                    {member.category}
                  </span>
                )}
                {member.team && (
                  <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                    {member.team}
                  </span>
                )}
                {member.company && (
                  <span className="text-sm text-zinc-600 dark:text-zinc-300">
                    {member.company}
                  </span>
                )}
              </div>
            </div>
          </div>

          <Card className="mb-4">
            {getBusinessLinks(member).length > 0 && (
              <BusinessLinkButtons member={member} size="md" />
            )}

            {(member.contact || member.email || member.hp_url) && (
              <dl
                className={`grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-3 ${
                  getBusinessLinks(member).length > 0
                    ? "mt-4 border-t border-zinc-100 pt-4 dark:border-zinc-800"
                    : ""
                }`}
              >
                {member.contact && (
                  <DetailRow icon={<Phone size={14} />} label="連絡先">
                    {member.contact}
                  </DetailRow>
                )}
                {member.email && (
                  <DetailRow icon={<Mail size={14} />} label="メールアドレス">
                    {member.email}
                  </DetailRow>
                )}
                {member.hp_url && (
                  <DetailRow icon={<Globe size={14} />} label="HP">
                    <a
                      href={member.hp_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate text-sky-600 underline dark:text-sky-400"
                    >
                      {member.hp_url}
                    </a>
                  </DetailRow>
                )}
              </dl>
            )}

            <div
              className={
                getBusinessLinks(member).length > 0 ||
                member.contact ||
                member.email ||
                member.hp_url
                  ? "mt-4 border-t border-zinc-100 pt-4 dark:border-zinc-800"
                  : ""
              }
            >
              <ShareButtons
                url={`/m/${member.id}`}
                text={`${member.name}さんのデジタル名刺・1to1シート`}
              />
            </div>
          </Card>

          {/* スマートタブ切り替え */}
          <div className="mb-4 flex gap-1 rounded-full bg-zinc-200/70 p-1 dark:bg-zinc-800/70">
            {DETAIL_TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-2 py-2 text-xs font-medium transition-colors sm:text-sm ${
                    active
                      ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-50"
                      : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                  }`}
                >
                  <Icon size={14} />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {activeTab === "overview" && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
              {/* パーソナル・略歴セクション(アコーディオン) */}
              <Accordion icon={<Heart size={16} />} title="パーソナル・略歴" defaultOpen>
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {PERSONAL_ITEMS.map(({ key, label, icon: Icon }) => (
                    <PersonalItem key={key} icon={<Icon size={15} />} label={label}>
                      {(member[key] as string) || ""}
                    </PersonalItem>
                  ))}
                </dl>
              </Accordion>

              <div className="flex flex-col gap-4">
                {/* ビジネス・その他セクション */}
                <Card>
                  <SectionHeading icon={<Flame size={16} />} title="ビジネス・その他" />
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <BusinessTile icon={<Flame size={14} />} label="私の強い願望は" value={member.bio_strong_desire} />
                    <BusinessTile icon={<Key size={14} />} label="私の成功の鍵は" value={member.bio_success_key} />
                  </div>

                  {hasReferralInfo && (
                    <div className="mt-4 flex flex-col gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                      {member.wanted_referral && (
                        <div>
                          <div className="mb-1 flex items-center gap-1">
                            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                              欲しいリファーラル
                            </p>
                            <CopyButton text={member.wanted_referral} />
                          </div>
                          <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                            {member.wanted_referral}
                          </p>
                        </div>
                      )}
                      {member.gold_referral && (
                        <ReferralBadge tier="gold" label="金のリファーラル" value={member.gold_referral} />
                      )}
                      {member.silver_referral && (
                        <ReferralBadge
                          tier="silver"
                          label="銀のリファーラル"
                          value={member.silver_referral}
                        />
                      )}
                      {member.bronze_referral && (
                        <ReferralBadge
                          tier="bronze"
                          label="銅のリファーラル"
                          value={member.bronze_referral}
                        />
                      )}
                    </div>
                  )}

                  {member.comment && (
                    <div className="mt-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                      <div className="mb-1 flex items-center gap-1">
                        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">紹介文</p>
                        <CopyButton text={member.comment} />
                      </div>
                      <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                        {member.comment}
                      </p>
                    </div>
                  )}
                </Card>

                {/* 資料・添付セクション */}
                {hasDocuments && (
                  <Card>
                    <SectionHeading icon={<FileText size={16} />} title="資料・添付" />
                    <div className="flex flex-col gap-4">
                      {(member.one_to_one_attachment_url || member.one_to_one_sheet_url) && (
                        <div>
                          <p className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                            1to1シート
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {member.one_to_one_attachment_url && (
                              <a
                                href={member.one_to_one_attachment_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 rounded-full bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-300"
                              >
                                <FileText size={16} />
                                PDFを開く/ダウンロード
                                {member.one_to_one_attachment_name && (
                                  <span className="truncate text-xs opacity-70">
                                    ({member.one_to_one_attachment_name})
                                  </span>
                                )}
                              </a>
                            )}
                            {member.one_to_one_sheet_url && (
                              <a
                                href={member.one_to_one_sheet_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                              >
                                <ExternalLink size={16} />
                                外部URLを別タブで開く
                              </a>
                            )}
                          </div>
                        </div>
                      )}

                      {member.attachment_url && (
                        <div>
                          <p className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                            資料・添付ファイル
                          </p>
                          <a
                            href={member.attachment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 rounded-full bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-300"
                          >
                            <FileText size={16} />
                            添付資料を開く
                            {member.attachment_name && (
                              <span className="truncate text-xs opacity-70">
                                ({member.attachment_name})
                              </span>
                            )}
                          </a>
                        </div>
                      )}

                      {member.custom_fields.length > 0 && (
                        <dl className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
                          {member.custom_fields.map((field, i) => (
                            <div key={i} className="flex gap-1">
                              <dt className="shrink-0 font-medium text-zinc-500 dark:text-zinc-400">
                                {field.key}:
                              </dt>
                              <dd className="text-zinc-700 dark:text-zinc-300">{field.value}</dd>
                            </div>
                          ))}
                        </dl>
                      )}
                    </div>
                  </Card>
                )}
              </div>
            </div>
          )}

          {activeTab === "gains" && (
            <Card>
              <SectionHeading icon={<Sparkles size={16} />} title="G.A.I.N.S." />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {GAINS_ITEMS.map(({ key, label, sub, icon: Icon, colorClassName }) => {
                  const value = (member[key] as string) || "";
                  return (
                    <div key={key} className={`rounded-xl border p-4 ${colorClassName}`}>
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <Icon size={16} className="text-zinc-600 dark:text-zinc-300" />
                          <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
                            {label}
                          </span>
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">({sub})</span>
                        </div>
                        <CopyButton text={value} />
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                        {value || <span className="text-zinc-400 dark:text-zinc-600">未設定</span>}
                      </p>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {activeTab === "portfolio" && (
            <Card>
              <SectionHeading icon={<LayoutGrid size={16} />} title="実績・ポートフォリオ" />
              {portfoliosLoading ? (
                <p className="text-sm text-zinc-400 dark:text-zinc-600">読み込み中...</p>
              ) : portfolios.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-6 text-center text-sm text-zinc-400 dark:text-zinc-600">
                  <Images size={28} />
                  登録されている実績・ポートフォリオはまだありません
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {portfolios.map((p) => (
                    <div
                      key={p.id}
                      className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800"
                    >
                      {p.image_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element -- image_url may be a data URL or arbitrary remote host */
                        <img
                          src={p.image_url}
                          alt={p.title}
                          className="h-40 w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-40 w-full items-center justify-center bg-zinc-100 text-zinc-300 dark:bg-zinc-900 dark:text-zinc-700">
                          <Images size={28} />
                        </div>
                      )}
                      <div className="p-3">
                        {p.category && (
                          <span className="mb-1 inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                            {p.category}
                          </span>
                        )}
                        <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                          {p.title}
                        </p>
                        {p.description && (
                          <p className="mt-1 line-clamp-2 text-xs text-zinc-600 dark:text-zinc-400">
                            {p.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>
      </div>

      {/* QRコードのフルスクリーン拡大表示 */}
      {qrLightboxOpen && qrDataUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-6"
          onClick={(e) => {
            e.stopPropagation();
            setQrLightboxOpen(false);
          }}
        >
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900">
            {/* eslint-disable-next-line @next/next/no-img-element -- QR code is a generated data URL */}
            <img
              src={qrDataUrl}
              alt={`${member.name}のデジタル名刺QRコード`}
              className="h-64 w-64 sm:h-80 sm:w-80"
            />
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              スキャンして{member.name}さんのデジタル名刺を開く
            </p>
            <button
              type="button"
              onClick={() => setQrLightboxOpen(false)}
              className="flex items-center gap-1 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-300"
            >
              <X size={14} />
              閉じる
            </button>
          </div>
        </div>
      )}

      {/* スマホ用スティッキー・アクションバー */}
      <div
        className="fixed inset-x-0 bottom-0 z-[55] flex items-center gap-2 border-t border-zinc-200 bg-white/90 p-3 backdrop-blur-md md:hidden dark:border-zinc-800 dark:bg-zinc-900/90"
        onClick={(e) => e.stopPropagation()}
      >
        {member.scheduling_url && (
          <a
            href={member.scheduling_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 flex-col items-center gap-0.5 rounded-xl bg-emerald-600 px-2 py-2 text-xs font-medium text-white"
          >
            <Calendar size={16} />
            日程調整
          </a>
        )}
        {member.line_url && (
          <a
            href={member.line_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 flex-col items-center gap-0.5 rounded-xl bg-[#06C755] px-2 py-2 text-xs font-medium text-white"
          >
            <MessageCircle size={16} />
            LINE連絡
          </a>
        )}
        <button
          type="button"
          onClick={handleCardSave}
          className="flex flex-1 flex-col items-center gap-0.5 rounded-xl bg-zinc-900 px-2 py-2 text-xs font-medium text-white dark:bg-zinc-100 dark:text-black"
        >
          <QrCode size={16} />
          名刺保存/QR
        </button>
      </div>

      {worksheet && (
        <div onClick={(e) => e.stopPropagation()}>
          <MemberWorksheetModal
            member={member}
            kind={worksheet}
            onClose={() => setWorksheet(null)}
          />
        </div>
      )}
    </div>
  );
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl bg-white p-5 shadow-sm dark:bg-zinc-900 ${className}`}>
      {children}
    </div>
  );
}

function SectionHeading({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="mb-4 flex items-center gap-2 border-b-2 border-zinc-900 pb-2 dark:border-zinc-100">
      <span className="text-zinc-900 dark:text-zinc-100">{icon}</span>
      <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">{title}</h3>
    </div>
  );
}

function Accordion({
  icon,
  title,
  defaultOpen = false,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl bg-white shadow-sm dark:bg-zinc-900">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 p-5 pb-3"
      >
        <span className="flex items-center gap-2 border-b-2 border-zinc-900 pb-2 text-base font-bold text-zinc-900 dark:border-zinc-100 dark:text-zinc-50">
          {icon}
          {title}
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  if (!text) return null;

  async function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // クリップボードAPIが使えない環境(非HTTPS等)では何もしない
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="コピー"
      className="flex shrink-0 items-center justify-center rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
}

function BusinessTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/60">
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {icon}
          {label}
        </div>
        <CopyButton text={value} />
      </div>
      <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
        {value || <span className="text-zinc-400 dark:text-zinc-600">未設定</span>}
      </p>
    </div>
  );
}

function PersonalItem({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: string;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg bg-zinc-50 p-2.5 dark:bg-zinc-900/60">
      <span className="mt-0.5 shrink-0 text-zinc-400 dark:text-zinc-500">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <dt className="text-xs text-zinc-500 dark:text-zinc-400">{label}</dt>
          <CopyButton text={children} />
        </div>
        <dd className="whitespace-pre-wrap text-sm text-zinc-800 dark:text-zinc-200">
          {children || <span className="text-zinc-400 dark:text-zinc-600">未設定</span>}
        </dd>
      </div>
    </div>
  );
}

const REFERRAL_TIER_STYLES = {
  gold: {
    wrapper:
      "border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50 dark:border-amber-700/50 dark:from-amber-950/30 dark:to-yellow-950/20",
    badge: "bg-amber-400 text-amber-950",
    label: "text-amber-800 dark:text-amber-300",
  },
  silver: {
    wrapper:
      "border-zinc-300 bg-gradient-to-r from-zinc-50 to-slate-50 dark:border-zinc-600/50 dark:from-zinc-800/40 dark:to-slate-900/20",
    badge: "bg-zinc-300 text-zinc-800",
    label: "text-zinc-700 dark:text-zinc-300",
  },
  bronze: {
    wrapper:
      "border-orange-300 bg-gradient-to-r from-orange-50 to-amber-50 dark:border-orange-800/50 dark:from-orange-950/30 dark:to-amber-950/10",
    badge: "bg-orange-400 text-orange-950",
    label: "text-orange-800 dark:text-orange-300",
  },
} as const;

function ReferralBadge({
  tier,
  label,
  value,
}: {
  tier: keyof typeof REFERRAL_TIER_STYLES;
  label: string;
  value: string;
}) {
  const style = REFERRAL_TIER_STYLES[tier];
  return (
    <div className={`rounded-lg border p-3 ${style.wrapper}`}>
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5">
          <span
            className={`flex h-5 w-5 items-center justify-center rounded-full ${style.badge}`}
          >
            <Award size={12} />
          </span>
          <span className={`text-xs font-semibold ${style.label}`}>{label}</span>
        </div>
        <CopyButton text={value} />
      </div>
      <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
        {value}
      </p>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 shrink-0 text-zinc-400">{icon}</span>
      <div className="min-w-0">
        <dt className="text-xs text-zinc-500 dark:text-zinc-400">{label}</dt>
        <dd className="truncate text-zinc-800 dark:text-zinc-200">{children}</dd>
      </div>
    </div>
  );
}
