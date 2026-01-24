import { concat, encodeAbiParameters, keccak256, parseAbiParameters } from 'viem';

/**
 * Merkle Tree Builder for Batch Claims
 * 
 * Off-chain component that builds Merkle trees for gas-efficient batch claiming.
 * 
 * Flow:
 * 1. Backend collects all active drops for an epoch
 * 2. Builds Merkle tree with [dropId, claimer, amount] leaves
 * 3. Stores root on-chain via setMerkleRoot()
 * 4. User requests proof from backend
 * 5. User submits claimBatch() with proofs
 */

export interface MerkleLeaf {
  dropId: `0x${string}`;
  claimer: `0x${string}`;
  amount: bigint;
}

export interface MerkleTreeResult {
  root: `0x${string}`;
  leaves: MerkleLeaf[];
  proofs: Map<string, `0x${string}`[]>;
}

/**
 * Hash a leaf for the Merkle tree
 */
function hashLeaf(leaf: MerkleLeaf): `0x${string}` {
  return keccak256(encodeAbiParameters(
    parseAbiParameters('bytes32,address,uint256'),
    [leaf.dropId, leaf.claimer, leaf.amount]
  ));
}

/**
 * Get the key for a leaf (for proof lookup)
 */
function getLeafKey(leaf: MerkleLeaf): string {
  return `${leaf.dropId}-${leaf.claimer}`;
}

/**
 * Build a Merkle tree from leaves
 */
export function buildMerkleTree(leaves: MerkleLeaf[]): MerkleTreeResult {
  if (leaves.length === 0) {
    throw new Error('Cannot build tree with no leaves');
  }

  // Hash all leaves
  const hashedLeaves = leaves.map(hashLeaf);
  
  // Build tree levels (bottom-up)
  const tree: `0x${string}`[][] = [hashedLeaves];
  
  while (tree[tree.length - 1]!.length > 1) {
    const currentLevel = tree[tree.length - 1]!;
    const nextLevel: `0x${string}`[] = [];
    
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i]!;
      const right = currentLevel[i + 1] ?? left; // Duplicate if odd
      
      // Sort for deterministic ordering
      const [first, second] = left < right ? [left, right] : [right, left];
      
      nextLevel.push(keccak256(concat([first, second])));
    }
    
    tree.push(nextLevel);
  }
  
  const root = tree[tree.length - 1]![0]!;
  
  // Generate proofs for each leaf
  const proofs = new Map<string, `0x${string}`[]>();
  
  for (let leafIndex = 0; leafIndex < leaves.length; leafIndex++) {
    const proof: `0x${string}`[] = [];
    let index = leafIndex;
    
    for (let level = 0; level < tree.length - 1; level++) {
      const currentLevel = tree[level]!;
      const isRightNode = index % 2 === 1;
      const siblingIndex = isRightNode ? index - 1 : index + 1;
      
      if (siblingIndex < currentLevel.length) {
        proof.push(currentLevel[siblingIndex]!);
      }
      
      index = Math.floor(index / 2);
    }
    
    proofs.set(getLeafKey(leaves[leafIndex]!), proof);
  }
  
  return { root, leaves, proofs };
}

/**
 * Verify a Merkle proof
 */
export function verifyProof(
  root: `0x${string}`,
  leaf: MerkleLeaf,
  proof: `0x${string}`[]
): boolean {
  let computedHash = hashLeaf(leaf);
  
  for (const proofElement of proof) {
    const [first, second] = computedHash < proofElement 
      ? [computedHash, proofElement] 
      : [proofElement, computedHash];
    
    computedHash = keccak256(concat([first, second]));
  }
  
  return computedHash === root;
}

/**
 * Get proof for a specific leaf
 */
export function getProof(
  tree: MerkleTreeResult,
  dropId: `0x${string}`,
  claimer: `0x${string}`
): `0x${string}`[] | null {
  const key = `${dropId}-${claimer}`;
  return tree.proofs.get(key) ?? null;
}

// Example usage:
/*
const drops: MerkleLeaf[] = [
  { dropId: '0x...', claimer: '0x...', amount: 100n * 10n ** 18n },
  { dropId: '0x...', claimer: '0x...', amount: 50n * 10n ** 18n },
];

const tree = buildMerkleTree(drops);
console.log('Root:', tree.root);

// Store root on-chain
await contract.setMerkleRoot(tree.root);

// User claims with proof
const proof = getProof(tree, dropId, userAddress);
await contract.claimBatch(epoch, [dropId], [amount], [proof]);
*/
