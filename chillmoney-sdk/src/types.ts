export interface ChainConfig {
  id: string
  name: string
  chainId: number
  rpcUrl: string
  usdcAddress: `0x${string}`
  tokenMessenger: `0x${string}`
  messageTransmitter: `0x${string}`
  domain: number
  blockExplorer: string
}

export interface TransferParams {
  amount: bigint
  recipient: `0x${string}`
  sourceChain: 'base' | 'arbitrum'
  provider: any
  userAddress: `0x${string}`
  onStep?: (step: TransferStep) => void
}

export interface TransferResult {
  burnTxHash: string
  mintTxHash: string
  totalTime: number
  fees: {
    sourceChain: bigint
    destinationChain: bigint
    total: bigint
  }
}

export interface RecoveryParams {
  burnTxHash: string
  sourceChain: 'base' | 'arbitrum'
  provider: any
  userAddress: `0x${string}`
  onStep?: (step: RecoveryStep) => void
}

export interface RecoveryResult {
  mintTxHash: string
  recoveredAmount: bigint
  totalTime: number
}

export type TransferStep = 
  | 'approve'
  | 'burn'
  | 'attestation'
  | 'mint'
  | 'complete'

export type RecoveryStep =
  | 'validate'
  | 'locate'
  | 'prepare'
  | 'execute'
  | 'complete'

export interface FeeEstimate {
  sourceChain: bigint
  destinationChain: bigint
  total: bigint
  usdcAmount: bigint
}

export interface BalanceResult {
  usdc: bigint
  native: bigint
  formatted: {
    usdc: string
    native: string
  }
}

export interface ChillMoneyConfig {
  baseRpcUrl?: string
  arbitrumRpcUrl?: string
  avalancheRpcUrl?: string
  attestationApiUrl?: string
  maxRetries?: number
  retryDelay?: number
}

// Smart Wallet Types
export interface SmartWalletTransferParams {
  smartWalletAddress: `0x${string}`
  amount: bigint
  sourceChain: 'base' | 'arbitrum'
  provider: any
  userAddress: `0x${string}`
  onStep?: (step: TransferStep) => void
}

export interface SmartWalletTransferResult {
  burnTxHash: string
  mintTxHash: string
  totalTime: number
  gasUsed: {
    burn: string
    mint: string
  }
}

export interface SmartContractCallParams {
  contractAddress: `0x${string}`
  functionName: string
  functionAbi: any[]
  args: any[]
  chain: 'base' | 'arbitrum' | 'avalanche'
  provider: any
  userAddress: `0x${string}`
}

export interface SmartContractCallResult {
  transactionHash: string
  gasUsed: string
}