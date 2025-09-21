import { ChainConfig, ChillMoneyConfig } from './types'

// CCTP Contract Addresses (Testnet)
export const CHAIN_CONFIGS: Record<string, ChainConfig> = {
  base: {
    id: 'base',
    name: 'Base Sepolia',
    chainId: 84532,
    rpcUrl: 'https://sepolia.base.org',
    usdcAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    tokenMessenger: '0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA',
    messageTransmitter: '0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275',
    domain: 6,
    blockExplorer: 'https://sepolia.basescan.org'
  },
  arbitrum: {
    id: 'arbitrum',
    name: 'Arbitrum Sepolia',
    chainId: 421614,
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    usdcAddress: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
    tokenMessenger: '0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA',
    messageTransmitter: '0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275',
    domain: 3,
    blockExplorer: 'https://sepolia.arbiscan.io'
  },
  avalanche: {
    id: 'avalanche',
    name: 'Avalanche Fuji',
    chainId: 43113,
    rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
    usdcAddress: '0x5425890298aed601595a70AB815c96711a31Bc65',
    tokenMessenger: '0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA',
    messageTransmitter: '0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275',
    domain: 1,
    blockExplorer: 'https://testnet.snowtrace.io'
  }
}

// ABI Definitions
export const USDC_ABI = [
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    type: 'function',
    name: 'allowance',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ name: '', type: 'uint256' }]
  }
] as const

export const TOKEN_MESSENGER_ABI = [
  {
    type: 'function',
    name: 'depositForBurn',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'destinationDomain', type: 'uint32' },
      { name: 'mintRecipient', type: 'bytes32' },
      { name: 'burnToken', type: 'address' },
      { name: 'destinationCaller', type: 'bytes32' },
      { name: 'maxFee', type: 'uint256' },
      { name: 'minFinalityThreshold', type: 'uint32' }
    ],
    outputs: []
  }
] as const

export const MESSAGE_TRANSMITTER_ABI = [
  {
    type: 'function',
    name: 'receiveMessage',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'message', type: 'bytes' },
      { name: 'attestation', type: 'bytes' }
    ],
    outputs: []
  }
] as const

// Default Configuration
export const DEFAULT_CONFIG: Required<ChillMoneyConfig> = {
  baseRpcUrl: 'https://sepolia.base.org',
  arbitrumRpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
  avalancheRpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
  attestationApiUrl: 'https://iris-api-sandbox.circle.com/v2/messages',
  maxRetries: 60, // 5 minutes with 5s intervals
  retryDelay: 5000 // 5 seconds
}

// Error Messages
export const ERROR_MESSAGES = {
  INVALID_CHAIN: 'Unsupported source chain. Only Base and Arbitrum are supported.',
  INVALID_ADDRESS: 'Invalid recipient address format.',
  INSUFFICIENT_BALANCE: 'Insufficient USDC balance for transfer.',
  INSUFFICIENT_ALLOWANCE: 'Insufficient USDC allowance. Please approve first.',
  TRANSFER_FAILED: 'USDC transfer failed.',
  ATTESTATION_TIMEOUT: 'Attestation timeout. Please try recovery.',
  INVALID_ATTESTATION: 'Invalid attestation data received.',
  NETWORK_SWITCH_FAILED: 'Failed to switch to destination network.',
  RECOVERY_FAILED: 'Recovery failed. Invalid burn transaction or attestation.'
} as const
