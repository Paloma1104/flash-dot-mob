import { useWallet } from "@/hooks/useWallet";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || "http://172.22.67.186:3001";

interface LeaderboardEntry {
  wallet_address: string;
  display_name: string | null;
  total_points: number;
  total_games_played: number;
  total_wins: number;
  distance_meters?: number;
  rank: number;
}

type LeaderboardMode = "global" | "nearby";

export function LeaderboardScreen() {
  const { address } = useWallet();
  const [mode, setMode] = useState<LeaderboardMode>("nearby");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [radius, setRadius] = useState(5000); // 5km default

  useEffect(() => {
    loadLocation();
  }, []);

  useEffect(() => {
    if (mode === "nearby" && location) {
      fetchLeaderboard();
      
      // Auto-refresh every 15 seconds
      const interval = setInterval(() => {
        fetchLeaderboard(false);
      }, 15000);
      
      return () => clearInterval(interval);
    } else if (mode === "global") {
      fetchLeaderboard();
      
      // Auto-refresh every 15 seconds
      const interval = setInterval(() => {
        fetchLeaderboard(false);
      }, 15000);
      
      return () => clearInterval(interval);
    }
  }, [mode, location, radius]);

  const loadLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Location permission denied");
        setMode("global");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    } catch (error) {
      console.error("Error getting location:", error);
      setMode("global");
    }
  };

  const fetchLeaderboard = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      let url = `${BACKEND_URL}/api/leaderboard/global`;

      if (mode === "nearby" && location) {
        url = `${BACKEND_URL}/api/leaderboard/nearby?lat=${location.latitude}&lon=${location.longitude}&radius=${radius}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setLeaderboard(data.leaderboard);
        console.log(`🏆 Leaderboard updated: ${data.leaderboard.length} players`);
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      if (showLoading) setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeaderboard();
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatDistance = (meters?: number) => {
    if (!meters) return "";
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return "#FFD700"; // Gold
    if (rank === 2) return "#C0C0C0"; // Silver
    if (rank === 3) return "#CD7F32"; // Bronze
    return "#6C5CE7";
  };

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🏆 Leaderboard</Text>
        <View style={styles.modeSelector}>
          <TouchableOpacity
            style={[styles.modeButton, mode === "nearby" && styles.modeButtonActive]}
            onPress={() => setMode("nearby")}
            disabled={!location}
          >
            <Text style={[styles.modeText, mode === "nearby" && styles.modeTextActive]}>
              📍 Nearby
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, mode === "global" && styles.modeButtonActive]}
            onPress={() => setMode("global")}
          >
            <Text style={[styles.modeText, mode === "global" && styles.modeTextActive]}>
              🌍 Global
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Radius selector for nearby mode */}
      {mode === "nearby" && location && (
        <View style={styles.radiusSelector}>
          {[1000, 5000, 10000, 50000].map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.radiusButton, radius === r && styles.radiusButtonActive]}
              onPress={() => setRadius(r)}
            >
              <Text style={[styles.radiusText, radius === r && styles.radiusTextActive]}>
                {r >= 1000 ? `${r / 1000}km` : `${r}m`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Leaderboard List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6C5CE7" />}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6C5CE7" />
            <Text style={styles.loadingText}>Loading leaderboard...</Text>
          </View>
        ) : leaderboard.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🎮</Text>
            <Text style={styles.emptyTitle}>No Players Yet</Text>
            <Text style={styles.emptyText}>
              {mode === "nearby"
                ? "No players found in your area. Try increasing the radius or switch to global."
                : "Be the first to play and earn points!"}
            </Text>
          </View>
        ) : (
          leaderboard.map((entry, index) => {
            const isCurrentUser = address && entry.wallet_address.toLowerCase() === address.toLowerCase();
            const rankColor = getRankColor(entry.rank);

            return (
              <View key={entry.wallet_address} style={[styles.entryCard, isCurrentUser && styles.entryCardHighlight]}>
                <LinearGradient
                  colors={
                    isCurrentUser
                      ? ["rgba(108, 92, 231, 0.2)", "rgba(108, 92, 231, 0.05)"]
                      : ["rgba(255, 255, 255, 0.05)", "rgba(255, 255, 255, 0.02)"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.entryGradient}
                >
                  {/* Rank */}
                  <View style={[styles.rankBadge, { backgroundColor: rankColor + "20" }]}>
                    <Text style={[styles.rankText, { color: rankColor }]}>
                      {getRankEmoji(entry.rank)}
                    </Text>
                  </View>

                  {/* Player Info */}
                  <View style={styles.playerInfo}>
                    <View style={styles.playerHeader}>
                      <Text style={styles.playerName}>
                        {entry.display_name || formatAddress(entry.wallet_address)}
                      </Text>
                      {isCurrentUser && <Text style={styles.youBadge}>YOU</Text>}
                    </View>
                    <Text style={styles.playerAddress}>{formatAddress(entry.wallet_address)}</Text>
                    <View style={styles.playerStats}>
                      <Text style={styles.statText}>
                        🎮 {entry.total_games_played} games
                      </Text>
                      <Text style={styles.statText}>
                        🏆 {entry.total_wins} wins
                      </Text>
                      {entry.distance_meters !== undefined && (
                        <Text style={styles.statText}>
                          📍 {formatDistance(entry.distance_meters)} away
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Points */}
                  <View style={styles.pointsContainer}>
                    <Text style={styles.pointsValue}>{entry.total_points}</Text>
                    <Text style={styles.pointsLabel}>POINTS</Text>
                  </View>
                </LinearGradient>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFF",
    marginBottom: 16,
  },
  modeSelector: {
    flexDirection: "row",
    gap: 12,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  modeButtonActive: {
    backgroundColor: "rgba(108, 92, 231, 0.2)",
    borderColor: "#6C5CE7",
  },
  modeText: {
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.5)",
    textAlign: "center",
  },
  modeTextActive: {
    color: "#6C5CE7",
  },
  radiusSelector: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
  },
  radiusButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  radiusButtonActive: {
    backgroundColor: "rgba(108, 92, 231, 0.15)",
    borderColor: "#6C5CE7",
  },
  radiusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.5)",
    textAlign: "center",
  },
  radiusTextActive: {
    color: "#6C5CE7",
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 20,
    paddingTop: 0,
    paddingBottom: 100,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.5)",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFF",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.5)",
    textAlign: "center",
    lineHeight: 20,
  },
  entryCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  entryCardHighlight: {
    borderColor: "#6C5CE7",
    borderWidth: 2,
  },
  entryGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  rankBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  rankText: {
    fontSize: 18,
    fontWeight: "900",
  },
  playerInfo: {
    flex: 1,
  },
  playerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  playerName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
  youBadge: {
    fontSize: 10,
    fontWeight: "800",
    color: "#6C5CE7",
    backgroundColor: "rgba(108, 92, 231, 0.2)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  playerAddress: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.5)",
    fontFamily: "monospace",
    marginBottom: 8,
  },
  playerStats: {
    flexDirection: "row",
    gap: 12,
  },
  statText: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.6)",
  },
  pointsContainer: {
    alignItems: "flex-end",
  },
  pointsValue: {
    fontSize: 24,
    fontWeight: "900",
    color: "#06FFA5",
  },
  pointsLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.5)",
    marginTop: 2,
  },
});
