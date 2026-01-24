import { locationEngine } from "@/src/services/location/locationEngine";
import { checkDeviceIntegrity } from "@/src/services/security/deviceIntegrity";
import { checkVelocity } from "@/src/services/security/velocityCheck";
import { useDropStore } from "@/src/stores/dropStore";
import { useUserStore } from "@/src/stores/userStore";
import * as Haptics from "expo-haptics";
import { useCallback, useState } from "react";
import { useClaimDrop } from "./useBlockchain";
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
  const { claimDrop: claimDropOnChain } = useClaimDrop();

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

        // 7. Call backend to verify GPS and get EIP-712 signature
        const backendUrl =
          process.env.EXPO_PUBLIC_BACKEND_URL || "http://localhost:3001";
        const response = await fetch(`${backendUrl}/api/sign-drop`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dropId,
            claimer: address,
            amount: drop.amount,
            userLat: location.latitude,
            userLon: location.longitude,
            dropLat: drop.latitude,
            dropLon: drop.longitude,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Backend verification failed");
        }

        const { signature, nonce, deadline, dropIdBytes32 } =
          await response.json();

        // 8. Submit blockchain transaction
        const txHash = await claimDropOnChain(
          dropIdBytes32,
          BigInt(drop.amount) * BigInt(10 ** 18), // Convert to wei
          BigInt(deadline),
          signature as `0x${string}`,
        );

        if (!txHash) {
          throw new Error("Blockchain transaction failed");
        }

        // 9. Confirm the optimistic update
        confirmPendingBalance(drop.amount);

        // 10. Success haptic
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );

        const result = { success: true, txHash };
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
      claimDropOnChain,
      revertPendingBalance,
    ],
  );

  return {
    claim,
    isClaiming,
    lastClaimResult,
  };
}
