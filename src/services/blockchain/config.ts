import { defineChain } from "viem";

// Determine which network to use based on CHAIN_ID
const CHAIN_ID = Number(process.env.EXPO_PUBLIC_CHAIN_ID || 31337);

// Anvil Local Testnet configuration (for development)
export const anvilLocal = defineChain({
  id: 31337,
  name: "Anvil Local",
  nativeCurrency: {
    decimals: 18,
    name: "Ethereum",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["http://localhost:8545"],
    },
  },
  testnet: true,
});

// Monad Testnet configuration
export const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Monad",
    symbol: "MON",
  },
  rpcUrls: {
    default: {
      http: [
        process.env.EXPO_PUBLIC_RPC_URL || "https://testnet-rpc.monad.xyz",
      ],
    },
  },
  blockExplorers: {
    default: {
      name: "Monad Explorer",
      url: "https://testnet.monadexplorer.com",
    },
  },
  testnet: true,
});

// Supported chains for the app
export const supportedChains = [anvilLocal, monadTestnet] as const;

// Default chain based on environment
export const defaultChain = CHAIN_ID === 31337 ? anvilLocal : monadTestnet;

// Contract addresses (to be filled in after deployment)
export const contracts = {
  // Flash.Mob V2 main contract
  flashMob: process.env.EXPO_PUBLIC_FLASH_MOB_ADDRESS as
    | `0x${string}`
    | undefined,
  // MON Token contract (testnet)
  mockMON: process.env.EXPO_PUBLIC_MOCK_MON_ADDRESS as
    | `0x${string}`
    | undefined,
  // AP Token contract (Activity Points)
  apToken: process.env.EXPO_PUBLIC_AP_TOKEN_ADDRESS as
    | `0x${string}`
    | undefined,
  // GameRewards contract
  gameRewards: process.env.EXPO_PUBLIC_GAME_REWARDS_ADDRESS as
    | `0x${string}`
    | undefined,
} as const;
