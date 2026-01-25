import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useGameCredits } from "@/hooks/useGameCredits";
import { useWallet } from "@/hooks/useWallet";
import React from "react";

export default function MarketScreen() {
  const { isConnected, connect, address } = useWallet();

  // Use backend-only credit system
  const {
    credits,
    claimCredits,
    fetchBalance,
    isLoading: isLoadingCredits
  } = useGameCredits();

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [hasClaimedWelcome, setHasClaimedWelcome] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [displayCredits, setDisplayCredits] = useState(0);

  // Sync credits from hook to local display state
  useEffect(() => {
    setDisplayCredits(credits);
    console.log(`🎮 Credits updated: ${credits}`);
  }, [credits]);

  // Track if welcome bonus was claimed (credits > 0 means claimed)
  useEffect(() => {
    if (credits > 0) {
      setHasClaimedWelcome(true);
    }
  }, [credits]);

  // Credit packs: Base rate is 10 credits per MON
  // Minimum purchase: 5 MON = 50 Credits
  const CREDIT_PACKS = [
    {
      id: "small",
      credits: 50,
      cost: 5, // 5 MON = 50 Credits (10 credits/MON)
      color: ["#4ECDC4", "#2E86DE"] as const,
    },
    {
      id: "medium",
      credits: 100,
      cost: 10, // 10 MON = 100 Credits
      color: ["#6C5CE7", "#a29bfe"] as const,
    },
    {
      id: "large",
      credits: 250,
      cost: 25, // 25 MON = 250 Credits
      color: ["#FF6B9D", "#FFD93D"] as const,
    },
  ];

  const ITEMS = [
    { id: "skin1", name: "Neon Glow", type: "Skin", cost: 200, icon: "shirt" },
    {
      id: "power1",
      name: "2x Multiplier",
      type: "Power-up",
      cost: 150,
      icon: "flash",
    },
    {
      id: "pass",
      name: "Premium Pass",
      type: "Pass",
      cost: 1000,
      icon: "star",
    },
  ];

  const handleBuyCredits = async (amount: number, cost: number) => {
    if (!isConnected) {
      Alert.alert("Connect Wallet", "Please connect your wallet first.");
      return;
    }

    Alert.alert(
      "Coming Soon",
      "On-chain credit purchases will be available soon! For now, claim your free 50 credits.",
      [{ text: "OK" }]
    );
  };

  const isLoading = isLoadingCredits;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Marketplace</Text>
          <View style={styles.balanceTag}>
            <Text style={styles.balanceText}>{displayCredits} Credits</Text>
          </View>
        </View>

        {successMsg && (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={20} color="#6C5CE7" />
            <Text style={styles.successText}>{successMsg}</Text>
          </View>
        )}

        {/* Welcome Bonus - Show only if not connected or hasn't claimed yet */}
        {(!isConnected || !hasClaimedWelcome) && (
          <TouchableOpacity
            style={[styles.welcomeBonus, isClaiming && styles.welcomeBonusDisabled]}
            onPress={async () => {
              if (!isConnected) {
                await connect();
              } else if (!hasClaimedWelcome) {
                setIsClaiming(true);
                try {
                  // Trigger balance fetch which auto-airdrops 50 credits on backend
                  await fetchBalance();
                  setHasClaimedWelcome(true);
                  setSuccessMsg("Welcome! You received 50 Credits!");
                  setTimeout(() => setSuccessMsg(null), 3000);
                } catch (error) {
                  console.error("Claim error:", error);
                  Alert.alert("Error", "Failed to claim welcome bonus. Please try again.");
                } finally {
                  setIsClaiming(false);
                }
              }
            }}
            disabled={isLoading || isClaiming}
          >
            <LinearGradient
              colors={["#00D9FF", "#6C5CE7"]}
              style={styles.welcomeGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.welcomeContent}>
                <Ionicons name={isClaiming ? "hourglass" : "gift"} size={32} color="#FFF" />
                <View style={styles.welcomeTextContainer}>
                  <Text style={styles.welcomeTitle}>
                    {isClaiming
                      ? "Claiming..."
                      : isConnected
                        ? "Claim Welcome Bonus!"
                        : "Connect & Get 50 Credits!"}
                  </Text>
                  <Text style={styles.welcomeSubtitle}>
                    {isClaiming
                      ? "Please wait..."
                      : isConnected
                        ? "Tap to claim your free 50 credits"
                        : "Connect your wallet to receive free credits"}
                  </Text>
                </View>
                {!isClaiming && <Ionicons name="chevron-forward" size={24} color="#FFF" />}
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Credit Packs */}
        <Text style={styles.sectionTitle}>CREDIT PACKS</Text>
        <View style={styles.packsGrid}>
          {CREDIT_PACKS.map((pack) => (
            <TouchableOpacity
              key={pack.id}
              style={styles.packCard}
              onPress={() => handleBuyCredits(pack.credits, pack.cost)}
              disabled={isLoading}
            >
              <LinearGradient
                colors={pack.color}
                style={styles.packGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.packContent}>
                  <Text style={styles.packCredits}>{pack.credits}</Text>
                  <Text style={styles.packLabel}>CREDITS</Text>
                  <View style={styles.packPrice}>
                    <Text style={styles.priceText}>{pack.cost} MON</Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Items Section */}
        <Text style={styles.sectionTitle}>EXCLUSIVE ITEMS</Text>
        <Text style={styles.subtitle}>Coming Soon</Text>
        <View style={styles.itemsGrid}>
          {ITEMS.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemIcon}>
                <Ionicons name={item.icon as any} size={24} color="#FFF" />
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemType}>{item.type}</Text>
              </View>
              <TouchableOpacity style={styles.itemBuyBtn} disabled>
                <Text style={styles.itemCost}>{item.cost} CR</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFF",
    letterSpacing: 0.5,
  },
  balanceTag: {
    backgroundColor: "rgba(131, 110, 249, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(131, 110, 249, 0.4)",
  },
  balanceText: {
    color: "#836EF9",
    fontWeight: "700",
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "rgba(255, 255, 255, 0.5)",
    marginBottom: 15,
    marginTop: 10,
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.3)",
    marginBottom: 15,
    fontStyle: "italic",
  },
  packsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 15,
    marginBottom: 40,
  },
  packCard: {
    width: "47%",
    aspectRatio: 0.8,
    borderRadius: 24,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  packGradient: {
    flex: 1,
    padding: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  packContent: {
    alignItems: "center",
  },
  packCredits: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFF",
    marginBottom: 4,
  },
  packLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 20,
  },
  packPrice: {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  priceText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 14,
  },
  itemsGrid: {
    gap: 12,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  itemIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
    marginBottom: 4,
  },
  itemType: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.5)",
  },
  itemBuyBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  itemCost: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 12,
    fontWeight: "700",
  },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(108, 92, 231, 0.15)",
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(108, 92, 231, 0.4)",
    gap: 10,
  },
  successText: {
    color: "#6C5CE7",
    fontWeight: "600",
  },
  welcomeBonus: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#6C5CE7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  welcomeGradient: {
    padding: 16,
  },
  welcomeContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  welcomeTextContainer: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFF",
    marginBottom: 2,
  },
  welcomeSubtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
  },
  welcomeBonusDisabled: {
    opacity: 0.7,
  },
});
