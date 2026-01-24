// App Constants
export const APP_NAME = "Flash.Mob";

// Geo constants
export const DEFAULT_CLAIM_RADIUS_METERS = 50;
export const LOCATION_POLL_INTERVAL_MS = 5000;
export const HIGH_ACCURACY_DURATION_MS = 10000;

// API constants
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "https://api.flashmob.io";

// Chain config
export const CHAIN_ID = parseInt(
  process.env.EXPO_PUBLIC_CHAIN_ID || "31337",
  10,
); // Anvil Local
export const RPC_URL =
  process.env.EXPO_PUBLIC_RPC_URL || "http://localhost:8545";
