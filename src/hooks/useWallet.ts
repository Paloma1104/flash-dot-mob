import { monadTestnet } from "@/config/wagmi";
import { getWalletConnectProvider } from "@/config/walletConnectProvider";
import { useUserStore } from "@/stores/userStore";
import { logTransactionDetails } from "@/utils/transactionDebug";
import { useCallback, useEffect, useState } from "react";
import { Alert, Linking } from "react-native";
import type { WalletClient } from "viem";
import { createPublicClient, formatEther, http } from "viem";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useSignMessage,
  useWalletClient,
} from "wagmi";

interface WalletState {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  walletClient: WalletClient | null;
}

interface UseWalletReturn extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signMessage: (message: string) => Promise<string | null>;
  sendTransaction: (to: string, data: string) => Promise<string | null>;
}

/**
 * Wallet hook using Wagmi for MetaMask and WalletConnect
 * Supports external wallets on Monad Testnet
 */
// Module-level state cache for deduplication across all component instances
let globalLastLoggedState = "";
let logTimeout: any = null;

export function useWallet(): UseWalletReturn {
  const { address, isConnected: wagmiConnected } = useAccount();
  const { connectors, connect: wagmiConnect, isPending } = useConnect();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { data: walletClient } = useWalletClient();
  const { signMessageAsync } = useSignMessage();

  const [error, setError] = useState<string | null>(null);
  const [isConnectingWC, setIsConnectingWC] = useState(false); // Track WalletConnect connection state

  const {
    isAuthenticated,
    walletAddress,
    setAuthenticated,
    setBalance,
    logout: storeLogout,
    hasClaimedInitialAP,
    setHasClaimedInitialAP,
    addAP,
  } = useUserStore();

  // Initial AP Airdrop - 1000 AP on first connection
  useEffect(() => {
    if (isAuthenticated && !hasClaimedInitialAP) {
      console.log("🎉 User connected! Adding 1000 AP welcome bonus");
      addAP(1000);
      setHasClaimedInitialAP(true);
      Alert.alert(
        "Welcome Bonus! 🎉",
        "You've received 1000 AP for connecting your wallet!",
      );
    }
  }, [isAuthenticated, hasClaimedInitialAP, addAP, setHasClaimedInitialAP]);

  // Create public client for reading blockchain data
  const publicClient = createPublicClient({
    chain: monadTestnet,
    transport: http(),
  });

  // Fetch balance from blockchain
  const fetchBalance = useCallback(
    async (address: string) => {
      try {
        const balance = await publicClient.getBalance({
          address: address as `0x${string}`,
        });
        const balanceInMON = parseFloat(formatEther(balance));
        setBalance(balanceInMON);
        console.log("💰 Fetched balance:", balanceInMON, "MON");
      } catch (error) {
        console.error("Failed to fetch balance:", error);
      }
    },
    [publicClient],
  ); // Remove setBalance from dependencies as store actions are stable

  // Sync wagmi authentication state with user store
  // NOTE: Only update when wagmi actually connects, don't logout on wagmi disconnect
  // since we might be using WalletConnect directly
  useEffect(() => {
    if (wagmiConnected && address) {
      // Only update if the address has changed to prevent infinite loops
      if (walletAddress !== address) {
        console.log("📝 Syncing wagmi connection to store");
        setAuthenticated(true, address as `0x${string}`);
        // Fetch balance when wagmi connects
        fetchBalance(address);
      }
    }
    // Don't call storeLogout() here - it interferes with WalletConnect
    // The disconnect() function handles logout explicitly
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wagmiConnected, address]); // Only depend on wagmi state changes, not store actions

  // Debug logging for connection state - global deduplication across all instances
  useEffect(() => {
    const finalIsConnected = wagmiConnected || isAuthenticated;
    const stateKey = `${wagmiConnected}-${address}-${isAuthenticated}-${walletAddress}`;

    // Debounce and deduplicate globally
    if (stateKey !== globalLastLoggedState) {
      if (logTimeout) clearTimeout(logTimeout);

      logTimeout = setTimeout(() => {
        globalLastLoggedState = stateKey;
        console.log("🔍 Wallet State:", {
          connected: finalIsConnected,
          address: address || walletAddress || "none",
          source: wagmiConnected
            ? "wagmi"
            : isAuthenticated
              ? "WalletConnect"
              : "none",
        });
      }, 100); // Debounce for 100ms
    }
  }, [wagmiConnected, address, isAuthenticated, walletAddress]);

  // Check for existing WalletConnect session on mount
  useEffect(() => {
    const checkExistingSession = async () => {
      // Only check if not already authenticated and not connecting
      if (isAuthenticated || isPending || isConnectingWC) {
        return;
      }

      try {
        const provider = await getWalletConnectProvider();
        if (!provider) return;

        // Check if there's a valid existing session
        if (
          provider.connected &&
          provider.accounts &&
          provider.accounts.length > 0
        ) {
          console.log("✅ Found existing WalletConnect session on mount");
          console.log("   Accounts:", provider.accounts);
          console.log("   Chain ID:", provider.chainId);

          const walletAddress = provider.accounts[0] as `0x${string}`;
          setAuthenticated(true, walletAddress);
          await fetchBalance(walletAddress);
          console.log("✅ Restored WalletConnect session");
        }
      } catch (error) {
        console.log("⚠️ Error checking existing session:", error);
      }
    };

    checkExistingSession();
  }, []); // Only run once on mount

  const connect = useCallback(async () => {
    // Prevent duplicate calls
    if (isConnectingWC) {
      console.log("⚠️ Connection already in progress, ignoring duplicate call");
      return;
    }

    setError(null);
    setIsConnectingWC(true);

    try {
      // Get the WalletConnect provider directly
      const provider = await getWalletConnectProvider();

      if (!provider) {
        Alert.alert(
          "Configuration Error",
          "WalletConnect is not configured. Please check your EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID in .env",
        );
        return;
      }

      // Check if already connected with valid accounts
      if (
        provider.connected &&
        provider.accounts &&
        provider.accounts.length > 0
      ) {
        console.log("✅ Already connected to WalletConnect");
        console.log("   Accounts:", provider.accounts);
        console.log("   Chain ID:", provider.chainId);

        // Use existing connection
        const walletAddress = provider.accounts[0] as `0x${string}`;
        setAuthenticated(true, walletAddress);
        await fetchBalance(walletAddress);
        console.log("✅ Reusing existing WalletConnect session");
        return;
      }

      // Check for incomplete/stale session (has session object but not connected)
      // Only clear if session exists but connection is dead
      if (
        provider.session &&
        !provider.connected &&
        (!provider.accounts || provider.accounts.length === 0)
      ) {
        console.log("🧹 Found incomplete session, clearing...");
        try {
          await provider.disconnect();
          console.log("✅ Incomplete session cleared");
          // Wait for cleanup
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (e) {
          console.warn("⚠️ Failed to clear incomplete session:", e);
        }
      }

      console.log("🔗 Starting new WalletConnect connection...");

      // Check if MetaMask can be opened
      const canOpenMetaMask = await Linking.canOpenURL("metamask://");
      console.log("📱 Can open MetaMask?", canOpenMetaMask);
      if (!canOpenMetaMask) {
        console.warn("⚠️ MetaMask app may not be installed or accessible");
      }

      // Set up event listeners for connection updates
      const onConnect = (connectInfo: any) => {
        console.log("✅ WalletConnect connect event:", connectInfo);
        // Connection successful, finalize state
        if (provider.accounts && provider.accounts.length > 0) {
          const walletAddress = provider.accounts[0] as `0x${string}`;
          setAuthenticated(true, walletAddress);
          fetchBalance(walletAddress);
          setIsConnectingWC(false);
        }
      };

      const onAccountsChanged = (accounts: string[]) => {
        console.log("🔄 Accounts changed:", accounts);
        if (accounts && accounts.length > 0) {
          const walletAddress = accounts[0] as `0x${string}`;
          setAuthenticated(true, walletAddress);
          fetchBalance(walletAddress);
        }
      };

      const onDisconnect = () => {
        console.log("🔌 WalletConnect disconnected event");
        storeLogout();
      };

      // Set up listeners before connection attempt
      provider.on("connect", onConnect);
      provider.on("accountsChanged", onAccountsChanged);
      provider.on("disconnect", onDisconnect);

      // Listen for the WalletConnect URI - use once to avoid duplicates
      provider.once("display_uri", (uri: string) => {
        console.log("📱 WalletConnect URI received:", uri);
        console.log("🔵 Opening MetaMask app...");

        // Open MetaMask with the WalletConnect URI
        const metamaskUrl = `metamask://wc?uri=${encodeURIComponent(uri)}`;
        Linking.openURL(metamaskUrl)
          .then(() => {
            console.log("✅ Successfully opened MetaMask app");
          })
          .catch((err) => {
            console.error("❌ Failed to open MetaMask:", err);
            console.log("🔵 Trying fallback WalletConnect URL...");
            // Try generic WalletConnect deep link as fallback
            const wcUrl = `wc:${uri.split("wc:")[1] || uri}`;
            Linking.openURL(wcUrl).catch((err2) => {
              console.error("❌ Failed to open WalletConnect URL:", err2);
              Alert.alert(
                "Open MetaMask Manually",
                'Could not automatically open MetaMask.\n\n1. Open MetaMask app\n2. Tap "Scan QR" or "Connect"\n3. Approve the connection',
                [{ text: "OK" }],
              );
            });
          });
      });

      // Use enable() to request accounts with extended timeout for app switching
      console.log("🔗 Requesting wallet connection...");
      console.log(
        "ℹ️  Please approve in MetaMask. You can switch back to this app after approving.",
      );

      // Give a moment for display_uri event to fire and MetaMask to open
      await new Promise((resolve) => setTimeout(resolve, 500));

      const accounts = await Promise.race([
        provider.enable(),
        new Promise<string[]>(
          (_, reject) =>
            setTimeout(
              () =>
                reject(
                  new Error(
                    "Connection timeout - please try again and approve in MetaMask",
                  ),
                ),
              120000,
            ), // 2 minutes
        ),
      ]);

      console.log("✅ WalletConnect connected with accounts:", accounts);

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts returned from WalletConnect");
      }

      // Update the app state with the connected wallet
      const walletAddress = accounts[0] as `0x${string}`;
      setAuthenticated(true, walletAddress);
      console.log("✅ Wallet authenticated:", walletAddress);

      // Fetch real balance from blockchain
      await fetchBalance(walletAddress);

      // Clean up event listeners
      provider.off("connect", onConnect);
      provider.off("accountsChanged", onAccountsChanged);
      provider.off("disconnect", onDisconnect);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to connect wallet";
      const errorCode = (err as any)?.code;

      console.log("❌ Connection error:", errorMessage);
      console.log("   Error code:", errorCode);

      // Check for user rejection (code 4001 or specific messages)
      if (
        errorCode === 4001 ||
        errorCode === 5000 ||
        errorMessage.includes("User rejected") ||
        errorMessage.includes("User declined") ||
        errorMessage.includes("rejected the request")
      ) {
        console.log("ℹ️ User cancelled the connection");
        return;
      }

      // Check for session/connection errors that can be retried
      if (
        errorMessage.includes("No matching") ||
        errorMessage.includes("Session") ||
        errorMessage.includes("Connection")
      ) {
        console.log("⚠️ Connection issue - may need to retry");
      }

      setError(errorMessage);
      console.error("Wallet connection error:", err);

      // Check if wallet app is installed
      const metamaskUrl = "metamask://";
      const canOpen = await Linking.canOpenURL(metamaskUrl);

      if (!canOpen) {
        Alert.alert(
          "Wallet App Required",
          "Please install MetaMask or another WalletConnect-compatible wallet app to continue.\n\nAfter installation, try connecting again.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Install MetaMask",
              onPress: () => Linking.openURL("https://metamask.io/download/"),
            },
          ],
        );
      } else {
        // Don't show alert for certain WalletConnect internal errors
        if (
          !errorMessage.includes("onRelayMessage") &&
          !errorMessage.includes("failed to process")
        ) {
          Alert.alert(
            "Connection Failed",
            errorMessage + "\n\nPlease try connecting again.",
            [{ text: "OK" }],
          );
        } else {
          console.log("⚠️ WalletConnect relay error (likely temporary)");
        }
      }
    } finally {
      setIsConnectingWC(false);
    }
  }, [wagmiConnect, connectors, isConnectingWC]);

  const disconnect = useCallback(async () => {
    try {
      // Disconnect both wagmi and WalletConnect
      wagmiDisconnect();

      // Also disconnect WalletConnect provider if active
      const provider = await getWalletConnectProvider();
      if (provider && provider.connected) {
        await provider.disconnect();
        console.log("✅ WalletConnect provider disconnected");
      }

      storeLogout();
      console.log("✅ Wallet fully disconnected");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disconnect");
      console.error("Wallet disconnect error:", err);
    }
  }, [wagmiDisconnect, storeLogout]);

  const signMessage = useCallback(
    async (message: string): Promise<string | null> => {
      const effectiveAddress = address || walletAddress;

      if (!effectiveAddress) {
        setError("No wallet connected");
        return null;
      }

      try {
        const signature = await signMessageAsync({ message });
        return signature;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to sign message");
        console.error("Sign message error:", err);
        return null;
      }
    },
    [address, walletAddress, signMessageAsync],
  );

  const sendTransaction = useCallback(
    async (to: string, data: string, value?: string): Promise<string | null> => {
      // Use composite address (wagmi or WalletConnect store)
      const effectiveAddress = address || walletAddress;

      console.log("🔵 sendTransaction called");
      console.log("  - to:", to);
      console.log("  - data length:", data.length);
      console.log("  - value:", value || "0");
      console.log("  - wagmi address:", address);
      console.log("  - store address:", walletAddress);
      console.log("  - effective address:", effectiveAddress);

      if (!effectiveAddress) {
        console.log("❌ No address, aborting");
        setError("No wallet connected");
        return null;
      }

      try {
        console.log("🔵 Getting WalletConnect provider...");
        // Use WalletConnect provider directly for better MetaMask integration
        const provider = await getWalletConnectProvider();

        if (!provider) {
          console.log("❌ Provider is null");
          throw new Error("WalletConnect provider not initialized");
        }

        console.log("✅ Provider obtained");
        console.log("🔵 Checking provider session...");
        console.log("  - Connected:", provider.connected);
        console.log("  - Accounts:", provider.accounts);
        console.log("  - Chain ID:", provider.chainId);
        console.log("  - Session exists:", !!provider.session);

        // If we have a session but not connected, try to reconnect
        if (!provider.connected && provider.session) {
          console.log(
            "🔄 Session exists but not connected, attempting to re-enable...",
          );
          try {
            await provider.enable();
            console.log("✅ Provider re-enabled successfully");
          } catch (enableErr) {
            console.log("⚠️ Failed to re-enable provider:", enableErr);
          }
        }

        // Check if session is healthy
        if (!provider.connected || !provider.session) {
          console.log("⚠️ WalletConnect session appears disconnected");
          throw new Error(
            "WalletConnect session is not active. Please reconnect your wallet.",
          );
        }

        // Get accounts from session namespaces (more reliable than provider.accounts)
        let providerAccounts = provider.accounts || [];

        // If provider.accounts is empty, try to extract from session
        if (providerAccounts.length === 0 && provider.session) {
          console.log(
            "🔍 provider.accounts is empty, checking session namespaces...",
          );
          try {
            const namespaces = provider.session.namespaces;
            if (namespaces && namespaces.eip155) {
              const eip155Accounts = namespaces.eip155.accounts || [];
              // Format: "eip155:10143:0x..." - extract just the address
              // Remove duplicates using Set
              const uniqueAddresses = new Set<string>();
              eip155Accounts.forEach((acc: string) => {
                const parts = acc.split(":");
                const address = parts[parts.length - 1];
                if (address) {
                  uniqueAddresses.add(address);
                }
              });
              providerAccounts = Array.from(uniqueAddresses);
              console.log(
                "✅ Extracted accounts from session:",
                providerAccounts,
              );
            }
          } catch (e) {
            console.warn("⚠️ Failed to extract accounts from session:", e);
          }
        }

        if (!providerAccounts || providerAccounts.length === 0) {
          console.log("⚠️ No accounts in WalletConnect session");
          throw new Error(
            "No accounts found in WalletConnect session. Please reconnect your wallet.",
          );
        }

        console.log("✅ Using accounts:", providerAccounts);

        // Check if we're on the correct network
        const targetChainId = parseInt(
          process.env.EXPO_PUBLIC_CHAIN_ID || "31337",
          10,
        );
        const currentChainId = Number(provider.chainId);
        console.log("🔵 Target chain ID:", targetChainId);
        console.log("🔵 Current chain ID:", currentChainId);
        console.log(
          "🔵 Target chain ID (hex):",
          `0x${targetChainId.toString(16)}`,
        );

        // Skip network switch if already on target chain or if it's Monad testnet
        // The WalletConnect internal chain switch has bugs that crash the app
        if (currentChainId !== targetChainId && currentChainId !== 10143) {
          console.log(
            `⚠️ Wrong network! Current: ${currentChainId}, Target: ${targetChainId}`,
          );
          console.log("🔵 Attempting network switch (may fail gracefully)...");

          // Wrap in try-catch - WalletConnect has internal bugs with chain switching
          try {
            await switchToCorrectNetwork(provider, targetChainId);
          } catch (switchErr) {
            console.warn(
              "⚠️ Network switch failed (continuing anyway):",
              switchErr,
            );
            // Alert user but don't block the transaction
            Alert.alert(
              "Network Notice",
              `Please ensure MetaMask is set to the correct network (Chain ID: ${targetChainId}).\n\nThe transaction will proceed - please check your wallet.`,
              [{ text: "OK" }],
            );
          }
        } else {
          const networkName =
            currentChainId === 10143
              ? "Monad testnet"
              : targetChainId === 31337
                ? "Anvil local"
                : "Target network";
          console.log(`✅ Already on correct network (${networkName})`);
        }

        console.log("📤 Preparing transaction to:", to);

        // Log complete transaction details for debugging
        logTransactionDetails(
          "WalletConnect Transaction",
          to,
          data,
          effectiveAddress,
        );

        // WalletConnect will automatically deep link to MetaMask when needed
        // Don't manually open MetaMask here as it causes app reload and disconnection
        console.log("🔵 Sending eth_sendTransaction request...");
        console.log(
          "📱 WalletConnect will open MetaMask automatically for approval",
        );

        // Use the account from the session/provider, fallback to effectiveAddress
        const fromAddress = providerAccounts[0] || effectiveAddress;
        const txParams: Record<string, string> = {
          from: fromAddress,
          to: to,
          data: data || "0x",
        };

        // Add value if specified (for MON transfers)
        if (value) {
          txParams.value = value;
          console.log("  - Including value:", value);
        }
        console.log(
          "  - Transaction params:",
          JSON.stringify(txParams, null, 2),
        );

        console.log("⏳ Requesting transaction approval...");

        // Open MetaMask BEFORE making the request so user sees the confirmation
        console.log("📱 Opening MetaMask for transaction approval...");
        try {
          await Linking.openURL("metamask://");
          // Give MetaMask time to come to foreground
          await new Promise((resolve) => setTimeout(resolve, 1500));
        } catch (err) {
          console.log("⚠️ Could not open MetaMask automatically:", err);
        }

        // Send transaction - WalletConnect v2 may need explicit chainId for some chains
        // Try with chainId first, fallback without
        let txHash: string | null = null;

        try {
          // First try: eth_sendTransaction with chainId in request
          console.log("📤 Attempting eth_sendTransaction...");
          txHash = await Promise.race([
            provider.request({
              method: "eth_sendTransaction",
              params: [txParams],
            }),
            new Promise<string>((_, reject) =>
              setTimeout(() => reject(new Error("Transaction timeout")), 120000)
            ),
          ]) as string;
          console.log("✅ Transaction request accepted by provider");
        } catch (firstError: any) {
          console.log("⚠️ First attempt failed:", firstError?.message);

          // If the error is about chainId, try using the session's RPC directly
          if (firstError?.message?.includes("chainId") || firstError?.message?.includes("Missing or invalid")) {
            console.log("📤 Retrying with session RPC...");
            try {
              // Try using the provider's internal signer if available
              const accounts = providerAccounts[0] || effectiveAddress;

              // Some WalletConnect sessions need the chain specified differently
              // Try adding chainId directly to the txParams
              const txParamsWithChain = {
                ...txParams,
                chainId: "0x279f", // 10143 in hex
              };

              txHash = await Promise.race([
                provider.request({
                  method: "eth_sendTransaction",
                  params: [txParamsWithChain],
                }),
                new Promise<string>((_, reject) =>
                  setTimeout(() => reject(new Error("Transaction timeout")), 120000)
                ),
              ]) as string;
              console.log("✅ Second attempt succeeded!");
            } catch (secondError: any) {
              console.error("❌ Second attempt also failed:", secondError?.message);
              throw firstError; // Throw original error
            }
          } else {
            throw firstError;
          }
        }

        if (txHash) {
          console.log("✅ Transaction approved and sent successfully!");
          console.log("  - TX Hash:", txHash);
          return txHash;
        } else {
          throw new Error("No transaction hash returned");
        }
      } catch (err) {
        console.log("❌ Transaction error:", err);
        console.log("  - Error type:", typeof err);
        console.log(
          "  - Error message:",
          err instanceof Error ? err.message : "Unknown",
        );
        console.log("  - Full error:", JSON.stringify(err, null, 2));

        const errorMessage =
          err instanceof Error ? err.message : "Failed to send transaction";
        const errorCode = (err as any)?.code;

        // Check for user rejection - don't set as error state, just log
        if (
          errorCode === 4001 ||
          errorCode === 5000 ||
          errorMessage.includes("User denied") ||
          errorMessage.includes("User rejected") ||
          errorMessage.includes("User cancelled")
        ) {
          console.log("ℹ️ User cancelled the transaction");
          return null;
        }

        // Check for session/connection errors
        if (
          errorMessage.includes("not active") ||
          errorMessage.includes("not connected") ||
          errorMessage.includes("No accounts")
        ) {
          setError("Wallet session expired. Please reconnect your wallet.");
        } else {
          setError(errorMessage);
        }

        console.error("Send transaction error:", err);
        return null;
      }
    },
    [address, walletAddress],
  );

  return {
    address: address || walletAddress || null,
    isConnected: wagmiConnected || isAuthenticated,
    isConnecting: isPending || isConnectingWC,
    error,
    walletClient: walletClient || null,
    connect,
    disconnect,
    signMessage,
    sendTransaction,
  };
}

