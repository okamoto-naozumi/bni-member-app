/**
 * リファーラル募集の「詳細説明」を、BNIで成果が出やすい具体的なターゲット文面へ
 * テンプレートロジックで自動変換する(外部AI APIは使用しない、ルールベースの文面補正)。
 */
export interface ReferralPolishInput {
  description: string;
  category: string;
  powerTeam: string;
}

/** 「誰か紹介して」のような曖昧・具体性のない募集文を検出するパターン群 */
const VAGUE_PATTERNS = [
  /誰か.{0,4}紹介/,
  /誰でも/,
  /どなたか/,
  /紹介して(下さい|ください)?[!!。.]?$/,
  /募集中?[!!。.]?$/,
];

/** 4文字以下など、内容として具体性を判断できないほど短い入力も曖昧とみなす */
function isTooShort(text: string): boolean {
  return text.length > 0 && text.length <= 4;
}

export function polishReferralDescription({
  description,
  category,
  powerTeam,
}: ReferralPolishInput): string {
  const trimmed = description.trim();
  const industryLabel = category.trim() || "貴業界";
  const isVague = !trimmed || isTooShort(trimmed) || VAGUE_PATTERNS.some((p) => p.test(trimmed));

  if (isVague) {
    const painPoint = powerTeam.trim()
      ? `${powerTeam.trim()}に関するお悩み`
      : "売上拡大・業務効率化のお悩み";
    return `${industryLabel}で${painPoint}を抱えている経営者様・ご担当者様を紹介してください。具体的な決裁権者(社長・役員クラス)が理想です。`;
  }

  return `${industryLabel}で「${trimmed}」にお悩みの経営者様・ご担当者様(決裁権をお持ちの方が理想です)`;
}
