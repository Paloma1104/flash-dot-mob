import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { usePurchaseCredits } from "@/hooks/useBlockchain";
import { useGameCredits } from "@/hooks/useGameCredits";

interface APPurchaseModalProps {
  visible: boolean;
  onClose: () => void;
}

export function APPurchaseModal({ visible, onClose }: APPurchaseModalProps) {
  const {
    purchaseCredits,
    isLoading: isSending,
    error: sendError,
  } = usePurchaseCredits();
  const {
    buyCredits,
    isLoading: isVerifying,
    error: verifyError,
  } = useGameCredits();

  // Single fixed package: 5 MON = 50 Credits
  const MON_AMOUNT = "5.0";
  const CREDITS_AMOUNT = 50;

  const handlePurchase = async () => {
    try {
      // Step 1: Send MON
      // purchaseCredits hook handles the wallet tx for 5 MON
      const txHash = await purchaseCredits();

      if (txHash) {
        // Step 2: Verify on backend
        await buyCredits(txHash);
        onClose();
      }
    } catch (error) {
      console.error("Purchase flow failed", error);
    }
  };

  const isLoading = isSending || isVerifying;
  const error = sendError || verifyError;

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
            <Text style={styles.title}>Top Up Credits</Text>
            <Text style={styles.subtitle}>
              Purchase credits to play games and earn points.
            </Text>
          </View>

          <View style={styles.card}>
            <LinearGradient
              colors={["#4ECDC4", "#2E86DE"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              <View style={styles.cardContent}>
                <View>
                  <Text style={styles.amount}>{CREDITS_AMOUNT} CREDITS</Text>
                  <Text style={styles.rate}>1 Credit = 0.1 MON</Text>
                </View>
                <View style={styles.priceTag}>
                  <Text style={styles.price}>{MON_AMOUNT} MON</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color="#FF6B9D" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.buyButton, isLoading && styles.disabledButton]}
            onPress={handlePurchase}
            disabled={isLoading}
          >
            <LinearGradient
              colors={["#6C5CE7", "#a29bfe"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              {isLoading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#FFF" size="small" />
                  <Text style={styles.buttonText}>
                    {isSending ? "Sending MON..." : "Verifying..."}
                  </Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>
                  Purchase for {MON_AMOUNT} MON
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
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
    padding: 30,
    paddingBottom: 50,
  },
  closeButton: {
    alignSelf: "flex-end",
    padding: 10,
    marginBottom: 10,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
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
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#AAA",
    textAlign: "center",
  },
  card: {
    height: 100,
    borderRadius: 20,
    marginBottom: 30,
    elevation: 5,
    shadowColor: "#4ECDC4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cardGradient: {
    flex: 1,
    borderRadius: 20,
    padding: 20,
    justifyContent: "center",
  },
  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  amount: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFF",
  },
  rate: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
  },
  priceTag: {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 12,
  },
  price: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
  },
  buyButton: {
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#6C5CE7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 107, 157, 0.1)",
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    gap: 10,
  },
  errorText: {
    color: "#FF6B9D",
    fontSize: 14,
    flex: 1,
  },
});
