import { useGameCredits } from "@/hooks/useGameCredits";
import { useWallet } from "@/hooks/useWallet";
import { useUserStore } from "@/stores/userStore";
import {
    ActivityIndicator,
    Alert,
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
    credits,
    claimCredits,
    isLoading: claiming,
  } = useGameCredits();

  const handleClaim = async () => {
    // Claim free 50 credits (one-time per wallet)
    try {
      const result = await claimCredits();
      if (result.success) {
        Alert.alert("Success", `Claimed ${result.credits} credits!`);
      } else {
        Alert.alert("Info", result.message || "Already claimed");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to claim credits");
    }
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
          <Text style={styles.sectionTitle}>🎁 Claim Free Credits</Text>
          <View style={styles.card}>
            <Text style={styles.balance}>Current Credits: {credits}</Text>
            <Text style={styles.description}>
              Claim your free 50 credits (one-time per wallet)
            </Text>
            {claiming ? (
              <ActivityIndicator size="large" color="#0066cc" />
            ) : (
              <Button title="Claim 50 Credits" onPress={handleClaim} />
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
