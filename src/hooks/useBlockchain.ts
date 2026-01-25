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
// Uses the deployer address from PRIVATE_KEY if TREASURY not set
const TREASURY_ADDRESS =
  process.env.EXPO_PUBLIC_TREASURY_ADDRESS ||
  "0xDbb458BF29B7AdDf8AE78D496EC0aF23A0E9B448"; // Fallback to MockMON contract as treasury

/**
 * Hook for purchasing game credits with MON
 * Rate: 10 credits per MON (e.g., 5 MON = 50 Credits)
 */
export function usePurchaseCredits() {
  const { walletClient, sendTransaction, address } = useWallet();
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
        console.log(`💰 Purchasing credits (Amount: ${amountStr || "5.0"} MON)...`);
        const amount = parseEther(amountStr || "5.0"); // Default 5.0 MON = 50 credits (10 credits per MON)

        const hash = await walletClient?.sendTransaction({
          to: TREASURY_ADDRESS as `0x${string}`,
          value: amount,
          account: address as `0x${string}`,
          chain: undefined, // Let wallet handle chain
        });

        if (hash) {
          console.log("✅ MON sent, tx:", hash);
          setState({ isLoading: false, error: null, txHash: hash });
          return hash;
        } else {
          throw new Error("Transaction failed");
        }
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Failed to purchase credits";
        console.error("Purchase error:", error);
        setState({ isLoading: false, error: errorMsg, txHash: null });
        return null;
      }
    },
    [address, walletClient],
  );

  return { ...state, purchaseCredits };
}
