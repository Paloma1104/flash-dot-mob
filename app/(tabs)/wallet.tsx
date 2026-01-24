import { APPurchaseModal } from "@/src/components/ui/APPurchaseModal";
import { OnboardingFlow } from "@/src/components/ui/OnboardingFlow";
import { useWallet } from "@/src/hooks/useWallet";
import { useUserStore } from "@/src/stores/userStore";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WalletScreen() {
  const { isConnected, connect, disconnect, isConnecting, address } =
    useWallet();
  const {
    balance,
    apBalance,
    history,
    stats,
    hasCompletedOnboarding,
    setOnboardingComplete,
  } = useUserStore();
  const [activeModal, setActiveModal] = useState<
    "receive" | "send" | "swap" | "buyAP" | null
  >(null);
  const [showOnboarding, setShowOnboarding] = useState(!hasCompletedOnboarding);

  const handleOnboardingComplete = () => {
    setOnboardingComplete();
    setShowOnboarding(false);
  };

  // Show onboarding for new users
  if (showOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  // Stats for the "Analysis" section
  const statsData = [
    {
      label: "Total Claims",
      value: stats.totalClaims.toString(),
      icon: "checkmark.circle.fill",
    },
    {
      label: "Avg. Value",
      value: `${stats.avgValue.toFixed(0)} $MON`,
      icon: "chart.bar.fill",
    },
    {
      label: "Best Drop",
      value: `${stats.bestDrop} $MON`,
      icon: "trophy.fill",
    },
  ];

  if (!isConnected) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <StatusBar style="light" />
        <View style={styles.centerContainer}>
          <View style={styles.connectCard}>
            <View style={styles.iconContainer}>
              <Text style={styles.iconEmoji}>💳</Text>
            </View>
            <Text style={styles.connectTitle}>Access Your Wallet</Text>
            <Text style={styles.connectText}>
              Connect your secure wallet to manage $MON tokens, track earnings,
              and view transaction history on Monad.
            </Text>
            <TouchableOpacity
              style={styles.connectButton}
              onPress={connect}
              disabled={isConnecting}
            >
              <Text style={styles.connectButtonText}>
                {isConnecting ? "⚡ Connecting..." : "🔓 Connect Wallet"}
              </Text>
            </TouchableOpacity>
            <View style={styles.securityBadge}>
              <Text style={styles.secureText}>🔒 Secure & Private</Text>
              <Text style={styles.secureSubtext}>All data stored locally</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar style="light" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.titleEmoji}>💳</Text>
            <Text style={styles.pageTitle}>Wallet</Text>
          </View>
          <TouchableOpacity style={styles.disconnectBadge} onPress={disconnect}>
            <Text style={styles.disconnectIcon}>⚡</Text>
          </TouchableOpacity>
        </View>

        {/* Main Asset Card - MON Balance */}
        <LinearGradient
          colors={["rgba(131, 110, 249, 0.25)", "rgba(131, 110, 249, 0.08)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.mainCard}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>MON BALANCE</Text>
            <View style={styles.networkBadge}>
              <View style={styles.networkDot} />
              <Text style={styles.networkText}>MONAD TESTNET</Text>
            </View>
          </View>

          <View style={styles.balanceContainer}>
            <Text style={styles.balance}>{balance.toFixed(2)}</Text>
            <Text style={styles.symbol}>$MON</Text>
          </View>

          <View style={styles.addressContainer}>
            <Text style={styles.addressLabel}>ADDRESS</Text>
            <Text
              style={styles.addressValue}
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              {address}
            </Text>
          </View>
        </LinearGradient>

        {/* AP Balance Card - NEW */}
        <LinearGradient
          colors={["rgba(78, 205, 196, 0.25)", "rgba(78, 205, 196, 0.08)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.apCard}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>ACTIVITY POINTS</Text>
            <TouchableOpacity
              style={styles.buyAPButton}
              onPress={() => setActiveModal("buyAP")}
            >
              <Text style={styles.buyAPButtonText}>+ Buy AP</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.balanceContainer}>
            <Text style={styles.balance}>{apBalance.toFixed(0)}</Text>
            <Text style={styles.symbol}>AP</Text>
          </View>

          <View style={styles.apInfo}>
            <Text style={styles.apInfoText}>
              🎮 Use AP to play games • 100 MON = 1000 AP
            </Text>
          </View>
        </LinearGradient>

        {/* Actions Grid - Fixed black backgrounds */}
        <View style={styles.actionsGrid}>
          <View style={styles.actionCol}>
            <LinearGradient
              colors={["rgba(0, 217, 255, 0.25)", "rgba(0, 217, 255, 0.08)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.actionBtn, styles.actionBtnReceive]}
            >
              <TouchableOpacity
                style={styles.actionBtnInner}
                onPress={() => setActiveModal("receive")}
              >
                <Text style={styles.actionIcon}>📥</Text>
              </TouchableOpacity>
            </LinearGradient>
            <Text style={styles.actionLabel}>Receive</Text>
          </View>

          <View style={styles.actionCol}>
            <LinearGradient
              colors={[
                "rgba(131, 110, 249, 0.25)",
                "rgba(131, 110, 249, 0.08)",
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.actionBtn, styles.actionBtnSend]}
            >
              <TouchableOpacity
                style={styles.actionBtnInner}
                onPress={() => setActiveModal("send")}
              >
                <Text style={styles.actionIcon}>📤</Text>
              </TouchableOpacity>
            </LinearGradient>
            <Text style={styles.actionLabel}>Send</Text>
          </View>

          <View style={styles.actionCol}>
            <LinearGradient
              colors={["rgba(255, 215, 0, 0.25)", "rgba(255, 215, 0, 0.08)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.actionBtn, styles.actionBtnSwap]}
            >
              <TouchableOpacity
                style={styles.actionBtnInner}
                onPress={() => setActiveModal("swap")}
              >
                <Text style={styles.actionIcon}>🔄</Text>
              </TouchableOpacity>
            </LinearGradient>
            <Text style={styles.actionLabel}>Swap</Text>
          </View>
        </View>

        {/* Stats Analysis */}
        <Text style={styles.sectionTitle}>PERFORMANCE</Text>
        <View style={styles.statsGrid}>
          {statsData.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Recent Activity */}
        <Text style={styles.sectionTitle}>RECENT ACTIVITY</Text>
        <View style={styles.transactionsList}>
          {history.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No transactions yet</Text>
            </View>
          ) : (
            history.slice(0, 10).map((tx) => (
              <View key={tx.id} style={styles.transactionItem}>
                <View style={styles.txIcon}>
                  <Text style={styles.actionIcon}>
                    {tx.type === "claim" ? "📥" : "📤"}
                  </Text>
                </View>
                <View style={styles.txDetails}>
                  <Text style={styles.txTitle}>
                    {tx.type === "claim"
                      ? "Claimed Drop"
                      : tx.type.toUpperCase()}
                  </Text>
                  <Text style={styles.txDate}>
                    {new Date(tx.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
                <Text style={styles.txAmount}>
                  {tx.type === "claim" ? "+" : ""}
                  {tx.amount.toFixed(2)} $MON
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Unified Action Modal - exclude buyAP since it has its own modal */}
      <Modal
        visible={activeModal !== null && activeModal !== "buyAP"}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveModal(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setActiveModal(null)}
        >
          <Pressable
            style={styles.modalContainer}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalCard}>
              {activeModal === "receive" && (
                <>
                  <Text style={styles.modalTitle}>Receive $MON</Text>
                  <View style={styles.qrPlaceholder}>
                    <Text style={{ color: "#836EF9", fontSize: 16 }}>
                      QR Code
                    </Text>
                  </View>
                  <Text style={styles.qrAddress}>{address}</Text>
                </>
              )}

              {activeModal === "send" && (
                <>
                  <Text style={styles.modalTitle}>Send Assets</Text>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Recipient Address</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="0x..."
                      placeholderTextColor="#555"
                    />
                  </View>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Amount ($MON)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="0.00"
                      placeholderTextColor="#555"
                      keyboardType="numeric"
                    />
                  </View>
                  <TouchableOpacity style={styles.modalActionBtn}>
                    <Text style={styles.modalActionBtnText}>
                      Send Transaction
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              {activeModal === "swap" && (
                <>
                  <Text style={styles.modalTitle}>Swap Tokens</Text>
                  <Text style={styles.modalDesc}>
                    Swap functionality is currently disabled on the Testnet.
                    Please check back later.
                  </Text>
                </>
              )}

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setActiveModal(null)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* AP Purchase Modal */}
      <APPurchaseModal
        visible={activeModal === "buyAP"}
        onClose={() => setActiveModal(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 140,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  // Connect Screen
  connectCard: {
    padding: 40,
    width: "100%",
    alignItems: "center",
    borderRadius: 32,
    borderWidth: 2,
    borderColor: "rgba(131, 110, 249, 0.4)",
    backgroundColor: "rgba(131, 110, 249, 0.15)",
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(131, 110, 249, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "rgba(131, 110, 249, 0.3)",
  },
  iconEmoji: {
    fontSize: 48,
  },
  connectTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#fff",
    marginBottom: 12,
    textAlign: "center",
  },
  connectText: {
    fontSize: 16,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  connectButton: {
    backgroundColor: "#836EF9",
    paddingHorizontal: 32,
    paddingVertical: 18,
    borderRadius: 16,
    width: "100%",
    alignItems: "center",
    shadowColor: "#836EF9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  connectButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
  },
  securityBadge: {
    marginTop: 24,
    alignItems: "center",
  },
  secureText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
  },
  secureSubtext: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 11,
  },

  // Wallet Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  titleEmoji: {
    fontSize: 32,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.5,
  },
  disconnectBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 68, 68, 0.15)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 68, 68, 0.4)",
  },
  disconnectIcon: {
    fontSize: 22,
  },

  // Main Card - Fixed address container
  mainCard: {
    height: 240,
    padding: 24,
    borderRadius: 32,
    justifyContent: "space-between",
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: "rgba(131, 110, 249, 0.3)",
  },
  apCard: {
    height: 200,
    padding: 24,
    borderRadius: 32,
    justifyContent: "space-between",
    marginBottom: 32,
    borderWidth: 1.5,
    borderColor: "rgba(78, 205, 196, 0.3)",
  },
  buyAPButton: {
    backgroundColor: "rgba(78, 205, 196, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(78, 205, 196, 0.3)",
  },
  buyAPButtonText: {
    color: "#4ECDC4",
    fontSize: 13,
    fontWeight: "700",
  },
  apInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  apInfoText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 13,
    textAlign: "center",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  networkBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  networkDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
    marginRight: 6,
  },
  networkText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  balanceContainer: {
    marginTop: 8,
  },
  balance: {
    color: "#fff",
    fontSize: 56,
    fontWeight: "900",
    letterSpacing: -2,
    textShadowColor: "rgba(131, 110, 249, 0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  symbol: {
    color: "#836EF9",
    fontSize: 24,
    fontWeight: "700",
    marginTop: 4,
  },
  addressContainer: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  addressLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 9,
    fontWeight: "700",
    marginBottom: 6,
    letterSpacing: 1.5,
  },
  addressValue: {
    color: "#fff",
    fontFamily: "monospace",
    fontSize: 12,
    opacity: 0.85,
    letterSpacing: 0.3,
  },

  // Actions - Fixed black backgrounds
  actionsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 32,
  },
  actionCol: {
    alignItems: "center",
    flex: 1,
  },
  actionBtn: {
    width: "100%",
    aspectRatio: 1,
    maxWidth: 80,
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 12,
    borderWidth: 1.5,
  },
  actionBtnInner: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  actionBtnReceive: {
    borderColor: "rgba(0, 217, 255, 0.3)",
  },
  actionBtnSend: {
    borderColor: "rgba(131, 110, 249, 0.3)",
  },
  actionBtnSwap: {
    borderColor: "rgba(255, 215, 0, 0.3)",
  },
  actionIcon: {
    fontSize: 36,
  },
  actionLabel: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.5,
  },

  // Sections
  sectionTitle: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 16,
    textTransform: "uppercase",
  },

  // Stats
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(131, 110, 249, 0.2)",
    backgroundColor: "rgba(30, 30, 50, 0.6)",
  },
  statValue: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 6,
  },
  statLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },

  // Transactions
  transactionsList: {
    gap: 12,
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: "rgba(30, 30, 50, 0.5)",
  },
  emptyCard: {
    padding: 32,
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: "rgba(30, 30, 50, 0.5)",
  },
  emptyText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 15,
    fontWeight: "500",
  },
  txIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 217, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    borderWidth: 1,
    borderColor: "rgba(0, 217, 255, 0.2)",
  },
  txDetails: {
    flex: 1,
  },
  txTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  txDate: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    fontWeight: "500",
  },
  txAmount: {
    color: "#10B981",
    fontSize: 17,
    fontWeight: "700",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  modalContainer: {
    width: "90%",
    alignItems: "center",
  },
  modalCard: {
    width: "100%",
    padding: 32,
    borderRadius: 32,
    alignItems: "center",
    backgroundColor: "rgba(20, 20, 35, 0.98)",
    borderWidth: 1.5,
    borderColor: "rgba(131, 110, 249, 0.3)",
  },
  modalTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 32,
  },
  modalDesc: {
    color: "#aaa",
    textAlign: "center",
    marginBottom: 32,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
    borderWidth: 2,
    borderColor: "#836EF9",
  },
  qrAddress: {
    color: "rgba(255,255,255,0.6)",
    fontFamily: "monospace",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 32,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 20,
  },
  inputLabel: {
    color: "#888",
    marginBottom: 8,
    fontSize: 12,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    padding: 16,
    color: "#fff",
    width: "100%",
    fontSize: 16,
  },
  modalActionBtn: {
    backgroundColor: "#836EF9",
    width: "100%",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
  },
  modalActionBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  closeButton: {
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    width: "100%",
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
});
