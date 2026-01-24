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

// Backend API URL - no demo data
const API_BASE = process.env.EXPO_PUBLIC_BACKEND_URL || "http://localhost:3001";

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
          // Call live backend API
          const response = await fetch(
            `${API_BASE}/api/stations/nearby?lat=${latitude}&lon=${longitude}`,
          );

          if (!response.ok) {
            throw new Error("Failed to fetch stations");
          }

          const data = await response.json();

          if (data.success && data.stations) {
            // Map API response to MultiplayerStation type
            const stations: MultiplayerStation[] = data.stations.map(
              (s: any) => ({
                id: s.id,
                name: s.name,
                latitude: s.latitude,
                longitude: s.longitude,
                stakeAmount: s.stakeAmount,
                minPlayers: s.minPlayers,
                maxPlayers: s.maxPlayers,
                currentPlayers: s.currentPlayers.map((p: any) => ({
                  address: p.address,
                  displayName: p.displayName,
                  stakedAmount: s.stakeAmount,
                  hasSubmitted: false,
                  isReady: true,
                  joinedAt: new Date(p.joinedAt).toISOString(),
                })),
                status: s.status as StationStatus,
              }),
            );

            set({ nearbyStations: stations, isLoading: false });
          } else {
            // Fallback to LNMIIT station if API fails
            set({
              nearbyStations: [
                {
                  ...LNMIIT_MULTIPLAYER_STATION,
                  currentPlayers: [],
                  status: "waiting" as StationStatus,
                },
              ],
              isLoading: false,
            });
          }
        } catch (error) {
          console.error("Failed to fetch stations:", error);
          // Fallback on error
          set({
            nearbyStations: [
              {
                ...LNMIIT_MULTIPLAYER_STATION,
                currentPlayers: [],
                status: "waiting" as StationStatus,
              },
            ],
            error: "Using offline mode",
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
          // Call live backend API to join station
          const response = await fetch(`${API_BASE}/api/station/join`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              stationId,
              player: userStore.walletAddress,
              displayName: `Player ${station.currentPlayers.length + 1}`,
            }),
          });

          const data = await response.json();

          if (!response.ok || !data.success) {
            throw new Error(data.error || "Failed to join station");
          }

          // Deduct AP only after successful API call
          userStore.deductAP(station.stakeAmount);

          // Update station with live players from API
          const updatedPlayers: MultiplayerPlayer[] = data.players.map(
            (p: any) => ({
              address: p.address,
              displayName: p.displayName,
              stakedAmount: station.stakeAmount,
              hasSubmitted: false,
              isReady: true,
              joinedAt: new Date(p.joinedAt).toISOString(),
            }),
          );

          const updatedStation: MultiplayerStation = {
            ...station,
            currentPlayers: updatedPlayers,
          };

          set({
            currentStation: updatedStation,
            isInLobby: true,
            isLoading: false,
          });

          console.log("✅ Joined multiplayer station:", stationId);
          return true;
        } catch (error) {
          console.error("Failed to join station:", error);
          set({
            error:
              error instanceof Error ? error.message : "Failed to join station",
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

          // Call live backend API to leave station
          const response = await fetch(`${API_BASE}/api/station/leave`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              stationId: currentStation.id,
              player: userAddress,
            }),
          });

          const data = await response.json();

          if (response.ok && data.success) {
            // Refund AP after successful leave
            userStore.addAP(data.refundAmount || currentStation.stakeAmount);
          }

          set({
            currentStation: null,
            currentSession: null,
            isInLobby: false,
            isInMultiplayerGame: false,
            isLoading: false,
          });

          console.log("✅ Left multiplayer station");
          return true;
        } catch (error) {
          console.error("Failed to leave station:", error);
          // Still allow local leave on network error
          const userStore = useUserStore.getState();
          userStore.addAP(currentStation.stakeAmount);
          set({
            currentStation: null,
            currentSession: null,
            isInLobby: false,
            isInMultiplayerGame: false,
            isLoading: false,
          });
          return true;
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
        const { currentSession, currentStation } = get();

        if (!currentSession || !currentStation) {
          console.error("No active session");
          return false;
        }

        try {
          // Call live backend API to submit score
          const response = await fetch(`${API_BASE}/api/station/complete`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              stationId: currentStation.id,
              player: result.playerId,
              score: result.score,
              timeSpent: result.timeSpent,
            }),
          });

          const data = await response.json();

          if (!response.ok || !data.success) {
            throw new Error(data.error || "Failed to submit score");
          }

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

          console.log(
            "✅ Submitted game result:",
            result,
            "signature:",
            data.signature,
          );
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
