import { GameType, GAME_CONFIGS, type GameDrop } from '../types/game';

// Generate mock game drops around a location
// Radius of 0.01-0.03 (~1-3 kilometers) for proper spacing
export function generateMockGameDrops(latitude: number, longitude: number): GameDrop[] {
  const minRadius = 0.01; // ~1 kilometer
  const maxRadius = 0.03; // ~3 kilometers
  const gameTypes = Object.values(GameType);
  const difficulties: ('easy' | 'medium' | 'hard')[] = ['easy', 'medium', 'hard'];
  
  const drops: GameDrop[] = [];
  const dropCount = 20; // Generate 20 game drops with good spacing

  for (let i = 0; i < dropCount; i++) {
    const randomGameType = gameTypes[Math.floor(Math.random() * gameTypes.length)];
    const randomDifficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
    
    // Random position between minRadius and maxRadius (1-3km)
    const angle = Math.random() * 2 * Math.PI;
    const distance = minRadius + Math.random() * (maxRadius - minRadius);
    const randomLat = latitude + distance * Math.cos(angle);
    const randomLng = longitude + distance * Math.sin(angle);

    // Get game config for this game type
    const gameConfig = GAME_CONFIGS[randomGameType];
    const difficultyConfig = gameConfig.difficultyLevels[randomDifficulty];
    
    // Use the configured reward and AP cost from game config
    const rewardAmount = difficultyConfig.reward;
    const apCost = difficultyConfig.apCost;

    drops.push({
      id: `game-drop-${i}`,
      latitude: randomLat,
      longitude: randomLng,
      gameType: randomGameType,
      difficulty: randomDifficulty,
      rewardAmount,
      apCost, // Now properly set from game config
      tokenSymbol: 'MON',
      expiresAt: null,
      createdAt: new Date().toISOString(),
      completedBy: [],
      isActive: true,
      maxCompletions: 1,
    });
  }

  return drops;
}

// Get nearby game drops (within distance in meters)
export function getNearbyGameDrops(
  userLat: number,
  userLng: number,
  drops: GameDrop[],
  maxDistance = 5000 // 5km default for better coverage
): GameDrop[] {
  return drops
    .map((drop) => {
      const distance = calculateDistance(userLat, userLng, drop.latitude, drop.longitude);
      return { drop, distance };
    })
    .filter(({ distance }) => distance <= maxDistance)
    .sort((a, b) => a.distance - b.distance)
    .map(({ drop }) => drop);
}

// Calculate distance between two coordinates in meters
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
