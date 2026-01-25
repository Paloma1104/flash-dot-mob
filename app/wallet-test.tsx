import { usePurchaseCredits } from "@/hooks/useBlockchain";
import { useWallet } from "@/hooks/useWallet";
import { useUserStore } from "@/stores/userStore";
import {
  ActivityIndicator,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function WalletTestScreen() {
  const { connect, disconnect, address, isConnected, isConnecting } =
    useWallet();
  const { apBalance, balance } = useUserStore();

  const {
    purchaseCredits,
    isLoading: purchasing,
    txHash: purchaseTx,
  } = usePurchaseCredits();

  const handlePurchase = async () => {
    // Buy 50 credits for 5 MON
    await purchaseCredits();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>🔐 Wallet Test</Text>

        {!isConnected ? (
          <View style={styles.card}>
            <Text style={styles.label}>Wallet Not Connected</Text>
            <Button
              title={isConnecting ? "Connecting..." : "Connect Wallet"}
              onPress={connect}
              disabled={isConnecting}
            />
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.label}>✅ Connected</Text>
            <Text style={styles.address}>{address}</Text>
            <View style={styles.spacing} />
            <Button title="Disconnect" onPress={disconnect} color="#ff4444" />
          </View>
        )}
      </View>

      {isConnected && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 Purchase Credits</Text>
          <View style={styles.card}>
            <Text style={styles.description}>Buy 50 Credits for 5 MON</Text>
            {purchasing ? (
              <ActivityIndicator size="large" color="#0066cc" />
            ) : (
              <Button title="Buy Credits" onPress={handlePurchase} />
            )}
            {purchaseTx && (
              <Text style={styles.txHash}>
                Tx: {purchaseTx.slice(0, 20)}...
              </Text>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  section: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  address: {
    fontSize: 12,
    fontFamily: "monospace",
    backgroundColor: "#f0f0f0",
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  balance: {
    fontSize: 16,
    fontWeight: "500",
    marginVertical: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: "#fafafa",
  },
  description: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  txHash: {
    fontSize: 11,
    fontFamily: "monospace",
    color: "#0066cc",
    marginTop: 8,
    backgroundColor: "#e6f2ff",
    padding: 6,
    borderRadius: 4,
  },
  spacing: {
    height: 12,
  },
  info: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
  },
});
