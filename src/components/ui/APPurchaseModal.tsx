import { usePurchaseAP } from "@/src/hooks/useBlockchain";
import { useWallet } from "@/src/hooks/useWallet";
import { useUserStore } from "@/src/stores/userStore";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Linking,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { parseEther } from "viem";

interface APPurchaseModalProps {
  visible: boolean;
  onClose: () => void;
  onPurchase?: (monAmount: number, apAmount: number) => void;
}

// Step tracking for the purchase flow
enum PurchaseStep {
  NOT_STARTED = 0,
  NETWORK_READY = 1,
  APPROVED = 2,
  COMPLETED = 3,
}

/**
 * Modal for purchasing AP tokens with MON testnet
 * Exchange rate: 100 MON = 1000 AP (1 MON = 10 AP)
 * Minimum: 100 MON, must be multiple of 100
 * Now with three-button flow: Network Switch → Approval → Purchase
 */
export function APPurchaseModal({
  visible,
  onClose,
  onPurchase,
}: APPurchaseModalProps) {
  const { balance: monBalance, apBalance } = useUserStore();
  const { isConnected, address } = useWallet();
  const {
    switchNetwork,
    approveToken,
    executePurchase,
    isLoading: isPurchasing,
    error: purchaseError,
  } = usePurchaseAP();

  // Debug logging for modal visibility
  useEffect(() => {
    console.log("📱 APPurchaseModal visibility:", visible);
    console.log("📱 APPurchaseModal state:", {
      isConnected,
      address,
      monBalance,
      apBalance,
    });
  }, [visible, isConnected, address, monBalance, apBalance]);

  const [monAmount, setMonAmount] = useState("100"); // Start with minimum 100 MON
  const [currentStep, setCurrentStep] = useState<PurchaseStep>(
    PurchaseStep.NOT_STARTED,
  );
  const [approvalTxHash, setApprovalTxHash] = useState<string | null>(null);
  const [isNetworkSwitching, setIsNetworkSwitching] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  // Exchange rate: 100 MON = 1000 AP (contract requirement)
  // 1 MON = 10 AP
  const apReceived = (parseFloat(monAmount) || 0) * 10;

  // Reset state when modal closes
  const handleClose = () => {
    setCurrentStep(PurchaseStep.NOT_STARTED);
    setApprovalTxHash(null);
    setIsNetworkSwitching(false);
    setIsApproving(false);
    setMonAmount("100"); // Reset to minimum 100 MON
    onClose();
  };

  // Step 1: Switch Network
  const handleSwitchNetwork = async () => {
    if (!isConnected || !address) {
      Alert.alert("Wallet Not Connected", "Please connect your wallet first");
      return;
    }

    setIsNetworkSwitching(true);
    try {
      const result = await switchNetwork();
      if (result) {
        setCurrentStep(PurchaseStep.NETWORK_READY);
        Alert.alert(
          "Network Ready",
          "You can now approve tokens for the purchase",
        );
      }
    } catch (error) {
      console.error("Network switch failed:", error);
      Alert.alert(
        "Network Switch Failed",
        error instanceof Error ? error.message : "Please try again",
      );
    } finally {
      setIsNetworkSwitching(false);
    }
  };

  // Step 2: Approve Tokens
  const handleApprove = async () => {
    const mon = parseFloat(monAmount);

    if (isNaN(mon) || mon <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount");
      return;
    }

    if (mon > monBalance) {
      Alert.alert("Insufficient Balance", "You don't have enough MON tokens");
      return;
    }

    if (mon < 100) {
      Alert.alert("Minimum Purchase", "Minimum purchase is 100 MON");
      return;
    }

    if (mon % 100 !== 0) {
      Alert.alert("Invalid Amount", "Amount must be a multiple of 100 MON\n\nExamples: 100, 200, 300, 500, 1000");
      return;
    }

    setIsApproving(true);
    const monAmountWei = parseEther(mon.toString());

    // Open MetaMask and perform approval
    Linking.openURL("metamask://").catch(() => {});
    performApproval(monAmountWei);
  };

  const performApproval = async (monAmountWei: bigint) => {
    try {
      console.log(`🔐 Approving ${monAmount} MON for spending...`);
      console.log(`📊 Amount in wei: ${monAmountWei.toString()}`);
      console.log(`📊 Will receive: ${apReceived} AP (${monAmount} MON * 10)`);

      const txHash = await approveToken(monAmountWei);

      if (txHash) {
        setApprovalTxHash(txHash);
        setCurrentStep(PurchaseStep.APPROVED);
        Alert.alert(
          "Approval Successful!",
          `Tokens approved for spending.\nYou can now complete the purchase.\n\nTx: ${txHash.slice(0, 10)}...`,
        );
      }
    } catch (error) {
      console.error("Approval failed:", error);
      Alert.alert(
        "Approval Failed",
        error instanceof Error ? error.message : "Please try again",
      );
    } finally {
      setIsApproving(false);
    }
  };

  // Step 3: Execute Purchase
  const handlePurchase = async () => {
    // Open MetaMask and perform purchase
    Linking.openURL("metamask://").catch(() => {});
    performPurchase();
  };

  const performPurchase = async () => {
    const mon = parseFloat(monAmount);

    try {
      const monAmountWei = parseEther(mon.toString());
      console.log(`💸 Purchasing ${apReceived} AP with ${mon} MON...`);
      console.log(`📊 MON Amount (wei): ${monAmountWei.toString()}`);
      console.log(`📊 Expected AP: ${apReceived} (${mon} MON * 10)`);
      console.log(`📊 Exchange rate: 100 MON = 1000 AP`);

      const txHash = await executePurchase(monAmountWei);

      if (txHash) {
        console.log("✅ AP purchase successful, tx:", txHash);

        // Update local state after blockchain confirmation
        const userStore = useUserStore.getState();
        userStore.addAP(apReceived);

        if (onPurchase) {
          onPurchase(mon, apReceived);
        }

        setCurrentStep(PurchaseStep.COMPLETED);

        Alert.alert(
          "Success!",
          `Successfully purchased ${apReceived} AP!\n\nTransaction: ${txHash.slice(0, 10)}...`,
          [{ text: "OK", onPress: handleClose }],
        );
      }
    } catch (error) {
      console.error("Purchase failed:", error);
      const errorMessage =
        purchaseError ||
        (error instanceof Error ? error.message : "Transaction failed");
      Alert.alert("Purchase Failed", errorMessage + "\n\nPlease try again.");
    }
  };

  const quickAmounts = [100, 200, 500, 1000];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.modal}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Purchase AP Tokens</Text>
              <Pressable onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeText}>✕</Text>
              </Pressable>
            </View>

            {/* Exchange Rate */}
            <View style={styles.rateCard}>
              <Text style={styles.rateTitle}>Exchange Rate</Text>
              <Text style={styles.rateText}>100 MON = 1000 AP</Text>
              <Text style={styles.rateSubtext}>
                10 AP per MON • Min: 100 MON • Multiples of 100 only
              </Text>
            </View>

            {/* Balances */}
            <View style={styles.balances}>
              <View style={styles.balanceItem}>
                <Text style={styles.balanceLabel}>MON Balance</Text>
                <Text style={styles.balanceValue}>{monBalance.toFixed(2)}</Text>
              </View>
              <View style={styles.balanceItem}>
                <Text style={styles.balanceLabel}>AP Balance</Text>
                <Text style={styles.balanceValue}>{apBalance.toFixed(0)}</Text>
              </View>
            </View>

            {/* Amount Input */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>MON Amount</Text>
              <TextInput
                style={styles.input}
                value={monAmount}
                onChangeText={setMonAmount}
                keyboardType="numeric"
              placeholder="Enter amount (min 100 MON)"
                placeholderTextColor="#666"
              />
              <Text style={styles.inputHint}>
                Min 100 MON, must be multiples of 100 (e.g. 100, 200, 300)
              </Text>
            </View>

            {/* Quick Amount Buttons */}
            <View style={styles.quickButtons}>
              {quickAmounts.map((amount) => (
                <Pressable
                  key={amount}
                  style={[
                    styles.quickButton,
                    monAmount === amount.toString() && styles.quickButtonActive,
                  ]}
                  onPress={() => setMonAmount(amount.toString())}
                >
                  <Text
                    style={[
                      styles.quickButtonText,
                      monAmount === amount.toString() &&
                        styles.quickButtonTextActive,
                    ]}
                  >
                    {amount} MON
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Preview */}
            <View style={styles.preview}>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>You Pay:</Text>
                <Text style={styles.previewValue}>{monAmount || "0"} MON</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>You Get:</Text>
                <Text style={[styles.previewValue, styles.apValue]}>
                  {apReceived.toFixed(0)} AP
                </Text>
              </View>
            </View>

            {/* Step Indicator */}
            <View style={styles.stepsContainer}>
              <View style={styles.stepRow}>
                <View
                  style={[
                    styles.stepDot,
                    currentStep >= PurchaseStep.NETWORK_READY &&
                      styles.stepDotActive,
                  ]}
                />
                <Text style={styles.stepText}>Network Ready</Text>
              </View>
              <View style={styles.stepRow}>
                <View
                  style={[
                    styles.stepDot,
                    currentStep >= PurchaseStep.APPROVED &&
                      styles.stepDotActive,
                  ]}
                />
                <Text style={styles.stepText}>Tokens Approved</Text>
              </View>
              <View style={styles.stepRow}>
                <View
                  style={[
                    styles.stepDot,
                    currentStep >= PurchaseStep.COMPLETED &&
                      styles.stepDotActive,
                  ]}
                />
                <Text style={styles.stepText}>Purchase Complete</Text>
              </View>
            </View>

            {/* Three-Button Flow */}
            <View style={styles.buttonContainer}>
              {/* Step 1: Switch Network Button */}
              <Pressable
                style={[
                  styles.stepButton,
                  currentStep >= PurchaseStep.NETWORK_READY &&
                    styles.stepButtonDisabled,
                ]}
                onPress={handleSwitchNetwork}
                disabled={
                  isNetworkSwitching ||
                  currentStep >= PurchaseStep.NETWORK_READY
                }
              >
                {isNetworkSwitching ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.stepButtonText}>
                      {currentStep >= PurchaseStep.NETWORK_READY
                        ? "✓ Network Ready"
                        : "1. Switch Network"}
                    </Text>
                    {currentStep < PurchaseStep.NETWORK_READY && (
                      <Text style={styles.stepButtonSubtext}>
                        Verify network connection
                      </Text>
                    )}
                  </>
                )}
              </Pressable>

              {/* Step 2: Approve Button */}
              <Pressable
                style={[
                  styles.stepButton,
                  styles.approveButton,
                  (currentStep < PurchaseStep.NETWORK_READY ||
                    currentStep >= PurchaseStep.APPROVED) &&
                    styles.stepButtonDisabled,
                ]}
                onPress={handleApprove}
                disabled={
                  isApproving ||
                  currentStep < PurchaseStep.NETWORK_READY ||
                  currentStep >= PurchaseStep.APPROVED
                }
              >
                {isApproving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.stepButtonText}>
                      {currentStep >= PurchaseStep.APPROVED
                        ? "✓ Approved"
                        : "2. Approve Tokens"}
                    </Text>
                    {currentStep === PurchaseStep.NETWORK_READY && (
                      <Text style={styles.stepButtonSubtext}>
                        Approve {monAmount} MON for spending
                      </Text>
                    )}
                    {currentStep < PurchaseStep.NETWORK_READY && (
                      <Text style={styles.stepButtonSubtext}>
                        Complete step 1 first
                      </Text>
                    )}
                  </>
                )}
              </Pressable>

              {/* Step 3: Purchase Button */}
              <Pressable
                style={[
                  styles.stepButton,
                  styles.purchaseButton,
                  (currentStep < PurchaseStep.APPROVED ||
                    isPurchasing ||
                    parseFloat(monAmount) > monBalance) &&
                    styles.stepButtonDisabled,
                ]}
                onPress={handlePurchase}
                disabled={
                  isPurchasing ||
                  currentStep < PurchaseStep.APPROVED ||
                  parseFloat(monAmount) > monBalance
                }
              >
                {isPurchasing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.stepButtonText}>
                      {parseFloat(monAmount) > monBalance
                        ? "Insufficient Balance"
                        : currentStep >= PurchaseStep.COMPLETED
                          ? "✓ Purchase Complete"
                          : "3. Purchase AP"}
                    </Text>
                    {currentStep === PurchaseStep.APPROVED &&
                      parseFloat(monAmount) <= monBalance && (
                        <Text style={styles.stepButtonSubtext}>
                          Complete the purchase
                        </Text>
                      )}
                    {currentStep < PurchaseStep.APPROVED && (
                      <Text style={styles.stepButtonSubtext}>
                        Complete steps 1 & 2 first
                      </Text>
                    )}
                  </>
                )}
              </Pressable>
            </View>

            {/* Info */}
            <Text style={styles.info}>
              💡 Purchase AP tokens to play games. Rate: 100 MON = 1000 AP. Minimum 100 MON in multiples of 100.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "rgba(0, 0, 0, 0.9)", // Dark semi-transparent background
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1, // Behind modal content
  },
  modal: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#1a1a2e",
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "rgba(131, 110, 249, 0.5)",
    shadowColor: "#836ef9",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 2, // Above backdrop
    overflow: "hidden",
  },
  scrollView: {
    maxHeight: 600,
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeText: {
    fontSize: 20,
    color: "#fff",
  },
  rateCard: {
    backgroundColor: "rgba(131, 110, 249, 0.15)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(131, 110, 249, 0.3)",
  },
  rateTitle: {
    fontSize: 14,
    color: "#aaa",
    marginBottom: 4,
  },
  rateText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#836EF9",
  },
  rateSubtext: {
    fontSize: 12,
    color: "#4ECDC4",
    marginTop: 4,
  },
  balances: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  balanceItem: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 12,
  },
  balanceLabel: {
    fontSize: 12,
    color: "#aaa",
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  inputSection: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#fff",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  inputHint: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },
  quickButtons: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
  },
  quickButton: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  quickButtonActive: {
    backgroundColor: "rgba(131, 110, 249, 0.2)",
    borderColor: "#836EF9",
  },
  quickButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#aaa",
  },
  quickButtonTextActive: {
    color: "#836EF9",
  },
  preview: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  previewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  previewLabel: {
    fontSize: 14,
    color: "#aaa",
  },
  previewValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  apValue: {
    color: "#4ECDC4",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginVertical: 8,
  },
  stepsContainer: {
    marginTop: 8,
    marginBottom: 12,
    padding: 12,
    backgroundColor: "rgba(131, 110, 249, 0.1)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(131, 110, 249, 0.2)",
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginRight: 10,
  },
  stepDotActive: {
    backgroundColor: "#4CAF50",
  },
  stepText: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.7)",
  },
  buttonContainer: {
    gap: 10,
    marginTop: 8,
  },
  stepButton: {
    backgroundColor: "#836EF9",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    shadowColor: "#836EF9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  approveButton: {
    backgroundColor: "#FF9500",
    shadowColor: "#FF9500",
  },
  purchaseButton: {
    backgroundColor: "#4CAF50",
    shadowColor: "#4CAF50",
  },
  stepButtonDisabled: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    shadowOpacity: 0,
  },
  stepButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
  },
  stepButtonSubtext: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 4,
    textAlign: "center",
  },
  purchaseButtonDisabled: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  purchaseButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  info: {
    fontSize: 13,
    color: "#888",
    textAlign: "center",
    lineHeight: 18,
    marginTop: 16,
  },
});
