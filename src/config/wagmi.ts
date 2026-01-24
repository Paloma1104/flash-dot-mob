/**
 * Wagmi Configuration for Flash.Mob
 * Supports MetaMask and WalletConnect on Monad Testnet
 */

import { injected, walletConnect } from "wagmi/connectors";
import { createConfig, http } from "wagmi";
import { defineChain } from "viem";

// Polyfill window for React Native if needed
if (typeof window !== 'undefined' && !window.addEventListener) {
  // @ts-ignore - Add minimal polyfill for wagmi
  window.addEventListener = () => {};
  // @ts-ignore
  window.removeEventListener = () => {};
}

// Define Monad Testnet chain
export const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  network: "monad-testnet",
  nativeCurrency: {
    name: "Monad",
    symbol: "MON",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://testnet-rpc.monad.xyz"],
    },
    public: {
      http: ["https://testnet-rpc.monad.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "Monad Explorer",
      url: "https://explorer.testnet.monad.xyz",
    },
  },
  testnet: true,
});

// Get WalletConnect project ID from env
const walletConnectProjectId =
  process.env.EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID || "";

if (!walletConnectProjectId) {
  console.warn(
    "⚠️ EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID not set. WalletConnect will not work.",
  );
  console.warn("Get your project ID from: https://cloud.walletconnect.com/");
}

// Create wagmi config
export const wagmiConfig = createConfig({
  chains: [monadTestnet],
  connectors: [
    // MetaMask and other injected wallets
    injected({
      target: "metaMask",
      shimDisconnect: true,
    }),
    // WalletConnect for mobile wallets
    walletConnect({
      projectId: walletConnectProjectId,
      metadata: {
        name: "Flash.Mob",
        description: "Turn Your City Into a Treasure Hunt",
        url: "https://flashmob.app",
        icons: ["https://flashmob.app/icon.png"],
      },
      showQrModal: false, // Disable for React Native - use deep linking
      qrModalOptions: {
        themeMode: 'dark',
      },
    }),
  ],
  transports: {
    [monadTestnet.id]: http(),
  },
  multiInjectedProviderDiscovery: false, // Disable for React Native
});

// Export for use in hooks
export { monadTestnet as defaultChain };
