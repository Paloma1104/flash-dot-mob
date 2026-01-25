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
  "0x61dbad316e3f6503dfde8776427a2b9b51852d8944f2be986799b53a618f1e5d";

/**
 * Hook for purchasing game credits with MON
 * Rate: 5 MON = 50 Credits
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
        console.log(`💰 Purchasing credits (Amount: ${amountStr || "1.0"})...`);
        const amount = parseEther(amountStr || "1.0"); // Default 1.0 (50 credits) if not specified

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
