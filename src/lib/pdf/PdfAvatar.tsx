import { View, Text, Image } from "@react-pdf/renderer";

/**
 * 氏名から表示用イニシャルを取り出す(姓のみ、または先頭2文字)。
 * グループ配置PDFの代理参加者バッジ(GroupBoardDocument)と同じ「先頭2文字」方式に揃えている。
 */
function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const [first] = trimmed.split(/\s+/);
  return first.slice(0, 2);
}

interface PdfAvatarProps {
  name: string;
  /** 事前にBase64へ変換済みのdata URI。未解決・取得失敗の場合は null/undefined を渡す */
  dataUri?: string | null;
  width: number;
  height: number;
  borderRadius?: number;
  /** marginなど、寸法・背景色以外の追加スタイル */
  style?: Record<string, unknown>;
}

/**
 * メンバー写真用の共通コンポーネント。data URIが渡された場合のみ<Image>を描画し、
 * 未設定・取得失敗の場合は黒塗りにせず、薄紫背景のイニシャルバッジを描画する。
 */
export function PdfAvatar({ name, dataUri, width, height, borderRadius, style }: PdfAvatarProps) {
  const radius = borderRadius ?? Math.min(width, height) / 2;

  if (dataUri) {
    return (
      // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf's Image has no alt prop
      <Image
        src={dataUri}
        style={{ width, height, borderRadius: radius, objectFit: "cover", ...style }}
      />
    );
  }

  return (
    <View
      style={{
        width,
        height,
        borderRadius: radius,
        backgroundColor: "#E0E7FF",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
    >
      <Text style={{ fontSize: Math.min(width, height) * 0.34, fontWeight: 700, color: "#4338CA" }}>
        {getInitials(name)}
      </Text>
    </View>
  );
}
