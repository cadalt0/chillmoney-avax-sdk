import { formatUnits, parseUnits } from 'viem'
import { ChainConfig } from './types'

/**
 * Convert address to bytes32 format for CCTP
 */
export function toBytes32(address: string): `0x${string}` {
  return `0x${address.replace(/^0x/, '').padStart(64, '0')}` as `0x${string}`
}

/**
 * Format USDC amount for display (6 decimals)
 */
export function formatUSDC(amount: bigint): string {
  return formatUnits(amount, 6)
}

/**
 * Parse USDC amount from string (6 decimals)
 */
export function parseUSDC(amount: string): bigint {
  return parseUnits(amount, 6)
}

/**
 * Format native token amount for display (18 decimals)
 */
export function formatNative(amount: bigint): string {
  return formatUnits(amount, 18)
}

/**
 * Validate Ethereum address format
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

/**
 * Validate chain ID
 */
export function isValidChainId(chainId: number): boolean {
  return [84532, 421614, 43113].includes(chainId)
}

/**
 * Get chain name from chain ID
 */
export function getChainName(chainId: number): string {
  const chainMap: Record<number, string> = {
    84532: 'Base Sepolia',
    421614: 'Arbitrum Sepolia',
    43113: 'Avalanche Fuji'
  }
  return chainMap[chainId] || 'Unknown'
}

/**
 * Calculate transfer fees
 */
export function calculateFees(
  sourceGasUsed: bigint,
  destinationGasUsed: bigint,
  gasPrice: bigint
): { sourceChain: bigint; destinationChain: bigint; total: bigint } {
  const sourceFee = sourceGasUsed * gasPrice
  const destinationFee = destinationGasUsed * gasPrice
  return {
    sourceChain: sourceFee,
    destinationChain: destinationFee,
    total: sourceFee + destinationFee
  }
}

/**
 * Sleep utility for polling
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Retry utility with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      if (i < maxRetries - 1) {
        await sleep(delay * Math.pow(2, i))
      }
    }
  }
  
  throw lastError!
}

/**
 * Get explorer URL for transaction
 */
export function getExplorerUrl(chainConfig: ChainConfig, txHash: string): string {
  return `${chainConfig.blockExplorer}/tx/${txHash}`
}

/**
 * Validate transfer parameters
 */
export function validateTransferParams(params: {
  amount: bigint
  recipient: string
  sourceChain: string
  userAddress: string
}): void {
  if (params.amount <= 0) {
    throw new Error('Amount must be greater than 0')
  }
  
  if (!isValidAddress(params.recipient)) {
    throw new Error('Invalid recipient address')
  }
  
  if (!isValidAddress(params.userAddress)) {
    throw new Error('Invalid user address')
  }
  
  if (!['base', 'arbitrum'].includes(params.sourceChain)) {
    throw new Error('Invalid source chain. Only base and arbitrum are supported.')
  }
}

/**
 * Format error message with context
 */
export function formatError(error: unknown, context: string): string {
  const message = error instanceof Error ? error.message : String(error)
  return `[ChillMoney SDK - ${context}] ${message}`
}
