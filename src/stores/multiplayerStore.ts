import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { GameType } from "../types/game";
import type {
  MultiplayerGameResult,
  MultiplayerPlayer,
  MultiplayerSession,
  MultiplayerStation,
  StationStatus,
} from "../types/multiplayer";
import { LNMIIT_MULTIPLAYER_STATION } from "../types/multiplayer";
import { useUserStore } from "./userStore";

interface MultiplayerState {
  // Available stations
  nearbyStations: MultiplayerStation[];

  // Current station the user has joined
  currentStation: MultiplayerStation | null;
  currentSession: MultiplayerSession | null;

  // UI State
  isInLobby: boolean;
  isInMultiplayerGame: boolean;
  isLoading: boolean;
  error: string | null;

  // Game history
  multiplayerHistory: MultiplayerSession[];

  // Actions
  fetchNearbyStations: (latitude: number, longitude: number) => Promise<void>;
  joinStation: (stationId: string) => Promise<boolean>;
  leaveStation: () => Promise<boolean>;
  updateStationStatus: (
    stationId: string,
    status: StationStatus,
    players?: MultiplayerPlayer[],
  ) => void;
  setSelectedGame: (stationId: string, gameType: GameType) => void;
  submitGameResult: (result: MultiplayerGameResult) => Promise<boolean>;
  handleGameComplete: (winnerId: string, prize: number) => void;
  clearCurrentStation: () => void;
  setError: (error: string | null) => void;
}

