/**
 * Pending Transaction Store
 * Manages transactions that are queued for batch signing later.
 * Games start immediately, rewards are queued, user signs later.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { GameType } from "../types/game";

export interface PendingTransaction {
  id: string;
  type: "GAME_REWARD" | "GAME_ENTRY" | "CLAIM";
  gameType?: GameType;
  sessionId: string;
  amount: number;
  createdAt: string;
  status: "pending" | "processing" | "completed" | "failed";
  txHash?: string;
  error?: string;
}

interface PendingTransactionState {
  // Queued transactions
  pendingTransactions: PendingTransaction[];
  totalPendingRewards: number;
  isProcessing: boolean;

  // Actions
  addPendingTransaction: (
    tx: Omit<PendingTransaction, "id" | "createdAt" | "status">,
  ) => void;
  removePendingTransaction: (id: string) => void;
  markAsProcessing: (ids: string[]) => void;
  markAsCompleted: (ids: string[], txHash: string) => void;
  markAsFailed: (ids: string[], error: string) => void;
  clearCompleted: () => void;
  getPendingCount: () => number;
  getTotalRewards: () => number;
}

export const usePendingTransactionStore = create<PendingTransactionState>()(
  persist(
    (set, get) => ({
      pendingTransactions: [],
      totalPendingRewards: 0,
      isProcessing: false,

      addPendingTransaction: (tx) => {
        const newTx: PendingTransaction = {
          ...tx,
          id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
          status: "pending",
        };

        set((state) => {
          const updated = [...state.pendingTransactions, newTx];
          const total = updated
            .filter((t) => t.status === "pending" && t.type === "GAME_REWARD")
            .reduce((sum, t) => sum + t.amount, 0);
          return {
            pendingTransactions: updated,
            totalPendingRewards: total,
          };
        });

        console.log(
          `📦 Added pending transaction: ${newTx.id} (${tx.amount} AP)`,
        );
      },

      removePendingTransaction: (id) => {
        set((state) => {
          const updated = state.pendingTransactions.filter((t) => t.id !== id);
          const total = updated
            .filter((t) => t.status === "pending" && t.type === "GAME_REWARD")
            .reduce((sum, t) => sum + t.amount, 0);
          return {
            pendingTransactions: updated,
            totalPendingRewards: total,
          };
        });
      },

      markAsProcessing: (ids) => {
        set((state) => ({
          isProcessing: true,
          pendingTransactions: state.pendingTransactions.map((t) =>
            ids.includes(t.id) ? { ...t, status: "processing" as const } : t,
          ),
        }));
      },

      markAsCompleted: (ids, txHash) => {
        set((state) => {
          const updated = state.pendingTransactions.map((t) =>
            ids.includes(t.id)
              ? { ...t, status: "completed" as const, txHash }
              : t,
          );
          const total = updated
            .filter((t) => t.status === "pending" && t.type === "GAME_REWARD")
            .reduce((sum, t) => sum + t.amount, 0);
          return {
            isProcessing: false,
            pendingTransactions: updated,
            totalPendingRewards: total,
          };
        });
        console.log(`✅ Marked ${ids.length} transactions as completed`);
      },

      markAsFailed: (ids, error) => {
        set((state) => ({
          isProcessing: false,
          pendingTransactions: state.pendingTransactions.map((t) =>
            ids.includes(t.id) ? { ...t, status: "failed" as const, error } : t,
          ),
        }));
        console.log(`❌ Marked ${ids.length} transactions as failed: ${error}`);
      },

      clearCompleted: () => {
        set((state) => ({
          pendingTransactions: state.pendingTransactions.filter(
            (t) => t.status !== "completed",
          ),
        }));
      },

      getPendingCount: () => {
        return get().pendingTransactions.filter((t) => t.status === "pending")
          .length;
      },

      getTotalRewards: () => {
        return get()
          .pendingTransactions.filter(
            (t) => t.status === "pending" && t.type === "GAME_REWARD",
          )
          .reduce((sum, t) => sum + t.amount, 0);
      },
    }),
    {
      name: "pending-transactions-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
