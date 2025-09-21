export class ChillMoneyError extends Error {
  public readonly code: string
  public readonly context?: string

  constructor(message: string, code: string, context?: string) {
    super(message)
    this.name = 'ChillMoneyError'
    this.code = code
    this.context = context
  }
}

export class InsufficientBalanceError extends ChillMoneyError {
  constructor(required: bigint, available: bigint) {
    super(
      `Insufficient USDC balance. Required: ${required}, Available: ${available}`,
      'INSUFFICIENT_BALANCE'
    )
  }
}

export class InsufficientAllowanceError extends ChillMoneyError {
  constructor(required: bigint, available: bigint) {
    super(
      `Insufficient USDC allowance. Required: ${required}, Available: ${available}`,
      'INSUFFICIENT_ALLOWANCE'
    )
  }
}

export class AttestationTimeoutError extends ChillMoneyError {
  constructor(timeoutMs: number) {
    super(
      `Attestation timeout after ${timeoutMs}ms. Please try recovery.`,
      'ATTESTATION_TIMEOUT'
    )
  }
}

export class InvalidAttestationError extends ChillMoneyError {
  constructor(reason: string) {
    super(`Invalid attestation: ${reason}`, 'INVALID_ATTESTATION')
  }
}

export class NetworkSwitchError extends ChillMoneyError {
  constructor(chainId: number) {
    super(`Failed to switch to chain ${chainId}`, 'NETWORK_SWITCH_FAILED')
  }
}

export class RecoveryError extends ChillMoneyError {
  constructor(reason: string) {
    super(`Recovery failed: ${reason}`, 'RECOVERY_FAILED')
  }
}

export class ValidationError extends ChillMoneyError {
  constructor(field: string, value: any) {
    super(`Invalid ${field}: ${value}`, 'VALIDATION_ERROR')
  }
}