/**
 * Helper function to switch to Monad testnet
 * Extracted to ensure it completes before transactions
 */
async function switchToCorrectNetwork(
  provider: any,
  targetChainId: number,
): Promise<void> {
  const networkName = targetChainId === 31337 ? "Anvil local" : "Monad testnet";
  console.log(`🔵 Starting network switch to ${networkName}...`);
  console.log("📱 Opening MetaMask for network switch approval!");

  // Open MetaMask before requesting the switch
  try {
    await Linking.openURL("metamask://");
    console.log("✅ MetaMask app opened");
    // Give MetaMask time to open and come to foreground
    await new Promise((resolve) => setTimeout(resolve, 1000));
  } catch (err) {
    console.log("⚠️ Could not open MetaMask:", err);
  }

  try {
    console.log("🔵 Sending wallet_switchEthereumChain request...");
    console.log("   Chain ID:", `0x${targetChainId.toString(16)}`);

    const result = await Promise.race([
      provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      }),
      new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error("Network switch timeout - please approve in MetaMask"),
            ),
          60000,
        ),
      ),
    ]);

    console.log("✅ Network switch request completed:", result);

    // Wait for the switch to propagate
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Verify the switch succeeded
    const newChainId = Number(provider.chainId);
    console.log("🔵 Verifying new chain ID:", newChainId);

    if (newChainId !== targetChainId) {
      throw new Error(
        `Network switch verification failed. Current: ${newChainId}, Expected: ${targetChainId}`,
      );
    }

    console.log(`✅ Successfully switched to ${networkName}!`);
  } catch (switchError: any) {
    console.log("❌ Network switch error:", switchError);
    console.log("  - Error code:", switchError.code);
    console.log("  - Error message:", switchError.message);

    // Error 4902 means the chain hasn't been added to MetaMask yet
    // Also try adding for any "not approved" or WalletConnect-specific errors
    const shouldTryAddChain =
      switchError.code === 4902 ||
      switchError.message?.includes("not approved") ||
      switchError.message?.includes("wallet does not support") ||
      switchError.message?.includes("Failed to switch");

    if (shouldTryAddChain) {
      console.log(
        `🔵 ${networkName} not in wallet or switch failed, trying to add it...`,
      );

      // MetaMask mobile cannot connect to localhost - show helpful error
      if (targetChainId === 31337) {
        console.error("❌ Cannot add Anvil local network to MetaMask mobile");
        throw new Error(
          "MetaMask mobile cannot connect to localhost.\n\n" +
          "Solutions:\n" +
          "1. Use MetaMask browser extension instead\n" +
          "2. Deploy contracts to Monad testnet\n" +
          "3. Expose Anvil via ngrok and use that URL",
        );
      }

      console.log("📱 Please approve adding the network in MetaMask");

      // Open MetaMask again for adding the network
      try {
        await Linking.openURL("metamask://");
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (err) {
        console.log("⚠️ Could not open MetaMask:", err);
      }

      // Prepare network parameters (only for non-localhost networks)
      const networkParams = {
        chainId: `0x${targetChainId.toString(16)}`,
        chainName: "Monad Testnet",
        nativeCurrency: {
          name: "Monad",
          symbol: "MON",
          decimals: 18,
        },
        rpcUrls: ["https://testnet-rpc.monad.xyz"],
        blockExplorerUrls: ["https://testnet.monadexplorer.com"],
      };

      try {
        const addResult = await Promise.race([
          provider.request({
            method: "wallet_addEthereumChain",
            params: [networkParams],
          }),
          new Promise((_, reject) =>
            setTimeout(
              () =>
                reject(
                  new Error("Add network timeout - please approve in MetaMask"),
                ),
              60000,
            ),
          ),
        ]);

        console.log("✅ Network added:", addResult);
        console.log(`✅ ${networkName} added and switched!`);

        // Wait for the add to complete
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Verify again
        const finalChainId = Number(provider.chainId);
        if (finalChainId !== targetChainId) {
          // If verification fails, it might still work - don't throw
          console.warn(
            `⚠️ Chain ID mismatch after add. Current: ${finalChainId}, Expected: ${targetChainId}. Proceeding anyway...`,
          );
        }
      } catch (addError: any) {
        console.error(`❌ Failed to add ${networkName}:`, addError);
        if (addError.code === 4001) {
          throw new Error("Network addition cancelled by user");
        }
        // If add also fails, provide helpful guidance
        throw new Error(
          `Could not switch to ${networkName}.\n\n` +
          "Please manually add Monad Testnet to your wallet:\n" +
          "• Chain ID: 10143\n" +
          "• RPC: https://testnet-rpc.monad.xyz\n" +
          "• Symbol: MON",
        );
      }
    } else if (switchError.code === 4001) {
      // User rejected the network switch
      console.log("ℹ️ User cancelled network switch");
      throw new Error("Network switch cancelled by user");
    } else {
      // For other errors, log warning but don't block - proceed anyway
      console.warn(
        "⚠️ Network switch failed, but proceeding anyway:",
        switchError.message,
      );
      console.log("💡 Tip: If transaction fails, manually add Monad Testnet:");
      console.log("   Chain ID: 10143");
      console.log("   RPC: https://testnet-rpc.monad.xyz");
      // Don't throw - let the transaction attempt proceed
      // The transaction might still work if the wallet is already on the right network
    }
  }
}
