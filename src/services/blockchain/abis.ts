// ABI for FlashMobDropClaimer contract
// Generated from FlashMobDropClaimer.sol
export const DROP_CLAIMER_ABI = [
  {
    inputs: [
      { name: '_token', type: 'address' },
      { name: '_trustedSigner', type: 'address' },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  // claimDrop function
  {
    inputs: [
      { name: 'dropId', type: 'bytes32' },
      { name: 'amount', type: 'uint256' },
      { name: 'latitude', type: 'int256' },
      { name: 'longitude', type: 'int256' },
      { name: 'timestamp', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'signature', type: 'bytes' },
    ],
    name: 'claimDrop',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // isDropClaimed view
  {
    inputs: [{ name: 'dropId', type: 'bytes32' }],
    name: 'isDropClaimed',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  // getNonce view
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getNonce',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  // getBalance view
  {
    inputs: [],
    name: 'getBalance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'dropId', type: 'bytes32' },
      { indexed: true, name: 'claimer', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
      { indexed: false, name: 'latitude', type: 'int256' },
      { indexed: false, name: 'longitude', type: 'int256' },
      { indexed: false, name: 'timestamp', type: 'uint256' },
    ],
    name: 'DropClaimed',
    type: 'event',
  },
] as const;

// ABI for ERC20 token (minimal)
export const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;
