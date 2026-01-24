import {
    createPublicClient,
    createWalletClient,
    encodeAbiParameters,
    http,
    keccak256,
    parseAbiParameters,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

import { monadTestnet } from './config';

/**
 * Off-chain Signature Generator
 * 
 * Runs on backend/relayer to generate signatures that authorize claims.
 * This keeps GPS verification and rate limiting off-chain while
 * maintaining on-chain security through signatures.
 * 
 * Security Model:
 * ┌─────────────────────────────────────────────────────────────┐
 * │  User's Phone          Backend/Relayer         Blockchain   │
 * │  ─────────────         ───────────────         ──────────   │
 * │  1. GPS check    ───►  2. Verify location                   │
 * │                        3. Rate limit check                  │
 * │                        4. Generate signature  ───►  5. Verify│
 * │  6. Submit tx    ◄───  (or gasless relay)    ───►  7. Claim │
 * └─────────────────────────────────────────────────────────────┘
 */

// EIP-712 domain for FlashMobV2
const DOMAIN = {
  name: 'FlashMob',
  version: '2',
  chainId: monadTestnet.id,
  verifyingContract: process.env.EXPO_PUBLIC_DROP_CLAIMER_ADDRESS as `0x${string}`,
} as const;

// EIP-712 types
const CLAIM_TYPES = {
  Claim: [
    { name: 'dropId', type: 'bytes32' },
    { name: 'claimer', type: 'address' },
    { name: 'amount', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ],
} as const;

interface ClaimData {
  dropId: string;
  claimer: `0x${string}`;
  amount: bigint;
  nonce: bigint;
  deadline: number;
}

interface GpsData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

interface DropData {
  dropId: string;
  latitude: number;
  longitude: number;
  radius: number; // meters
  amount: bigint;
  expiresAt: number;
}

/**
 * Backend Signing Service
 * This would run on your server, NOT in the mobile app
 */
export class SigningService {
  private signerAccount: ReturnType<typeof privateKeyToAccount>;
  private walletClient: ReturnType<typeof createWalletClient>;

  constructor(privateKey: `0x${string}`) {
    this.signerAccount = privateKeyToAccount(privateKey);
    this.walletClient = createWalletClient({
      account: this.signerAccount,
      chain: monadTestnet,
      transport: http(),
    });
  }

  /**
   * Verify GPS location is within drop radius
   */
  verifyLocation(userGps: GpsData, drop: DropData): boolean {
    // Haversine formula for distance
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRad(drop.latitude - userGps.latitude);
    const dLng = this.toRad(drop.longitude - userGps.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(userGps.latitude)) *
        Math.cos(this.toRad(drop.latitude)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    // Add GPS accuracy tolerance
    const effectiveRadius = drop.radius + (userGps.accuracy || 0);

    return distance <= effectiveRadius;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Generate EIP-712 signature for a claim
   */
  async signClaim(claim: ClaimData): Promise<`0x${string}`> {
    const dropIdBytes = this.stringToBytes32(claim.dropId);

    const signature = await this.walletClient.signTypedData({
      account: this.signerAccount,
      domain: {
        ...DOMAIN,
        chainId: DOMAIN.chainId,
      },
      types: CLAIM_TYPES,
      primaryType: 'Claim',
      message: {
        dropId: dropIdBytes,
        claimer: claim.claimer,
        amount: claim.amount,
        nonce: claim.nonce,
        deadline: BigInt(claim.deadline),
      },
    });

    return signature;
  }

  /**
   * Full claim authorization flow
   */
  async authorizeClaimV2(
    userAddress: `0x${string}`,
    userGps: GpsData,
    drop: DropData,
    userNonce: bigint
  ): Promise<{ signature: `0x${string}`; deadline: number } | { error: string }> {
    // 1. Check drop hasn't expired
    if (Date.now() > drop.expiresAt) {
      return { error: 'Drop has expired' };
    }

    // 2. Verify GPS location
    if (!this.verifyLocation(userGps, drop)) {
      return { error: 'Not within drop radius' };
    }

    // 3. Rate limiting would go here
    // await this.checkRateLimit(userAddress);

    // 4. Generate signature
    const deadline = Math.floor(Date.now() / 1000) + 300; // 5 min expiry
    const signature = await this.signClaim({
      dropId: drop.dropId,
      claimer: userAddress,
      amount: drop.amount,
      nonce: userNonce,
      deadline,
    });

    return { signature, deadline };
  }

  /**
   * Convert string to bytes32
   */
  private stringToBytes32(str: string): `0x${string}` {
    if (str.startsWith('0x') && str.length === 66) {
      return str as `0x${string}`;
    }
    return keccak256(encodeAbiParameters(parseAbiParameters('string'), [str]));
  }

  /**
   * Get signer address
   */
  getSignerAddress(): `0x${string}` {
    return this.signerAccount.address;
  }
}

/**
 * Relayer Service for Gasless Claims
 * Submits transactions on behalf of users
 */
export class RelayerService {
  private walletClient: ReturnType<typeof createWalletClient>;
  private publicClient: ReturnType<typeof createPublicClient>;
  private signingService: SigningService;

  constructor(privateKey: `0x${string}`) {
    const account = privateKeyToAccount(privateKey);
    
    this.walletClient = createWalletClient({
      account,
      chain: monadTestnet,
      transport: http(),
    });
    
    this.publicClient = createPublicClient({
      chain: monadTestnet,
      transport: http(),
    });
    
    this.signingService = new SigningService(privateKey);
  }

  /**
   * Execute gasless claim on behalf of user
   */
  async executeGaslessClaim(
    claimer: `0x${string}`,
    dropId: string,
    amount: bigint,
    userSignature: `0x${string}`,
    userNonce: bigint
  ): Promise<{ txHash: `0x${string}` } | { error: string }> {
    const deadline = Math.floor(Date.now() / 1000) + 300;
    
    // Generate relayer signature
    const relayerSignature = await this.signingService.signClaim({
      dropId,
      claimer,
      amount,
      nonce: userNonce,
      deadline,
    });

    const dropIdBytes = keccak256(encodeAbiParameters(
      parseAbiParameters('string'),
      [dropId]
    ));

    try {
      // This would call the contract's claimGasless function
      // Relayer pays gas, user gets tokens
      
      // const txHash = await this.walletClient.writeContract({...});
      
      return { txHash: '0x...' as `0x${string}` };
    } catch (err) {
      return { error: (err as Error).message };
    }
  }
}

// Export for backend use
export { CLAIM_TYPES, DOMAIN };

