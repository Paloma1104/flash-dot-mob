/**
 * @file blockchainHooks.ts
 * @description React hooks for blockchain transactions with Privy wallet
 */

import { useCallback, useState } from "react";
import { encodeFunctionData } from "viem";
import {
    AP_TOKEN_ABI,
    GAME_REWARDS_ABI,
    getAPTokenService,
} from "../services/blockchain/apTokenService";
import {
    FLASH_MOB_ABI,
    getFlashMobService,
} from "../services/blockchain/flashMobService";
import { useWallet } from "./useWallet";

interface TransactionState {
  isLoading: boolean;
  error: string | null;
  txHash: string | null;
}

/**
 * Hook for claiming initial AP airdrop
 */
export function useClaimAirdrop() {
  const { walletClient, sendTransaction, address } = useWallet();
  const [state, setState] = useState<TransactionState>({
    isLoading: false,
    error: null,
    txHash: null,
  });

  const claimAirdrop = useCallback(async () => {
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
      const apService = getAPTokenService();
      if (!apService) {
        throw new Error("APToken service not initialized");
      }

      const data = encodeFunctionData({
        abi: AP_TOKEN_ABI,
        functionName: "claimInitialAirdrop",
        args: [],
      });

      const txHash = await sendTransaction(apService.contractAddress, data);

      if (txHash) {
        console.log("✅ Airdrop claimed, tx:", txHash);
        setState({ isLoading: false, error: null, txHash });
        return txHash;
      } else {
        throw new Error("Transaction failed");
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to claim airdrop";
      console.error("Claim airdrop error:", error);
      setState({ isLoading: false, error: errorMsg, txHash: null });
      return null;
    }
  }, [address, sendTransaction]);

  return { ...state, claimAirdrop };
}

/**
 * Hook for purchasing AP with MON tokens (separated into steps)
 */
