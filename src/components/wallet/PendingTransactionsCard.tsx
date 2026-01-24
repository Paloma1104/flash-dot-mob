/**
 * Pending Transactions Card
 * Shows pending game rewards and allows batch claiming with single wallet confirmation.
 */
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { useWallet } from "@/hooks/useWallet";
import { usePendingTransactionStore } from "@/stores/pendingTransactionStore";
import { useUserStore } from "@/stores/userStore";

interface PendingTransactionsCardProps {
  compact?: boolean;
  onClaimComplete?: () => void;
}

export function PendingTransactionsCard({
  compact = false,
  onClaimComplete,
}: PendingTransactionsCardProps) {
  const {
    pendingTransactions,
    totalPendingRewards,
    isProcessing,
    markAsProcessing,
    markAsCompleted,
    markAsFailed,
    clearCompleted,
    getPendingCount,
  } = usePendingTransactionStore();

  const { addAP } = useUserStore();
  const { isConnected, sendTransaction } = useWallet();

  const pulseAnim = useSharedValue(1);

  // Pulse animation for pending badge
  React.useEffect(() => {
    if (totalPendingRewards > 0) {
      pulseAnim.value = withRepeat(
        withTiming(1.1, { duration: 1000 }),
        -1,
        true,
      );
    }
  }, [totalPendingRewards, pulseAnim]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  const pendingCount = getPendingCount();

  // Nothing pending
  if (pendingCount === 0) {
    return null;
  }

  const handleClaimAll = async () => {
    if (!isConnected) {
      Alert.alert(
        "Wallet Required",
        "Please connect your wallet to claim rewards.",
        [{ text: "OK" }],
      );
      return;
    }

    const pendingIds = pendingTransactions
      .filter((t) => t.status === "pending")
      .map((t) => t.id);

    if (pendingIds.length === 0) return;

    // Mark as processing
    markAsProcessing(pendingIds);

    try {
      // In production, this would be a batch claim contract call
      // For now, we simulate the transaction
      console.log(
        `🔗 Claiming ${pendingIds.length} rewards (${totalPendingRewards} AP)`,
      );

      // Simulate successful claim (replace with real contract call)
      // const txHash = await sendTransaction(contractAddress, calldata);

      // For demo: simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Simulate successful transaction
      const mockTxHash = `0x${Date.now().toString(16)}`;

      // Add rewards to balance immediately
      addAP(totalPendingRewards);

      // Mark transactions as completed
      markAsCompleted(pendingIds, mockTxHash);

      // Clear completed after a delay
      setTimeout(() => {
        clearCompleted();
      }, 2000);

      Alert.alert(
        "🎉 Rewards Claimed!",
        `Successfully claimed ${totalPendingRewards} AP tokens!`,
        [{ text: "Awesome!" }],
      );

      onClaimComplete?.();
    } catch (error) {
      console.error("Claim failed:", error);
      markAsFailed(
        pendingIds,
        error instanceof Error ? error.message : "Unknown error",
      );

      Alert.alert(
        "Claim Failed",
        "Failed to claim rewards. Please try again.",
        [{ text: "OK" }],
      );
    }
  };

  // Compact version for header badge
  if (compact) {
    return (
      <TouchableOpacity onPress={handleClaimAll} disabled={isProcessing}>
        <Animated.View style={[styles.compactBadge, animatedStyle]}>
          {isProcessing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text style={styles.compactIcon}>🪙</Text>
              <Text style={styles.compactText}>{totalPendingRewards}</Text>
            </>
          )}
        </Animated.View>
      </TouchableOpacity>
    );
  }

  // Full card version
  return (
    <LinearGradient
      colors={["rgba(255, 217, 61, 0.2)", "rgba(255, 217, 61, 0.1)"]}
      style={styles.card}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.icon}>🏆</Text>
          <View>
            <Text style={styles.title}>Pending Rewards</Text>
            <Text style={styles.subtitle}>
              {pendingCount} game{pendingCount > 1 ? "s" : ""} completed
            </Text>
          </View>
        </View>
        <View style={styles.rewardAmount}>
          <Text style={styles.rewardValue}>{totalPendingRewards}</Text>
          <Text style={styles.rewardLabel}>AP</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.claimButton, isProcessing && styles.claimButtonDisabled]}
        onPress={handleClaimAll}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <ActivityIndicator size="small" color="#000" />
        ) : (
          <>
            <Text style={styles.claimButtonText}>Claim All Rewards</Text>
            <Text style={styles.claimButtonSubtext}>
              Single confirmation required
            </Text>
          </>
        )}
      </TouchableOpacity>

      <Text style={styles.note}>
        💡 Batch claiming saves gas and requires only one wallet confirmation
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  // Compact badge
  compactBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFD93D",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  compactIcon: {
    fontSize: 14,
  },
  compactText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "800",
  },

  // Full card
  card: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 217, 61, 0.3)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  icon: {
    fontSize: 32,
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  subtitle: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
  },
  rewardAmount: {
    alignItems: "flex-end",
  },
  rewardValue: {
    color: "#FFD93D",
    fontSize: 28,
    fontWeight: "800",
  },
  rewardLabel: {
    color: "#FFD93D",
    fontSize: 12,
    fontWeight: "600",
  },
  claimButton: {
    backgroundColor: "#FFD93D",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  claimButtonDisabled: {
    opacity: 0.7,
  },
  claimButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "700",
  },
  claimButtonSubtext: {
    color: "rgba(0, 0, 0, 0.6)",
    fontSize: 11,
    marginTop: 2,
  },
  note: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 11,
    textAlign: "center",
  },
});
