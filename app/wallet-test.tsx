/**
 * @file WalletTestScreen.tsx
 * @description Test screen for verifying Privy wallet integration and blockchain transactions
 */

import {
    useClaimAirdrop,
    usePurchaseAP,
    useStartGame
} from "@/hooks/useBlockchain";
import { useWallet } from "@/hooks/useWallet";
import { useUserStore } from "@/stores/userStore";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Button,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { parseUnits } from "viem";

export default function WalletTestScreen() {
  const { connect, disconnect, address, isConnected, isConnecting } =
    useWallet();
  const { apBalance, balance } = useUserStore();

  const {
    claimAirdrop,
    isLoading: claimingAirdrop,
    txHash: airdropTx,
  } = useClaimAirdrop();
  const {
    purchaseAP,
    isLoading: purchasingAP,
    txHash: purchaseTx,
  } = usePurchaseAP();
  const { startGame, isLoading: startingGame, txHash: gameTx } = useStartGame();

  const [monAmount, setMonAmount] = useState("100");
  const [gameType, setGameType] = useState("capture");
  const [difficulty, setDifficulty] = useState("easy");

  const handleClaimAirdrop = async () => {
    const hash = await claimAirdrop();
    if (hash) {
      Alert.alert("Success!", `Airdrop claimed!\nTx: ${hash.slice(0, 10)}...`);
    }
  };

  const handlePurchaseAP = async () => {
    const amount = parseUnits(monAmount, 18);
    const hash = await purchaseAP(amount);
    if (hash) {
      Alert.alert("Success!", `AP purchased!\nTx: ${hash.slice(0, 10)}...`);
    }
  };

  const handleStartGame = async () => {
    const sessionId = `test-${Date.now()}`;
    const hash = await startGame(sessionId, gameType, difficulty);
    if (hash) {
      Alert.alert("Success!", `Game started!\nTx: ${hash.slice(0, 10)}...`);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>🔐 Privy Wallet Test</Text>

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
            <Text style={styles.balance}>AP Balance: {apBalance}</Text>
            <Text style={styles.balance}>MON Balance: {balance}</Text>
            <View style={styles.spacing} />
            <Button title="Disconnect" onPress={disconnect} color="#ff4444" />
          </View>
        )}
      </View>

      {isConnected && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎁 Claim Airdrop</Text>
            <View style={styles.card}>
              <Text style={styles.description}>
                Claim 1,000 AP tokens (one-time per wallet)
              </Text>
              {claimingAirdrop ? (
                <ActivityIndicator size="large" color="#0066cc" />
              ) : (
                <Button title="Claim 1,000 AP" onPress={handleClaimAirdrop} />
              )}
              {airdropTx && (
                <Text style={styles.txHash}>
                  Tx: {airdropTx.slice(0, 20)}...
                </Text>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💰 Purchase AP</Text>
            <View style={styles.card}>
              <Text style={styles.label}>
                MON Amount (must be multiple of 100):
              </Text>
              <TextInput
                style={styles.input}
                value={monAmount}
                onChangeText={setMonAmount}
                keyboardType="numeric"
                placeholder="100"
              />
              <Text style={styles.description}>
                Will receive: {parseInt(monAmount) * 10} AP
              </Text>
              {purchasingAP ? (
                <ActivityIndicator size="large" color="#0066cc" />
              ) : (
                <Button title="Purchase AP" onPress={handlePurchaseAP} />
              )}
              {purchaseTx && (
                <Text style={styles.txHash}>
                  Tx: {purchaseTx.slice(0, 20)}...
                </Text>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎮 Start Game</Text>
            <View style={styles.card}>
              <Text style={styles.label}>Game Type:</Text>
              <TextInput
                style={styles.input}
                value={gameType}
                onChangeText={setGameType}
                placeholder="capture, puzzle, sudoku"
              />

              <Text style={styles.label}>Difficulty:</Text>
              <TextInput
                style={styles.input}
                value={difficulty}
                onChangeText={setDifficulty}
                placeholder="easy, medium, hard"
              />

              <Text style={styles.description}>
                Cost:{" "}
                {difficulty === "easy"
                  ? "10"
                  : difficulty === "medium"
                    ? "25"
                    : "50"}{" "}
                AP
              </Text>

              {startingGame ? (
                <ActivityIndicator size="large" color="#0066cc" />
              ) : (
                <Button title="Start Game" onPress={handleStartGame} />
              )}
              {gameTx && (
                <Text style={styles.txHash}>Tx: {gameTx.slice(0, 20)}...</Text>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.info}>
              ℹ️ All transactions are executed on Anvil local testnet (Chain ID:
              31337). Make sure Anvil is running on port 8545.
            </Text>
          </View>
        </>
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