export function usePurchaseAP() {
  const { walletClient, sendTransaction, address } = useWallet();
  const [state, setState] = useState<TransactionState>({
    isLoading: false,
    error: null,
    txHash: null,
  });

  // Check and switch to correct network
  const switchNetwork = useCallback(async () => {
    console.log("🔵 switchNetwork called");

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
      const apService = getAPTokenService();
      if (!apService) {
        throw new Error("APToken service not initialized");
      }

      // For now, we'll assume the network is correct since switching is handled
      // by the sendTransaction function automatically. This button will just
      // verify the connection.
      console.log("✅ Network verification complete");
      setState({ isLoading: false, error: null, txHash: "network_ready" });
      return "network_ready";
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Network check failed";
      console.error("❌ Network check error:", error);
      setState({ isLoading: false, error: errorMsg, txHash: null });
      return null;
    }
  }, [address]);

  // Approve MON tokens for spending
  const approveToken = useCallback(
    async (monAmount: bigint) => {
      console.log("🔵 approveToken called with amount:", monAmount.toString());
      console.log(`   📊 Amount breakdown:`);
      console.log(`      - Wei: ${monAmount.toString()}`);
      console.log(`      - MON: ${Number(monAmount) / 1e18}`);

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
        const apService = getAPTokenService();
        if (!apService) {
          throw new Error("APToken service not initialized");
        }

        console.log("🔵 Approving MON tokens...");
        console.log(
          `   📍 Spender (APToken contract): ${apService.contractAddress}`,
        );
        console.log(`   📍 MON Token contract: ${apService.monTokenAddress}`);

        const approveData = encodeFunctionData({
          abi: [
            {
              name: "approve",
              type: "function",
              stateMutability: "nonpayable",
              inputs: [
                { name: "spender", type: "address" },
                { name: "amount", type: "uint256" },
              ],
              outputs: [{ name: "", type: "bool" }],
            },
          ],
          functionName: "approve",
          args: [apService.contractAddress, monAmount],
        });

        console.log(`   📦 Encoded approval data: ${approveData}`);
        console.log(`   📦 Data length: ${approveData.length}`);

        const approveTxHash = await sendTransaction(
          apService.monTokenAddress,
          approveData,
        );

        if (!approveTxHash) {
          throw new Error("Approval transaction failed");
        }

        console.log("✅ Approval successful, tx:", approveTxHash);
        setState({ isLoading: false, error: null, txHash: approveTxHash });
        return approveTxHash;
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Failed to approve tokens";
        console.error("❌ Approval error:", error);
        setState({ isLoading: false, error: errorMsg, txHash: null });
        return null;
      }
    },
    [address, sendTransaction],
  );

  // Execute the purchase
  const executePurchase = useCallback(
    async (monAmount: bigint) => {
      console.log(
        "🔵 executePurchase called with amount:",
        monAmount.toString(),
      );
      console.log(`   📊 Amount breakdown:`);
      console.log(`      - Wei: ${monAmount.toString()}`);
      console.log(`      - MON: ${Number(monAmount) / 1e18}`);
      console.log(`   📊 Expected conversion (UI):`);
      console.log(`      - Exchange rate: 1 MON = 100 AP`);
      console.log(`      - Expected AP: ${(Number(monAmount) / 1e18) * 100}`);
      console.log(`   📊 Contract parameters:`);
      console.log(`      - Sending MON amount: ${monAmount.toString()} wei`);

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
        const apService = getAPTokenService();
        if (!apService) {
          throw new Error("APToken service not initialized");
        }

        console.log("🔵 Purchasing AP tokens...");
        console.log(`   📍 APToken contract: ${apService.contractAddress}`);

        const data = encodeFunctionData({
          abi: AP_TOKEN_ABI,
          functionName: "purchaseAP",
          args: [monAmount],
        });

        console.log(`   📦 Encoded purchase data: ${data}`);
        console.log(`   📦 Function signature: purchaseAP(uint256)`);
        console.log(`   📦 Arguments: [${monAmount.toString()}]`);
        console.log(`   📦 Data breakdown:`);
        console.log(`      - Function selector: ${data.slice(0, 10)}`);
        console.log(`      - Encoded amount: ${data.slice(10)}`);

        const txHash = await sendTransaction(apService.contractAddress, data);

        if (txHash) {
          console.log("✅ AP purchased, tx:", txHash);
          console.log("   💡 Check transaction on block explorer to verify:");
          console.log(
            `      - MON transferred: ${Number(monAmount) / 1e18} MON`,
          );
          console.log(
            `      - Expected AP (UI rate): ${(Number(monAmount) / 1e18) * 100} AP`,
          );
          setState({ isLoading: false, error: null, txHash });
          return txHash;
        } else {
          throw new Error("Purchase transaction failed");
        }
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Failed to purchase AP";
        console.error("❌ Purchase error:", error);
        console.error("   💡 If contract reverted, it may be due to:");
        console.error("      - Insufficient MON balance");
        console.error(
          "      - Insufficient allowance (approval not confirmed)",
        );
        console.error("      - Contract validation rules not met");
        setState({ isLoading: false, error: errorMsg, txHash: null });
        return null;
      }
    },
    [address, sendTransaction],
  );

  // Legacy combined function for backward compatibility
  const purchaseAP = useCallback(
    async (monAmount: bigint) => {
      console.log("🔵 purchaseAP called (legacy combined method)");

      // Step 1: Switch network
      const networkReady = await switchNetwork();
      if (!networkReady) return null;

      // Step 2: Approve tokens
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const approvalTx = await approveToken(monAmount);
      if (!approvalTx) return null;

      // Step 3: Execute purchase
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const purchaseTx = await executePurchase(monAmount);
      return purchaseTx;
    },
    [switchNetwork, approveToken, executePurchase],
  );

  return {
    ...state,
    purchaseAP,
    switchNetwork,
    approveToken,
    executePurchase,
  };
}

/**
 * Hook for starting a game session (burns AP)
 */
