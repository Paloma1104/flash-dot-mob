import { useDropStore } from '@/stores/dropStore';
import type { Drop } from '@/types/drop';
import { calculateDistanceMeters, generateMockDrops } from '@/utils/geo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

// Query keys
export const dropKeys = {
  all: ['drops'] as const,
  list: (lat: number, lng: number, radius: number) =>
    [...dropKeys.all, 'list', lat, lng, radius] as const,
  detail: (id: string) => [...dropKeys.all, 'detail', id] as const,
};

interface FetchDropsParams {
  latitude: number;
  longitude: number;
  radiusKm?: number;
}

/**
 * Fetch drops near a location
 * TODO: Replace with actual API call
 */
async function fetchDrops({ latitude, longitude, radiusKm = 0.5 }: FetchDropsParams): Promise<Drop[]> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // For now, generate mock drops
  // In production, this would be: return api.get(`/drops?lat=${latitude}&lng=${longitude}&radius=${radiusKm}`);
  const geoJSON = generateMockDrops(latitude, longitude, 50, radiusKm);
  return geoJSON.features.map((f) => f.properties);
}

/**
 * Hook for fetching drops near a location
 */
export function useDrops(latitude: number | null, longitude: number | null) {
  const setDrops = useDropStore((state) => state.setDrops);
  const cachedDrops = useDropStore((state) => state.drops);

  return useQuery({
    queryKey: dropKeys.list(latitude ?? 0, longitude ?? 0, 0.5),
    queryFn: async () => {
      if (latitude === null || longitude === null) {
        return cachedDrops; // Return cached drops if no location
      }
      const drops = await fetchDrops({ latitude, longitude });
      setDrops(drops); // Update Zustand store
      return drops;
    },
    enabled: latitude !== null && longitude !== null,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
    // Return cached data while fetching
    placeholderData: cachedDrops.length > 0 ? cachedDrops : undefined,
  });
}

/**
 * Hook for finding the nearest claimable drop
 */
export function useNearestDrop(
  userLat: number | null,
  userLng: number | null,
  claimRangeMeters: number = 50
) {
  const drops = useDropStore((state) => state.drops);
  const setNearbyDrop = useDropStore((state) => state.setNearbyDrop);

  // Calculate nearest drop using useMemo (no side effects during render)
  const result = useMemo(() => {
    if (userLat === null || userLng === null || drops.length === 0) {
      return { nearestDrop: null, distance: null, isInRange: false };
    }

    let nearestDrop: Drop | null = null;
    let minDistance = Infinity;

    for (const drop of drops) {
      if (!drop.isActive || drop.claimedBy) continue;

      const distance = calculateDistanceMeters(
        userLat,
        userLng,
        drop.latitude,
        drop.longitude
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestDrop = drop;
      }
    }

    const isInRange = minDistance <= claimRangeMeters;

    return {
      nearestDrop,
      distance: nearestDrop ? minDistance : null,
      isInRange,
    };
  }, [drops, userLat, userLng, claimRangeMeters]);

  // Update store in useEffect (not during render)
  useEffect(() => {
    if (result.isInRange && result.nearestDrop) {
      setNearbyDrop(result.nearestDrop.id);
    } else {
      setNearbyDrop(null);
    }
  }, [result.isInRange, result.nearestDrop, setNearbyDrop]);

  return result;
}

interface ClaimDropParams {
  dropId: string;
  userLat: number;
  userLng: number;
}

/**
 * Claim a drop (mutation)
 * TODO: Replace with actual blockchain transaction
 */
async function claimDrop({ dropId, userLat, userLng }: ClaimDropParams): Promise<{ success: boolean; txHash?: string }> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Simulate 90% success rate
  if (Math.random() > 0.1) {
    return {
      success: true,
      txHash: `0x${Math.random().toString(16).slice(2)}`,
    };
  }

  throw new Error('Transaction failed');
}

/**
 * Hook for claiming a drop
 */
export function useClaimDrop() {
  const queryClient = useQueryClient();
  const markDropClaimed = useDropStore((state) => state.markDropClaimed);

  return useMutation({
    mutationFn: claimDrop,
    onSuccess: (data, variables) => {
      // Update local state
      markDropClaimed(variables.dropId);

      // Invalidate drops query to refetch
      queryClient.invalidateQueries({ queryKey: dropKeys.all });
    },
  });
}

