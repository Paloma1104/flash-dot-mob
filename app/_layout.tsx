import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";
import { WagmiProvider } from "wagmi";
import "../global.css";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { AchievementToast } from "@/components/ui/AchievementToast";
import { wagmiConfig } from "@/config/wagmi";
import { initAPTokenService } from "@/services/blockchain/apTokenService";
import { initFlashMobService } from "@/services/blockchain/flashMobService";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // Initialize blockchain services on app start
  useEffect(() => {
    const apTokenAddress = process.env
      .EXPO_PUBLIC_AP_TOKEN_ADDRESS as `0x${string}`;
    const gameRewardsAddress = process.env
      .EXPO_PUBLIC_GAME_REWARDS_ADDRESS as `0x${string}`;
    const flashMobAddress = process.env
      .EXPO_PUBLIC_FLASH_MOB_ADDRESS as `0x${string}`;

    console.log("🔵 Blockchain initialization:");
    console.log("  - AP Token Address:", apTokenAddress);
    console.log("  - GameRewards Address:", gameRewardsAddress);
    console.log("  - FlashMob Address:", flashMobAddress);

    if (apTokenAddress && gameRewardsAddress) {
      initAPTokenService(apTokenAddress, gameRewardsAddress);
      console.log("✅ APTokenService initialized");
    } else {
      console.warn("⚠️ APToken or GameRewards address not set in environment");
    }

    if (flashMobAddress) {
      initFlashMobService(flashMobAddress);
      console.log("✅ FlashMobService initialized");
    } else {
      console.warn("⚠️ FlashMob address not set in environment");
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <Stack
            screenOptions={{
              gestureEnabled: true,
              gestureDirection: "horizontal",
              fullScreenGestureEnabled: true,
              animation: "slide_from_right",
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="modal"
              options={{ presentation: "modal", title: "Modal" }}
            />
          </Stack>
          <AchievementToast />
          <StatusBar style="auto" />
        </ThemeProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}

