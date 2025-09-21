// Main SDK exports
export { ChillMoneySDK, chillMoney } from './chillmoney'
export { default } from './chillmoney'

// Type exports
export type {
  ChainConfig,
  TransferParams,
  TransferResult,
  RecoveryParams,
  RecoveryResult,
  BalanceResult,
  FeeEstimate,
  ChillMoneyConfig,
  TransferStep,
  RecoveryStep,
  SmartWalletTransferParams,
  SmartWalletTransferResult,
  SmartContractCallParams,
  SmartContractCallResult
} from './types'

// Error exports
export {
  ChillMoneyError,
  InsufficientBalanceError,
  InsufficientAllowanceError,
  AttestationTimeoutError,
  InvalidAttestationError,
  NetworkSwitchError,
  RecoveryError,
  ValidationError
} from './errors'

// Utility exports
export {
  toBytes32,
  formatUSDC,
  formatNative,
  isValidAddress,
  isValidChainId,
  getChainName,
  calculateFees,
  sleep,
  retry,
  getExplorerUrl,
  validateTransferParams,
  formatError
} from './utils'

// Constants
export { CHAIN_CONFIGS, DEFAULT_CONFIG, ERROR_MESSAGES } from './constants'