export const useMultiplayerStore = create<MultiplayerState>()(
  persist(
    (set, get) => ({
      nearbyStations: [],
      currentStation: null,
      currentSession: null,
      isInLobby: false,
      isInMultiplayerGame: false,
      isLoading: false,
      error: null,
      multiplayerHistory: [],

      fetchNearbyStations: async (latitude: number, longitude: number) => {
        set({ isLoading: true, error: null });

        try {
          // For now, return the LNMIIT station as the default
          // In production, this would call the backend API
          const lnmiitStation: MultiplayerStation = {
            ...LNMIIT_MULTIPLAYER_STATION,
            currentPlayers: [],
            status: "waiting" as StationStatus,
          };

          // Check if user is close enough to LNMIIT (within 5km for testing)
          const distance = calculateDistance(
            latitude,
            longitude,
            LNMIIT_MULTIPLAYER_STATION.latitude,
            LNMIIT_MULTIPLAYER_STATION.longitude,
          );

          // Show station if within 50km (for testing) or always show for demo
          if (distance <= 50000) {
            set({ nearbyStations: [lnmiitStation], isLoading: false });
          } else {
            // Still show for demo purposes
            set({ nearbyStations: [lnmiitStation], isLoading: false });
          }
        } catch (error) {
          console.error("Failed to fetch stations:", error);
          set({
            error: "Failed to fetch nearby stations",
            isLoading: false,
          });
        }
      },

      joinStation: async (stationId: string) => {
        const { nearbyStations } = get();
        const station = nearbyStations.find((s) => s.id === stationId);

        if (!station) {
          set({ error: "Station not found" });
          return false;
        }

        const userStore = useUserStore.getState();

        // Check if user has enough AP tokens
        if (userStore.apBalance < station.stakeAmount) {
          set({
            error: `Insufficient AP tokens. Need ${station.stakeAmount} AP to join.`,
          });
          return false;
        }

        set({ isLoading: true, error: null });

        try {
          // Deduct AP optimistically
          userStore.deductAP(station.stakeAmount);

          // Add user to station players
          const newPlayer: MultiplayerPlayer = {
            address: userStore.walletAddress || "unknown",
            displayName: `Player ${station.currentPlayers.length + 1}`,
            stakedAmount: station.stakeAmount,
            hasSubmitted: false,
            isReady: true,
            joinedAt: new Date().toISOString(),
          };

          const updatedStation: MultiplayerStation = {
            ...station,
            currentPlayers: [...station.currentPlayers, newPlayer],
          };

          set({
            currentStation: updatedStation,
            isInLobby: true,
            isLoading: false,
          });

          // TODO: Call backend API to join station
          // TODO: Call smart contract to stake AP

          console.log("✅ Joined multiplayer station:", stationId);
          return true;
        } catch (error) {
          // Refund AP on failure
          userStore.addAP(station.stakeAmount);
          console.error("Failed to join station:", error);
          set({
            error: "Failed to join station",
            isLoading: false,
          });
          return false;
        }
      },

      leaveStation: async () => {
        const { currentStation } = get();

        if (!currentStation) {
          return false;
        }

        set({ isLoading: true, error: null });

        try {
          const userStore = useUserStore.getState();
          const userAddress = userStore.walletAddress;

          // Find user's stake
          const userPlayer = currentStation.currentPlayers.find(
            (p) => p.address === userAddress,
          );

          if (userPlayer) {
            // Refund AP
            userStore.addAP(userPlayer.stakedAmount);
          }

          set({
            currentStation: null,
            currentSession: null,
            isInLobby: false,
            isInMultiplayerGame: false,
            isLoading: false,
          });

          // TODO: Call backend API to leave station
          // TODO: Call smart contract to refund stake

          console.log("✅ Left multiplayer station");
          return true;
        } catch (error) {
          console.error("Failed to leave station:", error);
          set({
            error: "Failed to leave station",
            isLoading: false,
          });
          return false;
        }
      },

      updateStationStatus: (
        stationId: string,
        status: StationStatus,
        players?: MultiplayerPlayer[],
      ) => {
        const { currentStation, nearbyStations } = get();

        // Update current station if it matches
        if (currentStation?.id === stationId) {
          set({
            currentStation: {
              ...currentStation,
              status,
              currentPlayers: players || currentStation.currentPlayers,
            },
            isInMultiplayerGame: status === "in_progress",
            isInLobby: status === "waiting" || status === "starting",
          });
        }

        // Update in nearby stations list
        set({
          nearbyStations: nearbyStations.map((s) =>
            s.id === stationId
              ? { ...s, status, currentPlayers: players || s.currentPlayers }
              : s,
          ),
        });
      },

      setSelectedGame: (stationId: string, gameType: GameType) => {
        const { currentStation } = get();

        if (currentStation?.id === stationId) {
          const session: MultiplayerSession = {
            stationId,
            gameType,
            players: currentStation.currentPlayers,
            totalPool: currentStation.currentPlayers.reduce(
              (sum, p) => sum + p.stakedAmount,
              0,
            ),
            startedAt: new Date().toISOString(),
          };

          set({
            currentStation: { ...currentStation, selectedGame: gameType },
            currentSession: session,
            isInMultiplayerGame: true,
            isInLobby: false,
          });
        }
      },

      submitGameResult: async (result: MultiplayerGameResult) => {
        const { currentSession } = get();

        if (!currentSession) {
          console.error("No active session");
          return false;
        }

        try {
          // Update player's score in session
          const updatedPlayers = currentSession.players.map((p) =>
            p.address === result.playerId
              ? { ...p, score: result.score, hasSubmitted: true }
              : p,
          );

          set({
            currentSession: {
              ...currentSession,
              players: updatedPlayers,
            },
          });

          // TODO: Call backend API to submit score with signature

          console.log("✅ Submitted game result:", result);
          return true;
        } catch (error) {
          console.error("Failed to submit result:", error);
          return false;
        }
      },

      handleGameComplete: (winnerId: string, prize: number) => {
        const { currentSession } = get();

        if (!currentSession) return;

        const userStore = useUserStore.getState();
        const isWinner = userStore.walletAddress === winnerId;

        // Add prize to winner's balance
        if (isWinner) {
          userStore.addAP(prize);
        }

        // Save to history
        const completedSession: MultiplayerSession = {
          ...currentSession,
          completedAt: new Date().toISOString(),
          winnerId,
          winnerPrize: prize,
        };

        set((state) => ({
          currentSession: completedSession,
          multiplayerHistory: [
            completedSession,
            ...state.multiplayerHistory,
          ].slice(0, 50),
          isInMultiplayerGame: false,
        }));
      },

      clearCurrentStation: () => {
        set({
          currentStation: null,
          currentSession: null,
          isInLobby: false,
          isInMultiplayerGame: false,
          error: null,
        });
      },

      setError: (error: string | null) => {
        set({ error });
      },
    }),
    {
      name: "multiplayer-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        multiplayerHistory: state.multiplayerHistory,
      }),
    },
  ),
);

// Helper function to calculate distance between two coordinates
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}
