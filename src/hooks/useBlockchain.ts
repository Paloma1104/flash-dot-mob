/**
 * @file blockchainHooks.ts
 * @description React hooks for blockchain transactions (credits purchase)
 */

import { useCallback, useState } from "react";
import { parseEther } from "viem";
import { useWallet } from "./useWallet";

interface TransactionState {
  isLoading: boolean;
  error: string | null;
  txHash: string | null;
}

// Treasury address to receive MON payments
// In production, this should be a secure wallet or contract
const TREASURY_ADDRESS =
  process.env.EXPO_PUBLIC_TREASURY_ADDRESS ||
  "0xDbb458BF29B7AdDf8AE78D496EC0aF23A0E9B448"; // Fallback to MockMON contract as treasury

/**
 * Hook for purchasing game credits with MON
 * Rate: 10 credits per MON (e.g., 5 MON = 50 Credits)
 */
export function usePurchaseCredits() {
  const { sendTransaction, address } = useWallet();
  const [state, setState] = useState<TransactionState>({
    isLoading: false,
    error: null,
    txHash: null,
  });

  const purchaseCredits = useCallback(
    async (amountStr?: string) => {
      if (!address) {
        setState({
          isLoading: false,
          error: "Wallet not connected",
          txHash: null,
        });
        return null;
      }

      setState({ isLoading: true, error: null, txHash: null });

      try {
        const amount = amountStr || "5.0";
        console.log(`💰 Purchasing credits: ${amount} MON to treasury...`);
        console.log(`📍 Treasury address: ${TREASURY_ADDRESS}`);

        // Convert amount to wei value as hex for the transaction
        const amountWei = parseEther(amount);
        const valueHex = `0x${amountWei.toString(16)}`;

        console.log(`💵 Value in wei: ${amountWei}`);
        console.log(`💵 Value hex: ${valueHex}`);

        // Use sendTransaction from useWallet which handles WalletConnect properly
        // Pass: to (treasury), data (memo), value (MON amount in wei hex)
        const hash = await sendTransaction(
          TREASURY_ADDRESS,
          "0x", // Empty data for simple transfer
          valueHex,
        );

        if (hash) {
          console.log("✅ MON sent, tx:", hash);
          setState({ isLoading: false, error: null, txHash: hash });
          return hash;
        } else {
          // User cancelled or transaction failed silently
          console.log("⚠️ Transaction returned null (cancelled or failed)");
          setState({ isLoading: false, error: null, txHash: null });
          return null;
        }
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Failed to purchase credits";
        console.error("❌ Purchase error:", error);
        setState({ isLoading: false, error: errorMsg, txHash: null });
        return null;
      }
    },
    [address, sendTransaction],
  );

  return { ...state, purchaseCredits };
}
