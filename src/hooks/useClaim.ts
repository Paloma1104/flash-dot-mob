import { locationEngine } from "@/services/location/locationEngine";
import { checkDeviceIntegrity } from "@/services/security/deviceIntegrity";
import { checkVelocity } from "@/services/security/velocityCheck";
import { useDropStore } from "@/stores/dropStore";
import { useUserStore } from "@/stores/userStore";
import * as Haptics from "expo-haptics";
import { useCallback, useState } from "react";
import { useWallet } from "./useWallet";

interface ClaimResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

interface UseClaimReturn {
  claim: (dropId: string) => Promise<ClaimResult>;
  isClaiming: boolean;
  lastClaimResult: ClaimResult | null;
}

/**
 * Hook for handling drop claims with optimistic UI updates
 */
export function useClaim(): UseClaimReturn {
  const [isClaiming, setIsClaiming] = useState(false);
  const [lastClaimResult, setLastClaimResult] = useState<ClaimResult | null>(
    null,
  );

  const { address, isConnected } = useWallet();
  const { addPendingBalance, confirmPendingBalance, revertPendingBalance } =
    useUserStore();
  const { drops, markDropClaimed, setNearbyDrop } = useDropStore();

  const claim = useCallback(
    async (dropId: string): Promise<ClaimResult> => {
      if (!isConnected || !address) {
        const result = { success: false, error: "Wallet not connected" };
        setLastClaimResult(result);
        return result;
      }

      // Find the drop
      const drop = drops.find((d) => d.id === dropId);
      if (!drop) {
        const result = { success: false, error: "Drop not found" };
        setLastClaimResult(result);
        return result;
      }

      setIsClaiming(true);

      try {
        // 1. Check device integrity (anti-cheat)
        const deviceCheck = await checkDeviceIntegrity();
        if (!deviceCheck.passed) {
          throw new Error(
            `Device integrity check failed: ${deviceCheck.blockers.join(", ")}`,
          );
        }

        // 2. Enable high-accuracy GPS for claim verification
        await locationEngine.enableHighAccuracyMode();

        // 3. Get precise location
        const location = await locationEngine.getCurrentLocation();
        if (!location) {
          throw new Error("Could not get location");
        }

        // 4. Verify velocity (anti-cheat: detect teleportation)
        const velocityCheck = checkVelocity(
          address,
          {
            latitude: location.latitude,
            longitude: location.longitude,
            timestamp: Date.now(),
            accuracy: location.accuracy || null,
          },
          "walking", // Max allowed speed for claiming
        );

        if (!velocityCheck.passed) {
          throw new Error(
            `Velocity check failed: ${velocityCheck.reason || "Moving too fast"}`,
          );
        }

        // 5. Haptic feedback - claim initiated
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        // 6. Optimistic UI update
        addPendingBalance(drop.amount);
        markDropClaimed(dropId);

        // Simulate backend delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // TODO: Implement backend integration for drop claims similar to game credits
        // For now we will support it via optimistic UI only or fail

        // 9. Confirm the optimistic update
        confirmPendingBalance(drop.amount);

        // 10. Success haptic
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );

        const result = { success: true, txHash: "off-chain-claim" };
        setLastClaimResult(result);
        return result;
      } catch (err) {
        // Revert optimistic update
        revertPendingBalance();

        // Error haptic
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

        const result = {
          success: false,
          error: err instanceof Error ? err.message : "Claim failed",
        };
        setLastClaimResult(result);
        return result;
      } finally {
        setIsClaiming(false);
        // Switch back to battery-saving mode
        await locationEngine.disableHighAccuracyMode();
      }
    },
    [
      isConnected,
      address,
      drops,
      addPendingBalance,
      markDropClaimed,
      confirmPendingBalance,
      revertPendingBalance,
    ],
  );

  return {
    claim,
    isClaiming,
    lastClaimResult,
  };
}
