import { useCallback, useState } from "react";
import { useWallet } from "./useWallet";

interface TransactionState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
}

interface UserBalance {
  credits: number;
  points: number;
}

// NOTE: Hardcoded to bypass Expo's env cache issue. Update IP if it changes.
const BACKEND_URL = "http://172.22.65.49:3001";

export function useGameCredits() {
  const { address } = useWallet();
  const [balance, setBalance] = useState<UserBalance>({
    credits: 0,
    points: 0,
  });
  const [state, setState] = useState<TransactionState>({
    isLoading: false,
    error: null,
    success: false,
  });

  const fetchBalance = useCallback(async () => {
    if (!address) {
      console.log("⚠️ fetchBalance: No address available");
      return;
    }

    console.log(`🔄 Fetching balance for ${address}...`);
    console.log(`📡 Backend URL: ${BACKEND_URL}`);

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/user/balance/${address}`,
      );

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ Balance response:`, data);

      if (data.success) {
        setBalance({ credits: data.credits, points: data.points });
        console.log(`💰 Credits: ${data.credits}, Points: ${data.points}`);
      } else {
        throw new Error(data.error || "Failed to fetch balance");
      }
    } catch (error) {
      console.error("❌ Failed to fetch balance:", error);
      // Re-throw so caller can handle it
      throw error;
    }
  }, [address]);

  /**
   * Buy Credits
   * If txHash is provided, verifies real MON purchase.
   * If no txHash, triggers "Virtual Purchase" (backend signer TX).
   */
  const buyCredits = useCallback(
    async (txHash?: string, amount?: number) => {
      if (!address) return { success: false, txHash: null };
      setState({ isLoading: true, error: null, success: false });

      try {
        const response = await fetch(`${BACKEND_URL}/api/credits/buy`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ txHash, address, amount }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to buy credits");
        }

        setBalance((prev) => ({ ...prev, credits: data.newBalance }));
        setState({ isLoading: false, error: null, success: true });
        return { success: true, txHash: data.txHash || null };
      } catch (error) {
        const msg =
          error instanceof Error ? error.message : "Buy credits failed";
        setState({ isLoading: false, error: msg, success: false });
        return { success: false, txHash: null };
      }
    },
    [address],
  );

  const startGame = useCallback(
    async (gameType: string) => {
      if (!address) return { success: false, txHash: null };

      try {
        const response = await fetch(`${BACKEND_URL}/api/game/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address, gameType }),
        });

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 402) {
            throw new Error("Insufficient credits");
          }
          throw new Error(data.error || "Failed to start game");
        }

        setBalance((prev) => ({ ...prev, credits: data.newBalance }));
        return { success: true, txHash: data.txHash || null }; // Mock or real hash
      } catch (error) {
        console.error("Start game API error:", error);
        return { success: false, txHash: null };
      }
    },
    [address],
  );

  const completeGame = useCallback(
    async (score: number) => {
      if (!address) return { success: false, txHash: null };

      try {
        const response = await fetch(`${BACKEND_URL}/api/game/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address, score }),
        });

        const data = await response.json();

        if (data.success) {
          setBalance((prev) => ({ ...prev, points: data.newPoints }));
          return { success: true, txHash: data.txHash || null };
        }
        return { success: false, txHash: null };
      } catch (error) {
        console.error("Complete game API error:", error);
        return { success: false, txHash: null };
      }
    },
    [address],
  );

  return {
    credits: balance.credits,
    points: balance.points,
    isLoading: state.isLoading,
    error: state.error,
    fetchBalance,
    buyCredits,
    startGame,
    completeGame,
  };
}
