import { useCallback, useState } from 'react';
import {
  createPublicClient,
  encodeAbiParameters,
  encodeFunctionData,
  formatUnits,
  http,
  keccak256,
  parseAbiParameters
} from 'viem';

import { DROP_CLAIMER_ABI, ERC20_ABI } from '@/services/blockchain/abis';
import { contracts, monadTestnet } from '@/services/blockchain/config';

// Create public client for reading
const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http(),
});

// Interfaces
interface ClaimParams {
  dropId: string;
  amount: bigint;
  latitude: number; // Will be multiplied by 1e6
  longitude: number; // Will be multiplied by 1e6
  timestamp: number;
  nonce: bigint;
  signature: `0x${string}`;
}

interface ClaimResult {
  success: boolean;
  txHash?: `0x${string}`;
  error?: string;
}

/**
 * Hook for interacting with Flash.Mob smart contracts
 */
export function useContract() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Check if a drop has been claimed on-chain
   */
  const isDropClaimed = useCallback(async (dropId: string): Promise<boolean> => {
    if (!contracts.flashMob) {
      console.warn('Drop claimer contract not configured');
      return false;
    }

    try {
      const dropIdBytes = keccak256(encodeAbiParameters(
        parseAbiParameters('string'),
        [dropId]
      ));

      const claimed = await publicClient.readContract({
        address: contracts.dropClaimer,
        abi: DROP_CLAIMER_ABI,
        functionName: 'isDropClaimed',
        args: [dropIdBytes],
      });

      return claimed as boolean;
    } catch (err) {
      console.error('Error checking drop claim status:', err);
      return false;
    }
  }, []);

  /**
   * Get user's nonce for replay protection
   */
  const getNonce = useCallback(async (userAddress: `0x${string}`): Promise<bigint> => {
    if (!contracts.flashMob) {
      return 0n;
    }

    try {
      const nonce = await publicClient.readContract({
        address: contracts.dropClaimer,
        abi: DROP_CLAIMER_ABI,
        functionName: 'getNonce',
        args: [userAddress],
      });

      return nonce as bigint;
    } catch (err) {
      console.error('Error getting nonce:', err);
      return 0n;
    }
  }, []);

  /**
   * Get token balance for a user
   */
  const getTokenBalance = useCallback(async (userAddress: `0x${string}`): Promise<string> => {
    if (!contracts.token) {
      return '0';
    }

    try {
      const balance = await publicClient.readContract({
        address: contracts.token,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [userAddress],
      });

      return formatUnits(balance as bigint, 18);
    } catch (err) {
      console.error('Error getting token balance:', err);
      return '0';
    }
  }, []);

  /**
   * Get contract pool balance
   */
  const getPoolBalance = useCallback(async (): Promise<string> => {
    if (!contracts.flashMob) {
      return '0';
    }

    try {
      const balance = await publicClient.readContract({
        address: contracts.dropClaimer,
        abi: DROP_CLAIMER_ABI,
        functionName: 'getBalance',
      });

      return formatUnits(balance as bigint, 18);
    } catch (err) {
      console.error('Error getting pool balance:', err);
      return '0';
    }
  }, []);

  /**
   * Encode claim transaction data (for gasless claiming via relayer)
   */
  const encodeClaimData = useCallback((params: ClaimParams): `0x${string}` => {
    const dropIdBytes = keccak256(encodeAbiParameters(
      parseAbiParameters('string'),
      [params.dropId]
    ));

    // Convert lat/lng to int256 (multiply by 1e6 for precision)
    const latInt = BigInt(Math.round(params.latitude * 1e6));
    const lngInt = BigInt(Math.round(params.longitude * 1e6));

    return encodeFunctionData({
      abi: DROP_CLAIMER_ABI,
      functionName: 'claimDrop',
      args: [
        dropIdBytes,
        params.amount,
        latInt,
        lngInt,
        BigInt(params.timestamp),
        params.nonce,
        params.signature,
      ],
    });
  }, []);

  /**
   * Create claim message hash (for backend to sign)
   */
  const createClaimMessageHash = useCallback((
    dropId: string,
    userAddress: `0x${string}`,
    amount: bigint,
    latitude: number,
    longitude: number,
    timestamp: number,
    nonce: bigint,
    chainId: number
  ): `0x${string}` => {
    const dropIdBytes = keccak256(encodeAbiParameters(
      parseAbiParameters('string'),
      [dropId]
    ));

    const latInt = BigInt(Math.round(latitude * 1e6));
    const lngInt = BigInt(Math.round(longitude * 1e6));

    return keccak256(encodeAbiParameters(
      parseAbiParameters('bytes32,address,uint256,int256,int256,uint256,uint256,uint256'),
      [dropIdBytes, userAddress, amount, latInt, lngInt, BigInt(timestamp), nonce, BigInt(chainId)]
    ));
  }, []);

  return {
    isLoading,
    error,
    isDropClaimed,
    getNonce,
    getTokenBalance,
    getPoolBalance,
    encodeClaimData,
    createClaimMessageHash,
  };
}

