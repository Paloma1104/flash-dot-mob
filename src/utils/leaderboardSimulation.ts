import { LeaderboardEntry } from '@/src/services/api/endpoints';

/**
 * Generates a simulated leaderboard around the user's score.
 * This creates a dynamic, "live" feeling competition without a backend.
 */
export function generateSimulatedLeaderboard(
  userAddress: string | null,
  userBalance: number
): LeaderboardEntry[] {
  const entries: LeaderboardEntry[] = [];
  
  const usernames = [
    "CryptoWhale", "MonadMaxi", "FlashHunter", "DropKing", "AlphaSeeker",
    "GmiWagmi", "SatoshiFan", "VitalikStan", "ChainLink", "BlockMaster",
    "TokenTrotter", "PixelPunk", "CyberNinja", "NeonRider", "GlassWalker",
    "VoidRunner", "NullPointer", "HashBasher", "GasGuzzler", "MintMaster",
    "L2Native", "ZkPro", "Optimist", "ArbitrumAce", "BaseJumper",
    "SolanaSpeed", "EthGuardian", "BtcBaron", "NftCollector", "DefiDegen",
    "YieldFarmer", "LiquidityLord", "StakeMaster", "GovGovernor", "DaoDirector"
  ];
  
  // Create simulated entries
  for (let i = 0; i < 45; i++) {
    const baseScore = Math.max(0, 1000 - i * 20 + Math.random() * 50);
    const username = i < usernames.length ? usernames[i] : `User${Math.floor(Math.random() * 9999)}`;
    
    entries.push({
      rank: 0, // Assigned later
      address: `0x${Math.random().toString(16).substr(2, 4)}...${Math.random().toString(16).substr(2, 4)}`,
      username: username,
      claimsCount: Math.floor(baseScore / 10),
      totalEarned: Math.floor(baseScore),
    });
  }

  // Add "Famous" simulated players
  entries.push({ rank: 0, address: 'vitalik.eth', username: "Vitalik (Sim)", claimsCount: 500, totalEarned: 50000 });
  entries.push({ rank: 0, address: 'monad.eth', username: "Monad Official", claimsCount: 1000, totalEarned: 100000 });

  // Add Current User
  if (userAddress) {
    entries.push({
      rank: 0,
      address: userAddress,
      username: "YOU",
      claimsCount: Math.floor(userBalance / 10), // Estimate
      totalEarned: userBalance,
    });
  }

  // Sort by score
  entries.sort((a, b) => b.totalEarned - a.totalEarned);

  // Assign ranks
  return entries.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
}
