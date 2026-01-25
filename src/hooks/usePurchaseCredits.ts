/**
 * @file usePurchaseCredits.ts
 * @description Hook for purchasing credits using CreditsMarketplace smart contract
 */

import { useCallback, useState } from "react";
import { parseEther } from "viem";
import { useGameCredits } from "./useGameCredits";
import { useWallet } from "./useWallet";

interface PurchaseState {
  isLoading: boolean;
  error: string | null;
}

const MARKETPLACE_ADDRESS = process.env.EXPO_PUBLIC_CREDITS_MARKETPLACE_ADDRESS as `0x${string}`;

/**
 * Hook for purchasing credits on-chain via CreditsMarketplace
 * Rate: 0.1 MON per credit (10 credits per MON)
 */
export function usePurchaseCreditsOnChain() {
  const { sendTransaction, address, isConnected } = useWallet();
  const { buyCredits: buyCreditsOffChain } = useGameCredits();
  const [state, setState] = useState<PurchaseState>({
    isLoading: false,
    error: null,
  });

  const purchaseCredits = useCallback(
    async (credits: number, monAmount: number) => {
      if (!isConnected || !address) {
        setState({ isLoading: false, error: "Wallet not connected" });
        return { success: false, error: "Wallet not connected", txHash: null };
      }

      if (!MARKETPLACE_ADDRESS) {
        setState({ isLoading: false, error: "Marketplace not configured" });
        return { success: false, error: "Marketplace not configured", txHash: null };
      }

      setState({ isLoading: true, error: null });

      try {
        console.log(`💳 Purchasing ${credits} credits for ${monAmount} MON...`);
        console.log(`📍 Marketplace: ${MARKETPLACE_ADDRESS}`);

        // Convert MON amount to wei
        const valueWei = parseEther(monAmount.toString());
        const valueHex = `0x${valueWei.toString(16)}`;

        console.log(`💵 Value: ${monAmount} MON = ${valueWei} wei`);

        // Encode function call: buyCredits(uint256 amount)
        // Function selector: 0x9c2f9b8b (first 4 bytes of keccak256("buyCredits(uint256)"))
        const amountHex = credits.toString(16).padStart(64, "0");
        const data = `0x9c2f9b8b${amountHex}`;

        console.log(`📤 Calling buyCredits(${credits})`);
        console.log(`📦 Data: ${data}`);

        // Send transaction to marketplace contract
        const txHash = await sendTransaction(
          MARKETPLACE_ADDRESS,
          data,
          valueHex
        );

        if (txHash) {
          console.log(`✅ Purchase TX confirmed: ${txHash}`);
          
          // Update backend balance (virtual purchase for instant UI update)
          await buyCreditsOffChain(txHash, credits);
          
          setState({ isLoading: false, error: null });
          return { success: true, txHash, error: null };
        } else {
          console.log("⚠️ Transaction cancelled by user");
          setState({ isLoading: false, error: null });
          return { success: false, error: "Transaction cancelled", txHash: null };
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Purchase failed";
        console.error("❌ Purchase error:", error);
        setState({ isLoading: false, error: errorMsg });
        return { success: false, error: errorMsg, txHash: null };
      }
    },
    [address, isConnected, sendTransaction, buyCreditsOffChain]
  );

  return { ...state, purchaseCredits };
}
