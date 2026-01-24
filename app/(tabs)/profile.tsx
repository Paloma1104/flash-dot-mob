import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { useWallet } from '@/src/hooks/useWallet';
import { LeaderboardEntry } from '@/src/services/api/endpoints';
import { useUserStore } from '@/src/stores/userStore';
import { useGameStore } from '@/src/stores/gameStore';
import { generateSimulatedLeaderboard } from '@/src/utils/leaderboardSimulation';
import { GAME_CONFIGS, GameType } from '@/src/types/game';

export default function LeaderboardScreen() {
  const { address, isConnected } = useWallet();
  const { balance, stats } = useUserStore();
  const { gameStats, recentSessions } = useGameStore();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRankEntry, setUserRankEntry] = useState<LeaderboardEntry | null>(null);
  const [activeTab, setActiveTab] = useState<'stats' | 'games' | 'leaderboard'>('stats');

  useEffect(() => {
    // Generate simulation based on real user balance
    const data = generateSimulatedLeaderboard(address, balance);
    setLeaderboard(data);
    
    // Find user
    if (address) {
      const entry = data.find(e => e.address === address);
      setUserRankEntry(entry || null);
    }
  }, [address, balance]);

  const topThree = leaderboard.slice(0, 3);
  const restList = leaderboard.slice(3);

  const renderItem = ({ item }: { item: LeaderboardEntry }) => {
    const isUser = address && item.address === address;

    return (
      <View style={[styles.row, isUser && styles.rowHighlight]}>
        <View style={styles.rowLeft}>
          <View style={[styles.rankBadgeSmall, item.rank <= 10 && styles.rankBadgeTop10]}>
            <Text style={[styles.rankText, item.rank <= 10 && styles.rankTextTop10]}>
              {item.rank}
            </Text>
          </View>
          
          <View style={styles.playerAvatar}>
            <IconSymbol name="person.fill" size={20} color={isUser ? '#836EF9' : '#fff'} />
          </View>
          
          <View style={styles.playerInfo}>
            <Text style={[styles.username, isUser && styles.usernameHighlight]} numberOfLines={1}>
              {item.username || item.address}
            </Text>
            <Text style={styles.addressSub}>
              {item.address.slice(0, 6)}...{item.address.slice(-4)}
            </Text>
          </View>
        </View>
        
        <View style={styles.rowRight}>
          <Text style={[styles.earned, isUser && styles.earnedHighlight]}>
            {item.totalEarned.toLocaleString()}
          </Text>
          <Text style={styles.earnedLabel}>$MON</Text>
        </View>
      </View>
    );
  };

  const TopPlayer = ({ entry, position }: { entry: LeaderboardEntry; position: number }) => {
    const isUser = address && entry.address === address;
    const height = position === 1 ? 140 : position === 2 ? 120 : 100;
    
    return (
      <View style={[styles.topPlayerContainer, { marginTop: position === 1 ? 0 : 20 }]}>
        <View style={[styles.topPlayerCard, position === 1 && styles.topPlayerCardFirst]}>
          {/* Crown for 1st place */}
          {position === 1 && (
            <View style={styles.crownContainer}>
              <Text style={styles.crownEmoji}>👑</Text>
            </View>
          )}
          
          {/* Avatar */}
          <View style={[styles.podiumAvatar, position === 1 && styles.podiumAvatarFirst]}>
            <LinearGradient
              colors={position === 1 ? ['#FFD700', '#FFA500'] : ['#836EF9', '#00D9FF']}
              style={styles.podiumAvatarGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <IconSymbol name="person.fill" size={position === 1 ? 32 : 24} color="#fff" />
            </LinearGradient>
          </View>
          
          {/* Medal */}
          <View style={styles.medalBadge}>
            <Text style={styles.medalEmoji}>
              {position === 1 ? '🥇' : position === 2 ? '🥈' : '🥉'}
            </Text>
          </View>
          
          {/* Username */}
          <Text style={styles.topUsername} numberOfLines={1}>
            {entry.username || entry.address.slice(0, 8)}
          </Text>
          
          {/* Score */}
          <Text style={[styles.topScore, position === 1 && styles.topScoreFirst]}>
            {entry.totalEarned.toLocaleString()}
          </Text>
          <Text style={styles.topScoreLabel}>$MON</Text>
          
          {isUser && (
            <View style={styles.youBadge}>
              <Text style={styles.youBadgeText}>YOU</Text>
            </View>
          )}
        </View>
        
        {/* Podium Base */}
        <View style={[styles.podiumBase, { height }]}>
          <LinearGradient
            colors={
              position === 1 
                ? ['#836EF9', '#6B5DD6'] 
                : position === 2
                ? ['rgba(131, 110, 249, 0.6)', 'rgba(131, 110, 249, 0.3)']
                : ['rgba(131, 110, 249, 0.4)', 'rgba(131, 110, 249, 0.2)']
            }
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.podiumRank}>#{entry.rank}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#0D0D0F', '#13131F', '#09090B']}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Cyber Grid Background */}
      <View style={styles.gridOverlay} />
      
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Modern Header with Tab Switcher */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.title}>⚡ PROFILE</Text>
              <Text style={styles.subtitle}>POWERED BY MONAD</Text>
            </View>
            {userRankEntry && (
              <View style={styles.rankBadge}>
                <Text style={styles.rankBadgeText}>#{userRankEntry.rank}</Text>
              </View>
            )}
          </View>
          
          {/* Tab Switcher */}
          <View style={styles.tabContainer}>
            <Pressable 
              style={[styles.tab, activeTab === 'stats' && styles.tabActive]}
              onPress={() => setActiveTab('stats')}
            >
              <Text style={[styles.tabText, activeTab === 'stats' && styles.tabTextActive]}>
                STATS
              </Text>
              {activeTab === 'stats' && <View style={styles.tabIndicator} />}
            </Pressable>
            
            <Pressable 
              style={[styles.tab, activeTab === 'games' && styles.tabActive]}
              onPress={() => setActiveTab('games')}
            >
              <Text style={[styles.tabText, activeTab === 'games' && styles.tabTextActive]}>
                GAMES
              </Text>
              {activeTab === 'games' && <View style={styles.tabIndicator} />}
            </Pressable>
            
            <Pressable 
              style={[styles.tab, activeTab === 'leaderboard' && styles.tabActive]}
              onPress={() => setActiveTab('leaderboard')}
            >
              <Text style={[styles.tabText, activeTab === 'leaderboard' && styles.tabTextActive]}>
                LEADERBOARD
              </Text>
              {activeTab === 'leaderboard' && <View style={styles.tabIndicator} />}
            </Pressable>
          </View>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'stats' && isConnected ? (
            <View style={styles.statsTab}>
              {/* Hero Profile Card */}
              <View style={styles.heroCard}>
                <LinearGradient
                  colors={['rgba(131, 110, 249, 0.2)', 'rgba(0, 217, 255, 0.1)']}
                  style={styles.heroGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.avatarRing}>
                    <LinearGradient
                      colors={['#836EF9', '#00D9FF']}
                      style={styles.avatarGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <IconSymbol name="person.fill" size={48} color="#fff" />
                    </LinearGradient>
                  </View>
                  
                  <Text style={styles.heroAddress}>
                    {address?.slice(0, 8)}...{address?.slice(-6)}
                  </Text>
                  
                  <View style={styles.heroBadgeRow}>
                    <View style={styles.heroBadge}>
                      <Text style={styles.heroBadgeText}>⚡ PIONEER</Text>
                    </View>
                  </View>
                  
                  {/* Main Balance Display */}
                  <View style={styles.balanceDisplay}>
                    <Text style={styles.balanceLabel}>TOTAL EARNED</Text>
                    <View style={styles.balanceRow}>
                      <Text style={styles.balanceAmount}>{balance.toLocaleString()}</Text>
                      <Text style={styles.balanceCurrency}>$MON</Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>

              {/* Quick Stats Row */}
              <View style={styles.quickStatsRow}>
                <View style={styles.quickStat}>
                  <View style={styles.quickStatIcon}>
                    <Text style={{ fontSize: 24 }}>💰</Text>
                  </View>
                  <Text style={styles.quickStatValue}>{stats.totalClaims}</Text>
                  <Text style={styles.quickStatLabel}>CLAIMS</Text>
                </View>
                
                <View style={styles.quickStat}>
                  <View style={styles.quickStatIcon}>
                    <Text style={{ fontSize: 24 }}>🏆</Text>
                  </View>
                  <Text style={styles.quickStatValue}>{stats.bestDrop}</Text>
                  <Text style={styles.quickStatLabel}>BEST DROP</Text>
                </View>
                
                <View style={styles.quickStat}>
                  <View style={styles.quickStatIcon}>
                    <Text style={{ fontSize: 24 }}>📊</Text>
                  </View>
                  <Text style={styles.quickStatValue}>{Math.round(stats.avgValue)}</Text>
                  <Text style={styles.quickStatLabel}>AVG VALUE</Text>
                </View>
              </View>

              {/* Achievements Section */}
              <View style={styles.achievementsSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>🏅 ACHIEVEMENTS</Text>
                  <Text style={styles.sectionCount}>
                    {[
                      stats.totalClaims >= 1,
                      stats.totalClaims >= 10,
                      balance >= 1000,
                      stats.bestDrop >= 500
                    ].filter(Boolean).length}/4
                  </Text>
                </View>
                
                <View style={styles.achievementsList}>
                  <View style={[styles.achievementItem, stats.totalClaims >= 1 && styles.achievementUnlocked]}>
                    <View style={styles.achievementIconContainer}>
                      <Text style={styles.achievementEmoji}>{stats.totalClaims >= 1 ? '🎉' : '🔒'}</Text>
                    </View>
                    <View style={styles.achievementInfo}>
                      <Text style={[styles.achievementTitle, stats.totalClaims >= 1 && styles.achievementTitleUnlocked]}>
                        First Drop
                      </Text>
                      <Text style={styles.achievementDesc}>Claim your first $MON drop</Text>
                    </View>
                    {stats.totalClaims >= 1 && (
                      <View style={styles.achievementCheck}>
                        <IconSymbol name="checkmark.circle.fill" size={24} color="#00D9FF" />
                      </View>
                    )}
                  </View>
                  
                  <View style={[styles.achievementItem, stats.totalClaims >= 10 && styles.achievementUnlocked]}>
                    <View style={styles.achievementIconContainer}>
                      <Text style={styles.achievementEmoji}>{stats.totalClaims >= 10 ? '🔥' : '🔒'}</Text>
                    </View>
                    <View style={styles.achievementInfo}>
                      <Text style={[styles.achievementTitle, stats.totalClaims >= 10 && styles.achievementTitleUnlocked]}>
                        Hot Streak
                      </Text>
                      <Text style={styles.achievementDesc}>Claim 10 drops total</Text>
                    </View>
                    {stats.totalClaims >= 10 && (
                      <View style={styles.achievementCheck}>
                        <IconSymbol name="checkmark.circle.fill" size={24} color="#00D9FF" />
                      </View>
                    )}
                  </View>
                  
                  <View style={[styles.achievementItem, balance >= 1000 && styles.achievementUnlocked]}>
                    <View style={styles.achievementIconContainer}>
                      <Text style={styles.achievementEmoji}>{balance >= 1000 ? '💰' : '🔒'}</Text>
                    </View>
                    <View style={styles.achievementInfo}>
                      <Text style={[styles.achievementTitle, balance >= 1000 && styles.achievementTitleUnlocked]}>
                        Whale Status
                      </Text>
                      <Text style={styles.achievementDesc}>Accumulate 1,000 $MON</Text>
                    </View>
                    {balance >= 1000 && (
                      <View style={styles.achievementCheck}>
                        <IconSymbol name="checkmark.circle.fill" size={24} color="#00D9FF" />
                      </View>
                    )}
                  </View>
                  
                  <View style={[styles.achievementItem, stats.bestDrop >= 500 && styles.achievementUnlocked]}>
                    <View style={styles.achievementIconContainer}>
                      <Text style={styles.achievementEmoji}>{stats.bestDrop >= 500 ? '🏆' : '🔒'}</Text>
                    </View>
                    <View style={styles.achievementInfo}>
                      <Text style={[styles.achievementTitle, stats.bestDrop >= 500 && styles.achievementTitleUnlocked]}>
                        Big Winner
                      </Text>
                      <Text style={styles.achievementDesc}>Claim a 500+ $MON drop</Text>
                    </View>
                    {stats.bestDrop >= 500 && (
                      <View style={styles.achievementCheck}>
                        <IconSymbol name="checkmark.circle.fill" size={24} color="#00D9FF" />
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </View>
          ) : activeTab === 'games' ? (
            <View style={styles.gamesTab}>
              {/* Games Stats Overview */}
              <GlassCard style={styles.gameStatsCard}>
                <Text style={styles.sectionTitle}>🎮 GAME STATISTICS</Text>
                
                <View style={styles.gameStatsGrid}>
                  <View style={styles.gameStat}>
                    <Text style={styles.gameStatValue}>{gameStats.gamesPlayed}</Text>
                    <Text style={styles.gameStatLabel}>Games Played</Text>
                  </View>
                  <View style={styles.gameStat}>
                    <Text style={styles.gameStatValue}>{gameStats.gamesWon}</Text>
                    <Text style={styles.gameStatLabel}>Games Won</Text>
                  </View>
                  <View style={styles.gameStat}>
                    <Text style={styles.gameStatValue}>{gameStats.totalRewards}</Text>
                    <Text style={styles.gameStatLabel}>AP Earned</Text>
                  </View>
                  <View style={styles.gameStat}>
                    <Text style={styles.gameStatValue}>
                      {gameStats.gamesPlayed > 0 
                        ? Math.round((gameStats.gamesWon / gameStats.gamesPlayed) * 100) 
                        : 0}%
                    </Text>
                    <Text style={styles.gameStatLabel}>Win Rate</Text>
                  </View>
                </View>
              </GlassCard>

              {/* High Scores */}
              <View style={styles.highScoresSection}>
                <Text style={styles.sectionTitle}>🏆 HIGH SCORES</Text>
                {Object.entries(gameStats.highScores).length > 0 ? (
                  Object.entries(gameStats.highScores).map(([gameType, score]) => {
                    const config = GAME_CONFIGS[gameType as GameType];
                    return (
                      <GlassCard key={gameType} style={styles.highScoreCard}>
                        <View style={[styles.gameIconSmall, { backgroundColor: config.color }]}>
                          <Text style={{ fontSize: 20 }}>{config.icon}</Text>
                        </View>
                        <View style={styles.highScoreInfo}>
                          <Text style={styles.highScoreName}>{config.name}</Text>
                          <Text style={styles.highScoreValue}>Best Score: {score}</Text>
                        </View>
                      </GlassCard>
                    );
                  })
                ) : (
                  <View style={styles.emptyGamesState}>
                    <Text style={{ fontSize: 48 }}>🎮</Text>
                    <Text style={styles.emptyGamesText}>No games played yet</Text>
                    <Text style={styles.emptyGamesSubtext}>Find games on the map and start playing!</Text>
                  </View>
                )}
              </View>

              {/* Recent Sessions */}
              {recentSessions.length > 0 && (
                <View style={styles.recentSessionsSection}>
                  <Text style={styles.sectionTitle}>📊 RECENT GAMES</Text>
                  {recentSessions.slice(0, 5).map((session) => {
                    const config = GAME_CONFIGS[session.gameType];
                    const didWin = session.score > 0;
                    return (
                      <GlassCard key={session.id} style={styles.sessionCard}>
                        <View style={[styles.gameIconSmall, { backgroundColor: config.color }]}>
                          <Text style={{ fontSize: 18 }}>{config.icon}</Text>
                        </View>
                        <View style={styles.sessionInfo}>
                          <Text style={styles.sessionName}>{config.name}</Text>
                          <Text style={styles.sessionDetails}>
                            Score: {session.score} • {didWin ? '✅ Won' : '❌ Lost'}
                          </Text>
                        </View>
                        {didWin && session.rewardEarned > 0 && (
                          <View style={styles.sessionReward}>
                            <Text style={styles.sessionRewardText}>+{session.rewardEarned}</Text>
                            <Text style={styles.sessionRewardLabel}>AP</Text>
                          </View>
                        )}
                      </GlassCard>
                    );
                  })}
                </View>
              )}
            </View>
          ) : activeTab === 'leaderboard' ? (
            <View style={styles.leaderboardTab}>
              {/* Podium Section */}
              {leaderboard.length >= 3 && (
                <View style={styles.podiumSection}>
                  <Text style={styles.podiumTitle}>🏆 TOP EXPLORERS</Text>
                  <View style={styles.podiumContainer}>
                    <TopPlayer entry={topThree[1]!} position={2} />
                    <TopPlayer entry={topThree[0]!} position={1} />
                    <TopPlayer entry={topThree[2]!} position={3} />
                  </View>
                </View>
              )}

              {/* List */}
              <View style={styles.listSection}>
                <View style={styles.listHeader}>
                  <Text style={styles.listHeaderText}>RANKING</Text>
                  <Text style={styles.listHeaderText}>EARNED</Text>
                </View>
                {restList.map((item) => (
                  <View key={String(item.rank) + item.address}>
                    {renderItem({ item })}
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 64 }}>👋</Text>
              <Text style={styles.emptyTitle}>Connect Your Wallet</Text>
              <Text style={styles.emptyText}>
                Link your wallet to view stats and compete on the leaderboard
              </Text>
            </View>
          )}
        </ScrollView>

        {/* User Rank Sticky Bar - only show on leaderboard tab */}
        {activeTab === 'leaderboard' && isConnected && userRankEntry && userRankEntry.rank > 3 && (
           <View style={styles.stickyUserRank}>
             <LinearGradient
               colors={['#836EF9', '#00D9FF']}
               start={{ x: 0, y: 0 }}
               end={{ x: 1, y: 0 }}
               style={styles.stickyGradient}
             >
               <View style={styles.stickyContent}>
                 <View style={styles.stickyLeft}>
                   <Text style={styles.stickyRank}>#{userRankEntry.rank}</Text>
                   <View>
                     <Text style={styles.stickyLabel}>YOUR RANK</Text>
                     <Text style={styles.stickyScore}>{userRankEntry.totalEarned.toLocaleString()} $MON</Text>
                   </View>
                 </View>
                 <View style={styles.stickyRight}>
                   <IconSymbol name="arrow.up.circle.fill" size={32} color="#fff" />
                 </View>
               </View>
             </LinearGradient>
           </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.05,
  },
  safeArea: {
    flex: 1,
  },
  
  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 44,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1.5,
    fontStyle: 'italic',
  },
  subtitle: {
    fontSize: 9,
    color: '#836EF9',
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: 2,
  },
  rankBadge: {
    backgroundColor: 'rgba(131, 110, 249, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#836EF9',
  },
  rankBadgeText: {
    color: '#836EF9',
    fontSize: 18,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  
  // Tab Switcher
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    position: 'relative',
  },
  tabActive: {
    backgroundColor: 'rgba(131, 110, 249, 0.2)',
  },
  tabText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
  tabTextActive: {
    color: '#fff',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 20,
    right: 20,
    height: 3,
    backgroundColor: '#836EF9',
    borderRadius: 2,
  },

  // ScrollView
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },

  // Stats Tab
  statsTab: {
    paddingHorizontal: 20,
  },
  
  // Hero Card
  heroCard: {
    marginBottom: 20,
    borderRadius: 24,
    overflow: 'hidden',
  },
  heroGradient: {
    padding: 32,
    alignItems: 'center',
    borderRadius: 24,
  },
  avatarRing: {
    padding: 4,
    borderRadius: 64,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 16,
  },
  avatarGradient: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroAddress: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'monospace',
    marginBottom: 12,
    letterSpacing: 1,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  heroBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(131, 110, 249, 0.3)',
  },
  heroBadgeText: {
    color: '#836EF9',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  balanceDisplay: {
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    width: '100%',
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 48,
    fontWeight: '900',
    lineHeight: 48,
  },
  balanceCurrency: {
    color: '#00D9FF',
    fontSize: 20,
    fontWeight: '700',
  },

  // Quick Stats Row
  quickStatsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  quickStat: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  quickStatIcon: {
    marginBottom: 8,
  },
  quickStatValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 4,
  },
  quickStatLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },

  // Achievements
  achievementsSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  sectionCount: {
    color: '#836EF9',
    fontSize: 13,
    fontWeight: '700',
  },
  achievementsList: {
    gap: 12,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  achievementUnlocked: {
    backgroundColor: 'rgba(131, 110, 249, 0.1)',
    borderColor: 'rgba(131, 110, 249, 0.3)',
  },
  achievementIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  achievementEmoji: {
    fontSize: 28,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  achievementTitleUnlocked: {
    color: '#fff',
  },
  achievementDesc: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    fontWeight: '500',
  },
  achievementCheck: {
    marginLeft: 12,
  },

  // Leaderboard Tab
  leaderboardTab: {
    flex: 1,
  },
  
  // Podium
  podiumSection: {
    marginBottom: 24,
    paddingTop: 8,
  },
  podiumTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: 1,
  },
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    gap: 12,
  },
  topPlayerContainer: {
    alignItems: 'center',
    flex: 1,
  },
  topPlayerCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    alignItems: 'center',
    borderRadius: 20,
    width: '100%',
    marginBottom: 0,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    position: 'relative',
  },
  topPlayerCardFirst: {
    backgroundColor: 'rgba(131, 110, 249, 0.15)',
    borderColor: '#836EF9',
    borderWidth: 2,
  },
  crownContainer: {
    position: 'absolute',
    top: -16,
  },
  crownEmoji: {
    fontSize: 32,
  },
  podiumAvatar: {
    padding: 3,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 8,
  },
  podiumAvatarFirst: {
    padding: 4,
  },
  podiumAvatarGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  medalBadge: {
    marginBottom: 8,
  },
  medalEmoji: {
    fontSize: 20,
  },
  topUsername: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  topScore: {
    color: '#00D9FF',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 2,
  },
  topScoreFirst: {
    fontSize: 18,
    color: '#FFD700',
  },
  topScoreLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 9,
    fontWeight: '600',
  },
  youBadge: {
    backgroundColor: '#00D9FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 8,
  },
  youBadgeText: {
    color: '#000',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  podiumBase: {
    width: '100%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  podiumRank: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
    fontStyle: 'italic',
    opacity: 0.3,
  },

  // List Section
  listSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  listHeaderText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    marginBottom: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  rowHighlight: {
    backgroundColor: 'rgba(131, 110, 249, 0.15)',
    borderColor: '#836EF9',
    borderWidth: 2,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rankBadgeSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankBadgeTop10: {
    backgroundColor: 'rgba(131, 110, 249, 0.2)',
  },
  rankText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  rankTextTop10: {
    color: '#836EF9',
  },
  playerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playerInfo: {
    flex: 1,
  },
  username: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  usernameHighlight: {
    color: '#836EF9',
  },
  addressSub: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  rowRight: {
    alignItems: 'flex-end',
  },
  earned: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 2,
  },
  earnedHighlight: {
    color: '#00D9FF',
  },
  earnedLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 9,
    fontWeight: '600',
  },

  // Sticky User Rank
  stickyUserRank: {
    position: 'absolute',
    bottom: 130,
    left: 16,
    right: 16,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#836EF9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  stickyGradient: {
    padding: 18,
  },
  stickyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stickyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stickyRank: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  stickyLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  stickyScore: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
  },
  stickyRight: {
    opacity: 0.8,
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 20,
    marginBottom: 12,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Games Tab Styles
  gamesTab: {
    padding: 16,
    gap: 20,
  },
  gameStatsCard: {
    padding: 20,
  },
  gameStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginTop: 15,
  },
  gameStat: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(131, 110, 249, 0.1)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(131, 110, 249, 0.2)',
  },
  gameStatValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#836EF9',
    marginBottom: 5,
  },
  gameStatLabel: {
    fontSize: 12,
    color: '#AAA',
    textAlign: 'center',
  },
  highScoresSection: {
    gap: 10,
  },
  highScoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    gap: 15,
  },
  gameIconSmall: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  highScoreInfo: {
    flex: 1,
  },
  highScoreName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  highScoreValue: {
    fontSize: 14,
    color: '#AAA',
  },
  emptyGamesState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyGamesText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 15,
    marginBottom: 5,
  },
  emptyGamesSubtext: {
    fontSize: 14,
    color: '#AAA',
    textAlign: 'center',
  },
  recentSessionsSection: {
    gap: 10,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 6,
  },
  sessionDetails: {
    fontSize: 13,
    color: '#AAA',
    fontWeight: '500',
  },
  sessionReward: {
    alignItems: 'flex-end',
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(6, 255, 165, 0.3)',
  },
  sessionRewardText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#06FFA5',
    marginBottom: 2,
  },
  sessionRewardLabel: {
    fontSize: 10,
    color: 'rgba(6, 255, 165, 0.7)',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});