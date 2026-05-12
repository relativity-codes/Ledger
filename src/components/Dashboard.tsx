import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useLedgerStore } from "../store/useLedgerStore";
import { useModelStore } from "../store/useModelStore";
import {
  Mic,
  Camera,
  Plus,
  TrendingUp,
  TrendingDown,
  History,
} from "lucide-react-native";
import { MotiView } from "moti";
import { VoiceEntry } from "./VoiceEntry";
import { ManualEntry } from "./ManualEntry";
import { CameraEntry } from "./CameraEntry";
import { QueryEngine } from "../services/QueryEngine";
import { Search } from "lucide-react-native";
import { TextInput } from "react-native";
import { useGemmaService } from "../services/GemmaService";

const { width } = Dimensions.get("window");

export const Dashboard = () => {
  const { balance, recentTransactions, refresh, isLoading } = useLedgerStore();
  const { isGemmaDownloaded, gemmaProgress, checkStatus, downloadModel } =
    useModelStore();
  const [showVoice, setShowVoice] = React.useState(false);
  const [showManual, setShowManual] = React.useState(false);
  const [showCamera, setShowCamera] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const { generateSQLWhere } = useGemmaService();

  useEffect(() => {
    checkStatus();
    refresh();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery) {
      refresh();
      return;
    }
    const results = await QueryEngine.naturalLanguageSearch(
      searchQuery,
      generateSQLWhere,
    );
    useLedgerStore.setState({ recentTransactions: results });
  };

  const formatCurrency = (amount: number) => {
    return `₦${(amount / 100).toLocaleString()}`;
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header / Balance Card */}
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "timing", duration: 800 }}
          style={styles.balanceCard}
        >
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={styles.balanceAmount}>{formatCurrency(balance)}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <TrendingUp size={16} color="#4ADE80" />
              <Text style={styles.statText}>+₦2,500</Text>
            </View>
            <View style={styles.statItem}>
              <TrendingDown size={16} color="#F87171" />
              <Text style={styles.statText}>-₦1,200</Text>
            </View>
          </View>
        </MotiView>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={20} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search e.g. 'spent on food last week'"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "#8B5CF6" }]}
            onPress={() => setShowVoice(true)}
          >
            <Mic color="#FFF" size={32} />
            <Text style={styles.actionText}>Voice Entry</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "#EC4899" }]}
            onPress={() => setShowCamera(true)}
          >
            <Camera color="#FFF" size={32} />
            <Text style={styles.actionText}>Scan Receipt</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "#10B981" }]}
            onPress={() => setShowManual(true)}
          >
            <Plus color="#FFF" size={32} />
            <Text style={styles.actionText}>Manual</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Transactions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {recentTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <History size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>No transactions yet.</Text>
          </View>
        ) : (
          recentTransactions.map((tx, index) => (
            <MotiView
              key={tx.id}
              from={{ opacity: 0, translateX: -20 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ delay: index * 100 }}
              style={styles.txItem}
            >
              <View
                style={[
                  styles.txIcon,
                  {
                    backgroundColor:
                      tx.type === "income" ? "#DCFCE7" : "#FEE2E2",
                  },
                ]}
              >
                {tx.type === "income" ? (
                  <TrendingUp size={20} color="#16A34A" />
                ) : (
                  <TrendingDown size={20} color="#DC2626" />
                )}
              </View>
              <View style={styles.txDetails}>
                <Text style={styles.txCategory}>
                  {tx.category.toUpperCase()}
                </Text>
                <Text style={styles.txDate}>
                  {new Date(tx.timestamp).toLocaleDateString()}
                </Text>
              </View>
              <Text
                style={[
                  styles.txAmount,
                  { color: tx.type === "income" ? "#16A34A" : "#DC2626" },
                ]}
              >
                {tx.type === "income" ? "+" : "-"}
                {formatCurrency(tx.amount)}
              </Text>
            </MotiView>
          ))
        )}

        {/* AI Status */}
        {!isGemmaDownloaded && (
          <View style={styles.aiAlert}>
            <Text style={styles.aiAlertText}>
              {gemmaProgress
                ? `Downloading AI Model: ${(gemmaProgress.progress * 100).toFixed(0)}%`
                : "AI Model not ready. Voice & OCR features disabled."}
            </Text>
            {!gemmaProgress && (
              <TouchableOpacity
                style={styles.downloadBtn}
                onPress={() => downloadModel("gemma")}
              >
                <Text style={styles.downloadBtnText}>Setup AI (2.6GB)</Text>
              </TouchableOpacity>
            )}
            {gemmaProgress && (
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${gemmaProgress.progress * 100}%` },
                  ]}
                />
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {showVoice && <VoiceEntry onClose={() => setShowVoice(false)} />}
      {showManual && <ManualEntry onClose={() => setShowManual(false)} />}
      {showCamera && <CameraEntry onClose={() => setShowCamera(false)} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  balanceCard: {
    backgroundColor: "#1E293B",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  balanceLabel: {
    color: "#94A3B8",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  balanceAmount: {
    color: "#FFF",
    fontSize: 36,
    fontWeight: "800",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    marginTop: 24,
    height: 56,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: "#1E293B",
  },
  statsRow: {
    flexDirection: "row",
    marginTop: 20,
    gap: 16,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },
  actionsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 32,
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    height: 100,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 40,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1E293B",
  },
  seeAll: {
    color: "#3B82F6",
    fontWeight: "600",
  },
  txItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  txIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  txDetails: {
    flex: 1,
    marginLeft: 16,
  },
  txCategory: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
  },
  txDate: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },
  txAmount: {
    fontSize: 16,
    fontWeight: "800",
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    color: "#94A3B8",
    marginTop: 12,
    fontSize: 14,
  },
  aiAlert: {
    backgroundColor: "#FFFBEB",
    padding: 16,
    borderRadius: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: "#FEF3C7",
    alignItems: "center",
  },
  aiAlertText: {
    color: "#92400E",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 12,
  },
  downloadBtn: {
    backgroundColor: "#D97706",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  downloadBtnText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 13,
  },
  progressBar: {
    width: "100%",
    height: 6,
    backgroundColor: "#FEF3C7",
    borderRadius: 3,
    marginTop: 8,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#D97706",
  },
});
