import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  Download,
  Library as LibraryIcon,
  Megaphone,
  Users,
  type LucideIcon,
} from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: string;
  href: string;
  linkLabel: string;
  accent: string;
  summary: string;
  points: string[];
}

const FEATURES: Feature[] = [
  {
    icon: Users,
    title: "メンバー管理",
    href: "/members",
    linkLabel: "メンバー一覧を見る",
    accent:
      "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
    summary:
      "チャプターメンバーのプロフィール・連絡先・金銀銅のリファーラルなどを一元管理します。",
    points: [
      "一覧カードの顔写真直下にQRコードを常時表示。その場でスマホからデジタル名刺を読み取れます。",
      "「詳細」ボタンで全項目を確認。金・銀・銅のリファーラルは色分けバッジで強調表示されます。",
      "顔写真(アイコン/バストアップ)や資料(PDF等)のアップロードにも対応しています。",
    ],
  },
  {
    icon: Download,
    title: "1to1シートPDF生成",
    href: "/members",
    linkLabel: "メンバー詳細から出力する",
    accent:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    summary:
      "1to1ミーティング用のプロフィールシートを、メンバー詳細画面からワンクリックでPDF出力できます。",
    points: [
      "基本情報・事業内容・欲しいリファーラル・金銀銅のリファーラル・QRコードをA4 1枚に自動レイアウト。",
      "メンバー詳細モーダル右上の「1to1シート出力」ボタンから生成・ダウンロードできます。",
    ],
  },
  {
    icon: CalendarClock,
    title: "メインプレゼンターカレンダー",
    href: "/presenters",
    linkLabel: "プレゼン予定を見る",
    accent:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
    summary:
      "週次のメインプレゼンター予定を管理し、資料準備を忘れないようリマインドします。",
    points: [
      "「リスト」(今後の予定/過去の実績)と「カレンダー」(月表示)を切り替えて確認できます。",
      "プレゼン資料(PDF/PPT等)をアップロードして担当メンバーと共有できます。",
      "次回プレゼンターのカウントダウンバナーがメンバー管理画面の上部にも表示されます。",
    ],
  },
  {
    icon: Megaphone,
    title: "リファーラル掲示板",
    href: "/referrals",
    linkLabel: "掲示板を見る",
    accent:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    summary:
      "チャプター内で不足しているカテゴリーを共有し、ビジター招待のターゲット選定に役立てます。",
    points: [
      "募集カテゴリ・対象パワーチーム・詳細説明・紹介窓口メンバーを登録できます。",
      "ステータス(募集中 / 調整中 / 充足)でフィルタして状況を一目で確認できます。",
    ],
  },
  {
    icon: LibraryIcon,
    title: "資料ライブラリ",
    href: "/library",
    linkLabel: "ライブラリを見る",
    accent:
      "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
    summary:
      "Googleドライブ等で管理している資料への共有リンクをまとめて掲載する掲示板です。",
    points: [
      "タイトル・説明文・カテゴリ(定例会資料/フォーマット/ガイドライン等)を添えてリンクを登録できます。",
      "「開く」ボタンをクリックすると別タブで共有先の資料が開きます。",
    ],
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
      <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white p-6 shadow-sm dark:border-zinc-800 dark:from-zinc-950 dark:to-black sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          About &amp; Guide
        </p>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-3xl">
          BNI ENISHIチャプター メンバー管理システムについて
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-base">
          チャプター運営に必要な情報をひとつにまとめた社内ツールです。メンバー名簿の管理から、1to1シートの作成、
          メインプレゼンターのスケジュール共有、パワーチームで不足しているカテゴリーの募集、資料の共有まで、
          このシステム上で完結できます。下記の各機能から、目的に合わせたページへ移動してください。
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <FeatureCard key={feature.title} feature={feature} />
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-8">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          困ったときは
        </h2>
        <ul className="mt-3 flex flex-col gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <li>
            ・操作マニュアルや各種フォーマットは
            <Link href="/library" className="mx-1 text-sky-600 underline dark:text-sky-400">
              資料ライブラリ
            </Link>
            にまとめています。
          </li>
          <li>
            ・メンバー情報の登録・編集は
            <Link href="/members" className="mx-1 text-sky-600 underline dark:text-sky-400">
              メンバー管理
            </Link>
            の「追加・編集」タブから行えます。
          </li>
          <li>
            ・不明点がある場合はチャプター運営担当までお問い合わせください。
          </li>
        </ul>
      </div>
    </div>
  );
}

function FeatureCard({ feature }: { feature: Feature }) {
  const Icon = feature.icon;
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950">
      <span className={`flex h-10 w-10 items-center justify-center rounded-full ${feature.accent}`}>
        <Icon size={18} />
      </span>
      <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
        {feature.title}
      </h3>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{feature.summary}</p>
      <ul className="flex flex-col gap-1.5">
        {feature.points.map((point, i) => (
          <li key={i} className="flex gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-zinc-400 dark:bg-zinc-600" />
            <span>{point}</span>
          </li>
        ))}
      </ul>
      <Link
        href={feature.href}
        className="mt-auto flex items-center gap-1 pt-2 text-sm font-medium text-zinc-900 hover:underline dark:text-zinc-50"
      >
        {feature.linkLabel}
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}
