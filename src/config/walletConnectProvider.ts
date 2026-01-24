/**
 * WalletConnect Provider for React Native
 * Uses @walletconnect/ethereum-provider directly for better RN compatibility
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import EthereumProvider from "@walletconnect/ethereum-provider";
import { monadTestnet } from "./wagmi";

// Suppress WalletConnect internal logging errors from Expo overlay
if (typeof global !== "undefined") {
  const originalConsoleError = console.error;

  console.error = (...args: any[]) => {
    // Filter out WalletConnect internal errors that clutter the UI
    const message = String(args[0] || "");
    const jsonMessage =
      typeof args[0] === "object" ? JSON.stringify(args[0]) : "";

    // Check if this is a WalletConnect internal log (JSON object with context/level/msg)
    const isWalletConnectInternalLog =
      typeof args[0] === "object" &&
      args[0] !== null &&
      ("context" in args[0] || "level" in args[0]);

    if (
      // String-based filters
      message.includes("onRelayMessage") ||
      message.includes("session topic doesn't exist") ||
      message.includes("request() -> isValidRequest()") ||
      message.includes("Missing or invalid. request() chainId") ||
      message.includes("No matching key") ||
      // JSON message filters
      jsonMessage.includes("onRelayMessage") ||
      jsonMessage.includes("isValidRequest") ||
      jsonMessage.includes("No matching key") ||
      jsonMessage.includes("Restore will override") ||
      jsonMessage.includes("Pending session not found") ||
      jsonMessage.includes("core/history") ||
      jsonMessage.includes("core/expirer") ||
      jsonMessage.includes("core/pairing") ||
      // WalletConnect internal structured logs (suppress all level 50 logs from WC)
      isWalletConnectInternalLog
    ) {
      // Silently suppress - these are internal WalletConnect SDK messages
      return;
    }
    originalConsoleError.apply(console, args);
  };
}

// Get WalletConnect project ID from env
const walletConnectProjectId =
  process.env.EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID || "";

if (!walletConnectProjectId) {
  console.warn(
    "⚠️ EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID not set. WalletConnect will not work.",
  );
}

// Type alias for the provider instance
export type WalletConnectProviderType = Awaited<
  ReturnType<typeof EthereumProvider.init>
>;

let providerInstance: WalletConnectProviderType | null = null;
let initializationPromise: Promise<WalletConnectProviderType | null> | null =
  null;
let isInitializing = false;
let lastLogTime = 0;

/**
 * Initialize and get the WalletConnect provider
 * Singleton pattern to avoid multiple instances
 */
export async function getWalletConnectProvider(): Promise<WalletConnectProviderType | null> {
  if (!walletConnectProjectId) {
    console.error("WalletConnect project ID is not configured");
    return null;
  }

  // If already initialized and healthy, return immediately
  if (providerInstance) {
    // Only log once per 5 seconds to reduce noise
    if (!lastLogTime || Date.now() - lastLogTime > 5000) {
      console.log("✅ Returning existing WalletConnect provider");
      lastLogTime = Date.now();
    }
    return providerInstance;
  }

  // If currently initializing, wait for that promise
  if (initializationPromise) {
    console.log("⏳ WalletConnect initialization in progress, waiting...");
    return initializationPromise;
  }

  // Prevent concurrent initialization
  if (isInitializing) {
    console.log("⏳ Already initializing, please wait...");
    await new Promise((resolve) => setTimeout(resolve, 100));
    return getWalletConnectProvider();
  }

  // Start initialization
  console.log("🔗 Starting new WalletConnect provider initialization...");
  isInitializing = true;
  initializationPromise = (async () => {
    try {
      // Final safety check
      if (providerInstance) {
        console.log("✅ Using existing WalletConnect provider instance");
        return providerInstance;
      }

      providerInstance = await EthereumProvider.init({
        projectId: walletConnectProjectId,
        chains: [monadTestnet.id],
        optionalChains: [monadTestnet.id],
        showQrModal: false,
        metadata: {
          name: "Flash.Mob",
          description: "Turn Your City Into a Treasure Hunt",
          url: "https://flashmob.app",
          icons: ["https://flashmob.app/icon.png"],
        },
        rpcMap: {
          [monadTestnet.id]: monadTestnet.rpcUrls.default.http[0],
        },
      });

      console.log("✅ WalletConnect EthereumProvider initialized");

      // Check for existing session
      if (providerInstance.session && providerInstance.connected) {
        console.log("✅ Restored existing WalletConnect session");
        console.log("   Accounts:", providerInstance.accounts);
        console.log("   Chain ID:", providerInstance.chainId);
      } else {
        console.log("🔵 No existing WalletConnect session found");
      }

      return providerInstance;
    } catch (error) {
      console.error("Failed to initialize WalletConnect provider:", error);
      providerInstance = null;
      return null;
    } finally {
      initializationPromise = null;
      isInitializing = false;
    }
  })();

  return initializationPromise;
}

/**
 * Disconnect and cleanup the provider
 */
export async function disconnectWalletConnect(): Promise<void> {
  if (providerInstance) {
    try {
      await providerInstance.disconnect();
      console.log("🔌 WalletConnect disconnected");
    } catch (error) {
      console.error("Error disconnecting WalletConnect:", error);
    } finally {
      // Always clear the instance after disconnect
      providerInstance = null;
      initializationPromise = null;
      isInitializing = false;
    }
  } else {
    // Clear state even if no instance
    providerInstance = null;
    initializationPromise = null;
    isInitializing = false;
  }
}

/**
 * Reset the provider completely (clears storage and instance)
 */
export async function resetWalletConnect(): Promise<void> {
  // Disconnect first
  await disconnectWalletConnect();

  // Clear storage
  try {
    const keys = await AsyncStorage.getAllKeys();
    const wcKeys = keys.filter((key) => key.startsWith("wc@2:"));
    if (wcKeys.length > 0) {
      await AsyncStorage.multiRemove(wcKeys);
      console.log("🧹 WalletConnect storage cleared");
    }
  } catch (error) {
    console.error("Error clearing WalletConnect storage:", error);
  }
}

/**
 * Check if WalletConnect is connected
 */
export function isWalletConnectConnected(): boolean {
  return providerInstance?.connected ?? false;
}

/**
 * Get current WalletConnect session
 */
export function getWalletConnectSession() {
  return providerInstance?.session ?? null;
}
