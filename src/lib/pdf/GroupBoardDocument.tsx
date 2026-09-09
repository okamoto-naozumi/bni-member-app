import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import type { Board, BoardItem, GroupDef } from "@/lib/groupBoard";

const styles = StyleSheet.create({
  page: {
    fontFamily: "NotoSansJP",
    padding: 28,
    fontSize: 9,
    color: "#18181B",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderBottomWidth: 2,
    borderBottomColor: "#18181B",
    paddingBottom: 8,
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: 0.5,
  },
  chapterName: {
    fontSize: 11,
    fontWeight: 700,
    marginTop: 3,
    color: "#DC2626",
  },
  metaText: {
    fontSize: 8,
    color: "#71717A",
    marginTop: 1,
  },
  groupBox: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#E4E4E7",
    borderRadius: 6,
    marginBottom: 8,
    minHeight: 76,
  },
  groupLabelBox: {
    width: 60,
    backgroundColor: "#18181B",
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
  },
  groupLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: "#FFFFFF",
  },
  groupCount: {
    fontSize: 7,
    color: "#D4D4D8",
    marginTop: 2,
  },
  itemsRow: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    alignContent: "flex-start",
    padding: 6,
  },
  itemCard: {
    width: 56,
    alignItems: "center",
    marginRight: 4,
    marginBottom: 4,
  },
  photo: {
    width: 34,
    height: 34,
    borderRadius: 17,
    objectFit: "cover",
  },
  proxyBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
  },
  proxyBadgeText: {
    fontSize: 9,
    fontWeight: 700,
    color: "#FFFFFF",
  },
  itemLabel: {
    fontSize: 6.5,
    marginTop: 2,
    textAlign: "center",
  },
  emptyLabel: {
    fontSize: 8,
    color: "#A1A1AA",
    padding: 8,
  },
});

function GroupItemCard({ item }: { item: BoardItem }) {
  return (
    <View style={styles.itemCard}>
      {item.kind === "proxy" ? (
        <View style={styles.proxyBadge}>
          <Text style={styles.proxyBadgeText}>{item.label.slice(0, 2)}</Text>
        </View>
      ) : (
        // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf's Image has no alt prop
        <Image src={item.photoUrl} style={styles.photo} />
      )}
      <Text style={styles.itemLabel}>{item.label}</Text>
    </View>
  );
}

interface GroupBoardDocumentProps {
  board: Board;
  groups: GroupDef[];
  chapterName: string;
}

export default function GroupBoardDocument({
  board,
  groups,
  chapterName,
}: GroupBoardDocumentProps) {
  return (
    <Document title="BNI CHAPTER GROUP ASSIGNMENT">
      <Page size="A4" orientation="landscape" style={styles.page} wrap>
        <View style={styles.headerRow} fixed>
          <View>
            <Text style={styles.title}>BNI CHAPTER GROUP ASSIGNMENT</Text>
            {chapterName ? (
              <Text style={styles.chapterName}>{chapterName}</Text>
            ) : null}
          </View>
          <Text style={styles.metaText}>
            発行日: {new Date().toLocaleDateString("ja-JP")}
          </Text>
        </View>

        {groups.map((group) => {
          const items = board[group.id] ?? [];
          return (
            <View key={group.id} style={styles.groupBox} wrap={false}>
              <View style={styles.groupLabelBox}>
                <Text style={styles.groupLabel}>{group.name.replace("グループ", "")}</Text>
                <Text style={styles.groupCount}>{items.length}名</Text>
              </View>
              <View style={styles.itemsRow}>
                {items.length === 0 ? (
                  <Text style={styles.emptyLabel}>未配置</Text>
                ) : (
                  items.map((item) => <GroupItemCard key={item.id} item={item} />)
                )}
              </View>
            </View>
          );
        })}
      </Page>
    </Document>
  );
}