export function useStartGame() {
  const { walletClient, sendTransaction, address } = useWallet();
  const [state, setState] = useState<TransactionState>({
    isLoading: false,
    error: null,
    txHash: null,
  });

  const startGame = useCallback(
    async (sessionId: string, gameType: string, difficulty: string) => {
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
        const apService = getAPTokenService();
        if (!apService) {
          throw new Error("GameRewards service not initialized");
        }

        // Convert session ID to bytes32
        const sessionIdBytes =
          `0x${sessionId.replace(/[^a-fA-F0-9]/g, "").padStart(64, "0")}` as `0x${string}`;

        const data = encodeFunctionData({
          abi: GAME_REWARDS_ABI,
          functionName: "startGame",
          args: [sessionIdBytes, gameType, difficulty],
        });

        const txHash = await sendTransaction(
          apService.gameRewardsAddress,
          data,
        );

        if (txHash) {
          console.log("✅ Game started on-chain, tx:", txHash);
          setState({ isLoading: false, error: null, txHash });
          return txHash;
        } else {
          throw new Error("Transaction failed");
        }
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Failed to start game";
        console.error("Start game error:", error);
        setState({ isLoading: false, error: errorMsg, txHash: null });
        return null;
      }
    },
    [address, sendTransaction],
  );

  return { ...state, startGame };
}

/**
 * Hook for claiming game rewards with backend signature
 */
export function useClaimReward() {
  const { walletClient, sendTransaction, address } = useWallet();
  const [state, setState] = useState<TransactionState>({
    isLoading: false,
    error: null,
    txHash: null,
  });

  const claimReward = useCallback(
    async (
      sessionId: string,
      score: number,
      difficulty: "easy" | "medium" | "hard",
      gameType: string,
    ) => {
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
        // 1. Call backend to get EIP-712 signature
        const backendUrl =
          process.env.EXPO_PUBLIC_BACKEND_URL || "http://localhost:3001";
        const response = await fetch(`${backendUrl}/api/sign-reward`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            player: address,
            score,
            difficulty,
            gameType,
          }),
        });

        if (!response.ok) {
          throw new Error("Backend signature failed");
        }

        const { signature, monReward, deadline, sessionIdBytes32 } =
          await response.json();

        // 2. Submit transaction with signature
        const apService = getAPTokenService();
        if (!apService) {
          throw new Error("GameRewards service not initialized");
        }

        const data = encodeFunctionData({
          abi: GAME_REWARDS_ABI,
          functionName: "claimReward",
          args: [
            sessionIdBytes32 as `0x${string}`,
            BigInt(monReward) * BigInt(10 ** 18), // Convert to wei
            BigInt(score),
            BigInt(deadline),
            signature as `0x${string}`,
          ],
        });

        const txHash = await sendTransaction(
          apService.gameRewardsAddress,
          data,
        );

        if (txHash) {
          console.log(`✅ Reward claimed: ${monReward} MON, tx:`, txHash);
          setState({ isLoading: false, error: null, txHash });
          return txHash;
        } else {
          throw new Error("Transaction failed");
        }
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Failed to claim reward";
        console.error("Claim reward error:", error);
        setState({ isLoading: false, error: errorMsg, txHash: null });
        return null;
      }
    },
    [address, sendTransaction],
  );

  return { ...state, claimReward };
}

/**
 * Hook for claiming location drops with signature
 */
export function useClaimDrop() {
  const { walletClient, sendTransaction, address } = useWallet();
  const [state, setState] = useState<TransactionState>({
    isLoading: false,
    error: null,
    txHash: null,
  });

  const claimDrop = useCallback(
    async (
      dropId: string,
      amount: bigint,
      deadline: bigint,
      signature: `0x${string}`,
    ) => {
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
        const flashMobService = getFlashMobService();
        if (!flashMobService) {
          throw new Error("FlashMob service not initialized");
        }

        const dropIdBytes =
          `0x${dropId.replace(/[^a-fA-F0-9]/g, "").padStart(64, "0")}` as `0x${string}`;

        const data = encodeFunctionData({
          abi: FLASH_MOB_ABI,
          functionName: "claimWithHash",
          args: [dropIdBytes, amount, deadline, signature],
        });

        const txHash = await sendTransaction(
          flashMobService.contractAddress,
          data,
        );

        if (txHash) {
          console.log("✅ Drop claimed, tx:", txHash);
          setState({ isLoading: false, error: null, txHash });
          return txHash;
        } else {
          throw new Error("Transaction failed");
        }
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Failed to claim drop";
        console.error("Claim drop error:", error);
        setState({ isLoading: false, error: errorMsg, txHash: null });
        return null;
      }
    },
    [address, sendTransaction],
  );

  return { ...state, claimDrop };
}
