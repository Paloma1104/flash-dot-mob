import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { useGameCredits } from "@/hooks/useGameCredits";
import { usePurchaseCreditsOnChain } from "@/hooks/usePurchaseCredits";

interface APPurchaseModalProps {
  visible: boolean;
  onClose: () => void;
}

// Credit packages with MON prices (0.1 MON per credit)
const CREDIT_PACKAGES = [
  { credits: 50, mon: 5, color: ["#4ECDC4", "#2E86DE"] as const, popular: false },
  { credits: 100, mon: 10, color: ["#6C5CE7", "#a29bfe"] as const, popular: true },
  { credits: 250, mon: 25, color: ["#FF6B9D", "#FFD93D"] as const, popular: false },
];

export function APPurchaseModal({ visible, onClose }: APPurchaseModalProps) {
  const {
    claimCredits,
    fetchBalance,
    credits,
    isLoading: isClaimLoading,
    error: claimError,
  } = useGameCredits();

  const {
    purchaseCredits,
    isLoading: isPurchasing,
    error: purchaseError,
  } = usePurchaseCreditsOnChain();

  const [hasClaimed, setHasClaimed] = React.useState(false);
  const [selectedPackage, setSelectedPackage] = React.useState<number | null>(null);

  const handleClaim = async () => {
    try {
      console.log("🎁 Starting free claim process...");
      const result = await claimCredits();
      console.log("📦 Claim result:", result);

      if (result.success) {
        setHasClaimed(true);
        await fetchBalance();
        Alert.alert("Success!", `Claimed ${result.credits} free credits!`);
        setTimeout(() => {
          onClose();
          setHasClaimed(false);
        }, 1500);
      } else {
        Alert.alert("Already Claimed", result.message || "You have already claimed your free credits.");
      }
    } catch (error) {
      console.error("Claim flow failed", error);
      Alert.alert("Error", "Failed to claim credits. Please try again.");
    }
  };

  const handlePurchase = async (pkg: typeof CREDIT_PACKAGES[0]) => {
    try {
      console.log(`💳 Purchasing ${pkg.credits} credits for ${pkg.mon} MON...`);
      setSelectedPackage(pkg.credits);

      const result = await purchaseCredits(pkg.credits, pkg.mon);

      if (result.success) {
        await fetchBalance();
        Alert.alert(
          "Purchase Successful!",
          `You received ${pkg.credits} credits!\n\nTx: ${result.txHash?.slice(0, 10)}...${result.txHash?.slice(-8)}`,
          [{ text: "OK", onPress: () => onClose() }]
        );
      } else {
        Alert.alert("Purchase Failed", result.error || "Transaction was cancelled or failed.");
      }
    } catch (error) {
      console.error("Purchase failed:", error);
      Alert.alert("Error", "Failed to complete purchase. Please try again.");
    } finally {
      setSelectedPackage(null);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <BlurView intensity={90} tint="dark" style={styles.container}>
        <View style={styles.content}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#FFF" />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="wallet-outline" size={32} color="#FFF" />
            </View>
            <Text style={styles.title}>Get Credits</Text>
            <Text style={styles.subtitle}>
              Use credits to play games and earn rewards
            </Text>
            <View style={styles.balanceBadge}>
              <Text style={styles.balanceText}>Current: {credits} Credits</Text>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Free Claim Section */}
            <Text style={styles.sectionTitle}>🎁 FREE CREDITS</Text>
            <TouchableOpacity
              style={[styles.freeCard, (isClaimLoading || hasClaimed) && styles.disabledCard]}
              onPress={handleClaim}
              disabled={isClaimLoading || hasClaimed}
            >
              <LinearGradient
                colors={["#06FFA5", "#2E86DE"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.freeCardGradient}
              >
                <View style={styles.freeCardContent}>
                  <View>
                    <Text style={styles.freeAmount}>50 CREDITS</Text>
                    <Text style={styles.freeRate}>One-time claim per wallet</Text>
                  </View>
                  <View style={styles.freePriceTag}>
                    <Text style={styles.freePrice}>FREE</Text>
                  </View>
                </View>
                {isClaimLoading && (
                  <ActivityIndicator color="#FFF" size="small" style={{ marginTop: 10 }} />
                )}
                {hasClaimed && (
                  <Text style={styles.claimedText}>✅ Claimed!</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Purchase Section */}
            <Text style={styles.sectionTitle}>💳 BUY WITH MON</Text>
            <Text style={styles.sectionSubtitle}>
              Rate: 0.1 MON = 1 Credit • Instant delivery
            </Text>

            {CREDIT_PACKAGES.map((pkg, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.packageCard,
                  selectedPackage === pkg.credits && styles.packageCardLoading,
                ]}
                onPress={() => handlePurchase(pkg)}
                disabled={isPurchasing || selectedPackage !== null}
              >
                <LinearGradient
                  colors={pkg.color}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.packageGradient}
                >
                  {pkg.popular && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularText}>⭐ POPULAR</Text>
                    </View>
                  )}
                  <View style={styles.packageContent}>
                    <View style={styles.packageLeft}>
                      <Text style={styles.packageCredits}>{pkg.credits}</Text>
                      <Text style={styles.packageLabel}>CREDITS</Text>
                    </View>
                    <View style={styles.packageRight}>
                      <View style={styles.packagePriceTag}>
                        <Text style={styles.packagePrice}>{pkg.mon} MON</Text>
                      </View>
                      {selectedPackage === pkg.credits ? (
                        <ActivityIndicator color="#FFF" size="small" style={{ marginTop: 8 }} />
                      ) : (
                        <Text style={styles.packageRate}>
                          {(pkg.mon / pkg.credits).toFixed(2)} MON each
                        </Text>
                      )}
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}

            {(claimError || purchaseError) && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color="#FF6B9D" />
                <Text style={styles.errorText}>{claimError || purchaseError}</Text>
              </View>
            )}

            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>ℹ️ How it works</Text>
              <Text style={styles.infoText}>
                • Credits are used to play games{"\n"}
                • Win games to earn Points{"\n"}
                • Purchases use MON from your wallet{"\n"}
                • Transactions are instant on Monad
              </Text>
            </View>
          </ScrollView>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  content: {
    backgroundColor: "#1A1A2E",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    paddingBottom: 40,
    maxHeight: "90%",
  },
  closeButton: {
    alignSelf: "flex-end",
    padding: 10,
    marginBottom: 10,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#2E2E3A",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#AAA",
    textAlign: "center",
    marginBottom: 12,
  },
  balanceBadge: {
    backgroundColor: "rgba(108, 92, 231, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(108, 92, 231, 0.4)",
  },
  balanceText: {
    color: "#6C5CE7",
    fontSize: 14,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "rgba(255, 255, 255, 0.5)",
    marginBottom: 12,
    marginTop: 16,
    letterSpacing: 1.5,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.4)",
    marginBottom: 12,
    fontStyle: "italic",
  },
  freeCard: {
    height: 100,
    borderRadius: 20,
    marginBottom: 24,
    elevation: 5,
    shadowColor: "#4ECDC4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  disabledCard: {
    opacity: 0.6,
  },
  freeCardGradient: {
    flex: 1,
    borderRadius: 20,
    padding: 20,
    justifyContent: "center",
  },
  freeCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  freeAmount: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFF",
  },
  freeRate: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
  },
  freePriceTag: {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 12,
  },
  freePrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
  },
  claimedText: {
    fontSize: 14,
    color: "#FFF",
    textAlign: "center",
    marginTop: 8,
    fontWeight: "600",
  },
  packageCard: {
    height: 110,
    borderRadius: 20,
    marginBottom: 12,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  packageCardLoading: {
    opacity: 0.7,
  },
  packageGradient: {
    flex: 1,
    borderRadius: 20,
    padding: 20,
    justifyContent: "center",
  },
  popularBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FFF",
  },
  packageContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  packageLeft: {
    flex: 1,
  },
  packageCredits: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFF",
  },
  packageLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
  },
  packageRight: {
    alignItems: "flex-end",
  },
  packagePriceTag: {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  packagePrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
  },
  packageRate: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 6,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 107, 157, 0.1)",
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
    gap: 10,
  },
  errorText: {
    color: "#FF6B9D",
    fontSize: 14,
    flex: 1,
  },
  infoBox: {
    backgroundColor: "rgba(108, 92, 231, 0.1)",
    padding: 16,
    borderRadius: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "rgba(108, 92, 231, 0.3)",
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6C5CE7",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.7)",
    lineHeight: 20,
  },
});
