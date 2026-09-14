export interface InviteGeneratorInput {
  chapterName: string;
  meetingDate: string;
  meetingTime: string;
  venue: string;
  inviterName: string;
  visitorName: string;
}

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

/** "2026-09-20" + "07:00" -> "2026年9月20日(土) 7:00〜" のような日本語表記に整形する */
export function formatMeetingDateTime(dateStr: string, timeStr: string): string {
  if (!dateStr) return "";
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  const datePart = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日(${
    WEEKDAY_LABELS[date.getDay()]
  })`;
  return timeStr ? `${datePart} ${timeStr}〜` : datePart;
}

export interface GeneratedInviteTexts {
  line: string;
  email: string;
  sns: string;
  thankYou: string;
}

/**
 * ビジター招待文・参加後のお礼状をチャネル別にテンプレート生成する。
 * 入力が未入力の項目は文中で「(未定)」等に自動補完し、コピー時に不自然な空欄が残らないようにする。
 */
export function generateInviteTexts(input: InviteGeneratorInput): GeneratedInviteTexts {
  const chapterName = input.chapterName.trim() || "BNIチャプター";
  const venue = input.venue.trim() || "会場未定(担当者へご確認ください)";
  const inviterName = input.inviterName.trim() || "私";
  const visitorNameRaw = input.visitorName.trim();
  const visitorGreeting = visitorNameRaw ? `${visitorNameRaw}様\n\n` : "";
  const dateTime = formatMeetingDateTime(input.meetingDate, input.meetingTime) || "日時調整中";

  const line = `${visitorGreeting}お世話になっております、${inviterName}です😊
いつもお声がけしている ${chapterName} の定例会にぜひ一度お越しいただきたく、ご連絡しました!

📅 日時: ${dateTime}
📍 会場: ${venue}

朝は少し早いですが、経営者・事業者同士のつながりを広げる良い機会です。
ビジター参加は見学のみでもOKですので、気軽にご参加ください!
ご都合いかがでしょうか?`;

  const email = `${visitorNameRaw ? `${visitorNameRaw} 様` : "ご担当者様"}

お世話になっております。${chapterName}${inviterName ? `の${inviterName}` : ""}です。

この度、私が所属しております BNI ${chapterName} の定例会にご招待させていただきたく、
ご連絡を差し上げました。

■ 日時: ${dateTime}
■ 会場: ${venue}

BNIは「ギバーズゲイン(与える者は与えられる)」の理念のもと、
ビジネスの紹介を通じて信頼関係を築く経営者・事業者のネットワークです。
ご興味をお持ちいただけましたら、まずは一度見学にお越しいただけますと幸いです。

ご参加が難しい場合や日程調整が必要な場合も、お気軽にご連絡ください。
ご検討のほど、何卒よろしくお願いいたします。

${inviterName}`;

  const sns = `【ビジター大歓迎🙌】
${chapterName}の定例会、次回は ${dateTime} @ ${venue} で開催!
経営者・事業者の紹介ネットワークBNIの雰囲気を、ぜひ一度見にいらしてください。
気になる方はDMまたはコメントでお気軽にどうぞ😊
#BNI #${chapterName.replace(/\s+/g, "")} #ビジネス紹介`;

  const thankYou = `${visitorGreeting}本日は${dateTime === "日時調整中" ? "" : `${dateTime}の`}${chapterName}定例会にお越しいただき、誠にありがとうございました!

実際の雰囲気を体感いただけて、少しでも良い刺激やご縁になっていれば嬉しく思います。
ご不明な点やご質問がありましたら、いつでもお気軽にご連絡ください。

またお会いできることを楽しみにしております。
本日は本当にありがとうございました!

${inviterName}`;

  return { line, email, sns, thankYou };
}
