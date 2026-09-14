import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import type { Member } from "@/lib/members";
import { getCategoryColor } from "@/lib/categoryColors";
import { PdfAvatar } from "@/lib/pdf/PdfAvatar";

const styles = StyleSheet.create({
  page: {
    fontFamily: "NotoSansJP",
    padding: 32,
    fontSize: 9.5,
    color: "#18181B",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 2,
    borderBottomColor: "#18181B",
    paddingBottom: 12,
    marginBottom: 16,
  },
  photo: {
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: 0.5,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 6,
  },
  name: {
    fontSize: 16,
    fontWeight: 700,
    marginRight: 6,
  },
  kana: {
    fontSize: 9,
    color: "#71717A",
  },
  metaLine: {
    fontSize: 9,
    color: "#52525B",
    marginTop: 2,
  },
  card: {
    borderWidth: 1,
    borderColor: "#E4E4E7",
    borderRadius: 6,
    padding: 10,
    marginTop: 10,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  letterBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#E0E7FF",
    alignItems: "center",
    justifyContent: "center",
  },
  letterText: {
    fontSize: 10,
    fontWeight: 700,
    color: "#3730A3",
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: 700,
  },
  cardSub: {
    fontSize: 8.5,
    color: "#71717A",
  },
  cardBody: {
    fontSize: 9.5,
    lineHeight: 1.5,
    color: "#27272A",
    marginTop: 6,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 32,
    right: 32,
    fontSize: 7,
    color: "#A1A1AA",
    textAlign: "center",
  },
});

interface GainsWorksheetDocumentProps {
  member: Member;
  photoDataUri?: string | null;
}

const GAINS_ITEMS: Array<{ key: keyof Member; letter: string; label: string; sub: string }> = [
  { key: "gains_goals", letter: "G", label: "Goals", sub: "目標" },
  { key: "gains_accomplishments", letter: "A", label: "Accomplishments", sub: "実績" },
  { key: "gains_interests", letter: "I", label: "Interests", sub: "興味" },
  { key: "gains_networks", letter: "N", label: "Networks", sub: "人脈" },
  { key: "gains_skills", letter: "S", label: "Skills", sub: "スキル" },
];

export default function GainsWorksheetDocument({
  member,
  photoDataUri,
}: GainsWorksheetDocumentProps) {
  const color = getCategoryColor(member.category);

  return (
    <Document title={`GAINSワークシート_${member.name}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <PdfAvatar
            name={member.name}
            dataUri={photoDataUri}
            width={64}
            height={64}
            borderRadius={32}
            style={styles.photo}
          />
          <View>
            <Text style={styles.title}>G.A.I.N.S. ワークシート</Text>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{member.name}</Text>
              {member.name_kana ? <Text style={styles.kana}>({member.name_kana})</Text> : null}
            </View>
            {(member.chapter || member.role) && (
              <Text style={styles.metaLine}>
                {[member.chapter, member.role].filter(Boolean).join(" / ")}
              </Text>
            )}
            {member.category ? (
              <View style={{ flexDirection: "row", marginTop: 8 }}>
                <View
                  style={{
                    borderRadius: 10,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    backgroundColor: color.bg,
                  }}
                >
                  <Text style={{ fontSize: 8, fontWeight: 700, color: color.text }}>
                    {member.category}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
        </View>

        {GAINS_ITEMS.map((item) => (
          <View key={item.key} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.letterBadge}>
                <Text style={styles.letterText}>{item.letter}</Text>
              </View>
              <Text style={styles.cardTitle}>{item.label}</Text>
              <Text style={styles.cardSub}>({item.sub})</Text>
            </View>
            <Text style={styles.cardBody}>{String(member[item.key] ?? "") || "-"}</Text>
          </View>
        ))}

        <Text style={styles.footer}>
          発行日: {new Date().toLocaleDateString("ja-JP")} ／ {member.chapter || "BNI"} G.A.I.N.S.ワークシート
        </Text>
      </Page>
    </Document>
  );
}
