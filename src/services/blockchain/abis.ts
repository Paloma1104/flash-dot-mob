/**
 * Smart Contract ABIs for Flash.Mob
 * Auto-generated from compiled Solidity contracts
 * Last updated: 2026-01-25
 */

// ============================================
// FlashMobV2 - Location-based drop claiming
// ============================================
export const FLASH_MOB_V2_ABI = [
  // Constructor
  {
    type: 'constructor',
    inputs: [
      { name: '_token', type: 'address' },
      { name: '_trustedSigner', type: 'address' },
      { name: '_defaultExpiryHours', type: 'uint24' },
    ],
    stateMutability: 'nonpayable',
  },
  // Claim Functions
  {
    type: 'function',
    name: 'claimSingle',
    inputs: [
      { name: 'dropIdSmall', type: 'uint32' },
      { name: 'amount', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
      { name: 'signature', type: 'bytes' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'claimWithHash',
    inputs: [
      { name: 'dropId', type: 'bytes32' },
      { name: 'amount', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
      { name: 'signature', type: 'bytes' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'claimBatch',
    inputs: [
      { name: 'epoch', type: 'uint256' },
      { name: 'dropIds', type: 'bytes32[]' },
      { name: 'amounts', type: 'uint256[]' },
      { name: 'proofs', type: 'bytes32[][]' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'claimDropSimple',
    inputs: [
      { name: 'dropId', type: 'bytes32' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  // View Functions
  {
    type: 'function',
    name: 'isClaimedSmall',
    inputs: [{ name: 'dropId', type: 'uint32' }],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'isClaimedHash',
    inputs: [
      { name: 'dropId', type: 'bytes32' },
      { name: 'user', type: 'address' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getBalance',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'nonces',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getDomainSeparator',
    inputs: [],
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'view',
  },
  // Events
  {
    type: 'event',
    name: 'DropClaimed',
    inputs: [
      { name: 'dropId', type: 'bytes32', indexed: true },
      { name: 'claimer', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'epoch', type: 'uint256', indexed: true },
    ],
  },
  {
    type: 'event',
    name: 'BatchClaimed',
    inputs: [
      { name: 'claimer', type: 'address', indexed: true },
      { name: 'totalAmount', type: 'uint256', indexed: false },
      { name: 'dropCount', type: 'uint256', indexed: false },
    ],
  },
] as const;

// ============================================
// GameRewards - Game sessions and rewards
// ============================================
export const GAME_REWARDS_ABI = [
  // Constructor
  {
    type: 'constructor',
    inputs: [
      { name: '_apToken', type: 'address' },
      { name: '_monToken', type: 'address' },
      { name: '_trustedSigner', type: 'address' },
      { name: '_treasury', type: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  // Game Functions
  {
    type: 'function',
    name: 'startGame',
    inputs: [
      { name: 'sessionId', type: 'bytes32' },
      { name: 'gameType', type: 'string' },
      { name: 'difficulty', type: 'string' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'claimReward',
    inputs: [
      { name: 'sessionId', type: 'bytes32' },
      { name: 'monReward', type: 'uint256' },
      { name: 'score', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
      { name: 'signature', type: 'bytes' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  // View Functions
  {
    type: 'function',
    name: 'getUserStats',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [
      { name: 'gamesPlayed', type: 'uint256' },
      { name: 'gamesWon', type: 'uint256' },
      { name: 'totalAPSpent', type: 'uint256' },
      { name: 'totalMONEarned', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'canPlay',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getRemainingPlays',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'nonces',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'completedSessions',
    inputs: [{ name: 'sessionId', type: 'bytes32' }],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  // Events
  {
    type: 'event',
    name: 'GameStarted',
    inputs: [
      { name: 'sessionId', type: 'bytes32', indexed: true },
      { name: 'player', type: 'address', indexed: true },
      { name: 'gameType', type: 'string', indexed: false },
      { name: 'difficulty', type: 'string', indexed: false },
      { name: 'apCost', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'GameCompleted',
    inputs: [
      { name: 'sessionId', type: 'bytes32', indexed: true },
      { name: 'player', type: 'address', indexed: true },
      { name: 'score', type: 'uint256', indexed: false },
      { name: 'monReward', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'RewardClaimed',
    inputs: [
      { name: 'sessionId', type: 'bytes32', indexed: true },
      { name: 'player', type: 'address', indexed: true },
      { name: 'monAmount', type: 'uint256', indexed: false },
    ],
  },
] as const;

// ============================================
// APToken - Activity Points ERC20 Token
// ============================================
export const AP_TOKEN_ABI = [
  // ERC20 Standard
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'transfer',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'allowance',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'totalSupply',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'decimals',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'symbol',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'name',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
  },
  // AP Token Specific
  {
    type: 'function',
    name: 'purchase',
    inputs: [],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'burnFrom',
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'easyGameCost',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'mediumGameCost',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'hardGameCost',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  // Events
  {
    type: 'event',
    name: 'Transfer',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'Approval',
    inputs: [
      { name: 'owner', type: 'address', indexed: true },
      { name: 'spender', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false },
    ],
  },
] as const;

// ============================================
// MockMON - Test MON Token (ERC20)
// ============================================
export const MOCK_MON_ABI = [
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'transfer',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'decimals',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'symbol',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'mint',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const;

// ============================================
// MultiplayerStation - Multiplayer gaming
// ============================================
export const MULTIPLAYER_STATION_ABI = [
  {
    type: 'function',
    name: 'joinStation',
    inputs: [{ name: 'stationId', type: 'bytes32' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'leaveStation',
    inputs: [{ name: 'stationId', type: 'bytes32' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'submitScore',
    inputs: [
      { name: 'stationId', type: 'bytes32' },
      { name: 'player', type: 'address' },
      { name: 'score', type: 'uint256' },
      { name: 'signature', type: 'bytes' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getStation',
    inputs: [{ name: 'stationId', type: 'bytes32' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'name', type: 'string' },
          { name: 'latitude', type: 'int256' },
          { name: 'longitude', type: 'int256' },
          { name: 'stakeAmount', type: 'uint256' },
          { name: 'minPlayers', type: 'uint256' },
          { name: 'maxPlayers', type: 'uint256' },
          { name: 'createdAt', type: 'uint256' },
          { name: 'creator', type: 'address' },
          { name: 'isActive', type: 'bool' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getSessionInfo',
    inputs: [{ name: 'stationId', type: 'bytes32' }],
    outputs: [
      { name: 'players', type: 'address[]' },
      { name: 'selectedGame', type: 'uint8' },
      { name: 'totalPool', type: 'uint256' },
      { name: 'startedAt', type: 'uint256' },
      { name: 'status', type: 'uint8' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getAllStations',
    inputs: [],
    outputs: [{ name: '', type: 'bytes32[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getMinimumStake',
    inputs: [{ name: 'stationId', type: 'bytes32' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  // Events
  {
    type: 'event',
    name: 'PlayerJoined',
    inputs: [
      { name: 'stationId', type: 'bytes32', indexed: true },
      { name: 'player', type: 'address', indexed: true },
      { name: 'stakedAmount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'GameStarted',
    inputs: [
      { name: 'stationId', type: 'bytes32', indexed: true },
      { name: 'selectedGame', type: 'uint8', indexed: false },
      { name: 'players', type: 'address[]', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'GameCompleted',
    inputs: [
      { name: 'stationId', type: 'bytes32', indexed: true },
      { name: 'winner', type: 'address', indexed: true },
      { name: 'prizeAmount', type: 'uint256', indexed: false },
    ],
  },
] as const;

// ============================================
// Legacy ABI (for backwards compatibility)
// ============================================
export const DROP_CLAIMER_ABI = FLASH_MOB_V2_ABI;
export const ERC20_ABI = AP_TOKEN_ABI;
