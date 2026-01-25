import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useGameCredits } from "@/hooks/useGameCredits";
import { useWallet } from "@/hooks/useWallet";

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || "http://172.22.67.186:3001";

interface PlayerProfile {
  wallet_address: string;
  display_name: string | null;
  total_points: number;
  total_games_played: number;
  total_wins: number;
  credits: number;
  last_active: string;
  created_at: string;
}

interface GameSession {
  id: string;
  game_type: string;
  difficulty: string;
  score: number;
  points_earned: number;
  created_at: string;
}

export default function ProfileScreen() {
  const { isConnected, connect, disconnect, address } = useWallet();
  const { fetchBalance } = useGameCredits();
  
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [recentGames, setRecentGames] = useState<GameSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [globalRank, setGlobalRank] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Auto-refresh every 10 seconds when screen is active
  useEffect(() => {
    if (isConnected && address) {
      loadProfile();
      
      const interval = setInterval(() => {
        loadProfile(false); // Silent refresh
      }, 10000); // Refresh every 10 seconds

      return () => clearInterval(interval);
    }
  }, [isConnected, address]);

  // Refresh when screen comes into focus (e.g., after playing a game)
  useFocusEffect(
    React.useCallback(() => {
      if (isConnected && address) {
        console.log("📱 Profile screen focused - refreshing data");
        loadProfile(false);
      }
    }, [isConnected, address])
  );

  const loadProfile = async (showLoading = true) => {
    if (!address) return;
    
    try {
      if (showLoading) setLoading(true);

      // Fetch player profile from Supabase via backend
      const profileRes = await fetch(`${BACKEND_URL}/api/player/${address}`);
      const profileData = await profileRes.json();
      
      if (profileData.success) {
        setProfile(profileData.player);
        setDisplayName(profileData.player.display_name || "");
        console.log("📊 Profile updated:", profileData.player);
      } else {
        // Player doesn't exist yet in Supabase, create default
        console.log("⚠️ Player not found in database yet");
      }

      // Fetch recent games from Supabase
      const sessionsRes = await fetch(`${BACKEND_URL}/api/player/${address}/sessions?limit=10`);
      const sessionsData = await sessionsRes.json();
      
      if (sessionsData.success) {
        setRecentGames(sessionsData.sessions);
        console.log("🎮 Recent games updated:", sessionsData.sessions.length);
      }

      // Fetch global rank from leaderboard
      const leaderboardRes = await fetch(`${BACKEND_URL}/api/leaderboard/global`);
      const leaderboardData = await leaderboardRes.json();
      
      if (leaderboardData.success) {
        const rank = leaderboardData.leaderboard.findIndex(
          (entry: any) => entry.wallet_address.toLowerCase() === address.toLowerCase()
        );
        setGlobalRank(rank >= 0 ? rank + 1 : null);
        console.log("🏆 Global rank:", rank >= 0 ? rank + 1 : "Not ranked");
      }

      // Refresh credits/points from backend
      await fetchBalance();
      
      // Update last updated timestamp
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      if (showLoading) setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProfile(false);
  };

  const handleSaveDisplayName = async () => {
    if (!address || !displayName.trim()) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/player/update-name`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, displayName: displayName.trim() }),
      });

      if (response.ok) {
        Alert.alert("Success", "Display name updated!");
        setEditingName(false);
        loadProfile();
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update display name");
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 10) return "just now";
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const getWinRate = () => {
    if (!profile || profile.total_games_played === 0) return 0;
    return Math.round((profile.total_wins / profile.total_games_played) * 100);
  };

  if (!isConnected) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <StatusBar style="light" />
        <View style={styles.centerContainer}>
          <View style={styles.connectCard}>
            <View style={styles.iconContainer}>
              <Text style={styles.iconEmoji}>👤</Text>
            </View>
            <Text style={styles.connectTitle}>View Your Profile</Text>
            <Text style={styles.connectText}>
              Connect your wallet to view your stats, achievements, and game history.
            </Text>
            <TouchableOpacity style={styles.connectButton} onPress={connect}>
              <Text style={styles.connectButtonText}>🔓 Connect Wallet</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar style="light" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6C5CE7" />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.titleEmoji}>👤</Text>
            <View>
              <Text style={styles.pageTitle}>Profile</Text>
              {lastUpdated && (
                <Text style={styles.lastUpdated}>
                  Updated {formatTimeAgo(lastUpdated)}
                </Text>
              )}
            </View>
          </View>
          <TouchableOpacity style={styles.disconnectBadge} onPress={disconnect}>
            <Ionicons name="log-out-outline" size={20} color="#FF4444" />
          </TouchableOpacity>
        </View>

        {loading && !profile ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6C5CE7" />
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        ) : (
          <>
            {/* Profile Card */}
            <LinearGradient
              colors={["rgba(108, 92, 231, 0.25)", "rgba(108, 92, 231, 0.08)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.profileCard}
            >
              <View style={styles.avatarContainer}>
                <LinearGradient
                  colors={["#6C5CE7", "#a29bfe"]}
                  style={styles.avatar}
                >
                  <Text style={styles.avatarText}>
                    {displayName ? displayName[0].toUpperCase() : address ? address[2].toUpperCase() : "?"}
                  </Text>
                </LinearGradient>
                {globalRank && (
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankText}>#{globalRank}</Text>
                  </View>
                )}
              </View>

              {editingName ? (
                <View style={styles.nameEditContainer}>
                  <TextInput
                    style={styles.nameInput}
                    value={displayName}
                    onChangeText={setDisplayName}
                    placeholder="Enter display name"
                    placeholderTextColor="#888"
                    maxLength={20}
                  />
                  <View style={styles.nameEditButtons}>
                    <TouchableOpacity style={styles.nameEditButton} onPress={handleSaveDisplayName}>
                      <Ionicons name="checkmark" size={20} color="#06FFA5" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.nameEditButton} onPress={() => setEditingName(false)}>
                      <Ionicons name="close" size={20} color="#FF6B9D" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.nameContainer}>
                  <Text style={styles.displayName}>
                    {displayName || formatAddress(address || "")}
                  </Text>
                  <TouchableOpacity onPress={() => setEditingName(true)}>
                    <Ionicons name="pencil" size={16} color="#6C5CE7" />
                  </TouchableOpacity>
                </View>
              )}

              <Text style={styles.walletAddress}>{formatAddress(address || "")}</Text>

              {profile && (
                <Text style={styles.memberSince}>
                  Member since {formatDate(profile.created_at)}
                </Text>
              )}
            </LinearGradient>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <LinearGradient
                  colors={["rgba(6, 255, 165, 0.2)", "rgba(6, 255, 165, 0.05)"]}
                  style={styles.statGradient}
                >
                  <Text style={styles.statValue}>{profile?.total_points || 0}</Text>
                  <Text style={styles.statLabel}>Points</Text>
                </LinearGradient>
              </View>

              <View style={styles.statCard}>
                <LinearGradient
                  colors={["rgba(108, 92, 231, 0.2)", "rgba(108, 92, 231, 0.05)"]}
                  style={styles.statGradient}
                >
                  <Text style={styles.statValue}>{profile?.credits || 0}</Text>
                  <Text style={styles.statLabel}>Credits</Text>
                </LinearGradient>
              </View>

              <View style={styles.statCard}>
                <LinearGradient
                  colors={["rgba(255, 215, 0, 0.2)", "rgba(255, 215, 0, 0.05)"]}
                  style={styles.statGradient}
                >
                  <Text style={styles.statValue}>{profile?.total_games_played || 0}</Text>
                  <Text style={styles.statLabel}>Games</Text>
                </LinearGradient>
              </View>

              <View style={styles.statCard}>
                <LinearGradient
                  colors={["rgba(255, 107, 157, 0.2)", "rgba(255, 107, 157, 0.05)"]}
                  style={styles.statGradient}
                >
                  <Text style={styles.statValue}>{getWinRate()}%</Text>
                  <Text style={styles.statLabel}>Win Rate</Text>
                </LinearGradient>
              </View>
            </View>

            {/* Recent Games */}
            <Text style={styles.sectionTitle}>RECENT GAMES</Text>
            {recentGames.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyEmoji}>🎮</Text>
                <Text style={styles.emptyText}>No games played yet</Text>
                <Text style={styles.emptySubtext}>Start playing to see your history here!</Text>
              </View>
            ) : (
              <View style={styles.gamesList}>
                {recentGames.map((game) => (
                  <View key={game.id} style={styles.gameCard}>
                    <View style={styles.gameIcon}>
                      <Text style={styles.gameEmoji}>
                        {game.score > 70 ? "🏆" : game.score > 40 ? "⭐" : "🎯"}
                      </Text>
                    </View>
                    <View style={styles.gameInfo}>
                      <Text style={styles.gameName}>
                        {game.game_type.replace(/_/g, " ")}
                      </Text>
                      <Text style={styles.gameDetails}>
                        {game.difficulty} • {formatDate(game.created_at)}
                      </Text>
                    </View>
                    <View style={styles.gameStats}>
                      <Text style={styles.gameScore}>{game.score}</Text>
                      <Text style={styles.gamePoints}>+{game.points_earned} pts</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 140,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  connectCard: {
    padding: 40,
    width: "100%",
    alignItems: "center",
    borderRadius: 32,
    borderWidth: 2,
    borderColor: "rgba(108, 92, 231, 0.4)",
    backgroundColor: "rgba(108, 92, 231, 0.15)",
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(108, 92, 231, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "rgba(108, 92, 231, 0.3)",
  },
  iconEmoji: {
    fontSize: 48,
  },
  connectTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#fff",
    marginBottom: 12,
    textAlign: "center",
  },
  connectText: {
    fontSize: 16,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  connectButton: {
    backgroundColor: "#6C5CE7",
    paddingHorizontal: 32,
    paddingVertical: 18,
    borderRadius: 16,
    width: "100%",
    alignItems: "center",
    shadowColor: "#6C5CE7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  connectButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  titleEmoji: {
    fontSize: 32,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.5,
  },
  lastUpdated: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.4)",
    marginTop: 2,
  },
  disconnectBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 68, 68, 0.15)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 68, 68, 0.4)",
  },
  loadingContainer: {
    padding: 60,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.5)",
  },
  profileCard: {
    padding: 32,
    borderRadius: 32,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: "rgba(108, 92, 231, 0.3)",
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  avatarText: {
    fontSize: 40,
    fontWeight: "900",
    color: "#FFF",
  },
  rankBadge: {
    position: "absolute",
    bottom: 0,
    right: -5,
    backgroundColor: "#FFD700",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#000",
  },
  rankText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#000",
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  displayName: {
    fontSize: 24,
    fontWeight: "900",
    color: "#FFF",
  },
  nameEditContainer: {
    width: "100%",
    marginBottom: 12,
  },
  nameInput: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 12,
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  nameEditButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  nameEditButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  walletAddress: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    fontFamily: "monospace",
    marginBottom: 8,
  },
  memberSince: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.4)",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    width: "48%",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  statGradient: {
    padding: 20,
    alignItems: "center",
  },
  statValue: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFF",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.6)",
    textTransform: "uppercase",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "rgba(255, 255, 255, 0.5)",
    marginBottom: 16,
    letterSpacing: 1.5,
  },
  emptyCard: {
    padding: 40,
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: "rgba(30, 30, 50, 0.5)",
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.6)",
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.4)",
  },
  gamesList: {
    gap: 12,
  },
  gameCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: "rgba(30, 30, 50, 0.5)",
  },
  gameIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(108, 92, 231, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  gameEmoji: {
    fontSize: 24,
  },
  gameInfo: {
    flex: 1,
  },
  gameName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
    marginBottom: 4,
    textTransform: "capitalize",
  },
  gameDetails: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.5)",
    textTransform: "capitalize",
  },
  gameStats: {
    alignItems: "flex-end",
  },
  gameScore: {
    fontSize: 20,
    fontWeight: "900",
    color: "#6C5CE7",
    marginBottom: 2,
  },
  gamePoints: {
    fontSize: 11,
    fontWeight: "600",
    color: "#06FFA5",
  },
});
