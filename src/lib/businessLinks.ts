import { Briefcase, Calendar, Globe, MessageSquare, Send, Users, Video, type LucideIcon } from "lucide-react";
import type { Member } from "@/lib/members";

export interface BusinessLinkDef {
  key: string;
  url: string;
  label: string;
  icon: LucideIcon;
  /** ブランドカラー背景+白文字などのTailwindクラス */
  colorClassName: string;
}

/**
 * lucide-reactはブランドロゴアイコン(Facebook/LinkedIn/YouTube等)を提供しないため、
 * 意味の近い汎用アイコン + ブランドカラーの組み合わせで代替する(/m/[id]の既存SNSボタンと同じ方針)。
 */
const BUSINESS_LINK_SOURCES: Array<{
  key: string;
  field: keyof Pick<
    Member,
    "chatwork_url" | "facebook_url" | "linkedin_url" | "messenger_url" | "hp_url" | "scheduling_url" | "youtube_url"
  >;
  label: string;
  icon: LucideIcon;
  colorClassName: string;
}> = [
  {
    key: "chatwork",
    field: "chatwork_url",
    label: "Chatworkで連絡する",
    icon: MessageSquare,
    colorClassName: "bg-[#ED6C00] text-white",
  },
  {
    key: "facebook",
    field: "facebook_url",
    label: "Facebookでつながる",
    icon: Users,
    colorClassName: "bg-[#1877F2] text-white",
  },
  {
    key: "linkedin",
    field: "linkedin_url",
    label: "LinkedInでつながる",
    icon: Briefcase,
    colorClassName: "bg-[#0A66C2] text-white",
  },
  {
    key: "messenger",
    field: "messenger_url",
    label: "Messengerで連絡する",
    icon: Send,
    colorClassName: "bg-[#00B2FF] text-white",
  },
  {
    key: "website",
    field: "hp_url",
    label: "自社サイトを見る",
    icon: Globe,
    colorClassName: "bg-zinc-700 text-white",
  },
  {
    key: "scheduling",
    field: "scheduling_url",
    label: "日程調整する",
    icon: Calendar,
    colorClassName: "bg-emerald-600 text-white",
  },
  {
    key: "youtube",
    field: "youtube_url",
    label: "YouTubeを見る",
    icon: Video,
    colorClassName: "bg-[#FF0000] text-white",
  },
];

/**
 * ビジネス・営業リンク7項目(Chatwork/Facebook/LinkedIn/Messenger/自社サイト/日程調整/YouTube)のうち、
 * URLが入力済みのものだけをボタン表示用の定義として返す。
 * メンバー詳細モーダル・/team/[id]外部共有ページ(MemberCard経由)・デジタル名刺(/m/[id])で共通利用する。
 */
export function getBusinessLinks(member: Member): BusinessLinkDef[] {
  return BUSINESS_LINK_SOURCES.filter((src) => member[src.field]).map((src) => ({
    key: src.key,
    url: member[src.field],
    label: src.label,
    icon: src.icon,
    colorClassName: src.colorClassName,
  }));
}
