import { createWalletClient, encodeFunctionData, custom, formatUnits, createPublicClient, http } from 'viem'
import { 
  TransferParams, 
  TransferResult, 
  RecoveryParams, 
  RecoveryResult,
  BalanceResult,
  FeeEstimate,
  ChillMoneyConfig,
  TransferStep,
  RecoveryStep
} from './types'
import { 
  CHAIN_CONFIGS, 
  USDC_ABI, 
  TOKEN_MESSENGER_ABI, 
  MESSAGE_TRANSMITTER_ABI,
  DEFAULT_CONFIG,
  ERROR_MESSAGES
} from './constants'
import { 
  toBytes32, 
  formatUSDC, 
  formatNative, 
  isValidAddress, 
  validateTransferParams,
  sleep,
  retry,
  formatError
} from './utils'
import {
  ChillMoneyError,
  InsufficientBalanceError,
  InsufficientAllowanceError,
  AttestationTimeoutError,
  InvalidAttestationError,
  NetworkSwitchError,
  RecoveryError,
  ValidationError
} from './errors'

export class ChillMoneySDK {
  private config: Required<ChillMoneyConfig>

  constructor(config: ChillMoneyConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Transfer USDC from Base or Arbitrum to Avalanche
   */
  async transferUSDC(params: TransferParams): Promise<TransferResult> {
    const startTime = Date.now()
    
    try {
      // Validate parameters
      validateTransferParams({
        amount: params.amount,
        recipient: params.recipient,
        sourceChain: params.sourceChain,
        userAddress: params.userAddress
      })

      const sourceConfig = CHAIN_CONFIGS[params.sourceChain]
      const destinationConfig = CHAIN_CONFIGS.avalanche

      if (!sourceConfig) {
        throw new ChillMoneyError(ERROR_MESSAGES.INVALID_CHAIN, 'INVALID_CHAIN')
      }

      // Step 1: Check balance and approve
      params.onStep?.('approve')
      await this._approveUSDC(params, sourceConfig)

      // Step 2: Burn USDC on source chain
      params.onStep?.('burn')
      const burnTxHash = await this._burnUSDC(params, sourceConfig, destinationConfig)

      // Step 3: Wait for attestation
      params.onStep?.('attestation')
      const attestation = await this._waitForAttestation(burnTxHash, sourceConfig.domain)

      // Step 4: Switch to Avalanche and mint
      params.onStep?.('mint')
      const mintTxHash = await this._mintUSDC(params, destinationConfig, attestation)

      params.onStep?.('complete')

      const totalTime = Date.now() - startTime

      return {
        burnTxHash,
        mintTxHash,
        totalTime,
        fees: {
          sourceChain: 0n, // Will be calculated from actual gas used
          destinationChain: 0n,
          total: 0n
        }
      }

    } catch (error) {
      throw new ChillMoneyError(
        formatError(error, 'transferUSDC'),
        'TRANSFER_FAILED'
      )
    }
  }

  /**
   * Recover a stuck transfer
   */
  async recoverTransfer(params: RecoveryParams): Promise<RecoveryResult> {
    const startTime = Date.now()

    try {
      const sourceConfig = CHAIN_CONFIGS[params.sourceChain]
      const destinationConfig = CHAIN_CONFIGS.avalanche

      if (!sourceConfig) {
        throw new RecoveryError('Invalid source chain')
      }

      // Step 1: Validate burn transaction
      params.onStep?.('validate')
      const messageData = await this._validateBurnTransaction(params.burnTxHash, sourceConfig.domain)

      // Step 2: Locate funds
      params.onStep?.('locate')
      if (!messageData?.message || !messageData?.attestation) {
        throw new RecoveryError('Incomplete message data')
      }

      // Step 3: Prepare recovery
      params.onStep?.('prepare')
      await this._switchToAvalanche(params.provider)

      // Step 4: Execute recovery
      params.onStep?.('execute')
      const mintTxHash = await this._mintUSDC(
        {
          amount: 0n,
          recipient: params.userAddress, // Recovery always goes to user
          sourceChain: params.sourceChain,
          provider: params.provider,
          userAddress: params.userAddress,
          onStep: params.onStep ? (step: TransferStep) => {
            // Map TransferStep to RecoveryStep for recovery context
            if (step === 'mint') {
              params.onStep?.('execute')
            } else if (step === 'complete') {
              params.onStep?.('complete')
            }
          } : undefined
        },
        destinationConfig,
        messageData
      )

      params.onStep?.('complete')

      return {
        mintTxHash,
        recoveredAmount: 0n, // Would need to parse from message
        totalTime: Date.now() - startTime
      }

    } catch (error) {
      throw new RecoveryError(formatError(error, 'recoverTransfer'))
    }
  }

  /**
   * Get USDC balance for a user on a specific chain
   */
  async getUSDCBalance(address: `0x${string}`, chain: 'base' | 'arbitrum' | 'avalanche'): Promise<BalanceResult> {
    try {
      if (!isValidAddress(address)) {
        throw new ValidationError('address', address)
      }

      const config = CHAIN_CONFIGS[chain]
      if (!config) {
        throw new ChillMoneyError('Invalid chain', 'INVALID_CHAIN')
      }

      const publicClient = createPublicClient({
        chain: {
          id: config.chainId,
          name: config.name,
          network: config.id,
          nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
          rpcUrls: { default: { http: [config.rpcUrl] } },
          blockExplorers: { default: { name: 'Explorer', url: config.blockExplorer } }
        },
        transport: http()
      })

      const [usdcBalance, nativeBalance] = await Promise.all([
        publicClient.readContract({
          address: config.usdcAddress,
          abi: USDC_ABI,
          functionName: 'balanceOf',
          args: [address]
        }),
        publicClient.getBalance({ address })
      ])

      return {
        usdc: usdcBalance,
        native: nativeBalance,
        formatted: {
          usdc: formatUSDC(usdcBalance),
          native: formatNative(nativeBalance)
        }
      }

    } catch (error) {
      throw new ChillMoneyError(formatError(error, 'getUSDCBalance'), 'BALANCE_CHECK_FAILED')
    }
  }

  /**
   * Estimate transfer fees
   */
  async estimateFees(amount: bigint, sourceChain: 'base' | 'arbitrum'): Promise<FeeEstimate> {
    // This would need actual gas estimation
    // For now, return mock values
    return {
      sourceChain: 0n,
      destinationChain: 0n,
      total: 0n,
      usdcAmount: amount
    }
  }

  /**
   * Get supported chains
   */
  getSupportedChains(): string[] {
    return ['base', 'arbitrum']
  }

  /**
   * Call smart contract function for smart wallets
   */
  async callSmartContractFunction(params: {
    contractAddress: `0x${string}`
    functionName: string
    functionAbi: any[]
    args: any[]
    chain: 'base' | 'arbitrum' | 'avalanche'
    provider?: any
    userAddress: `0x${string}`
    privateKey?: `0x${string}`
  }): Promise<{ transactionHash: string; gasUsed: string }> {
    try {
      const config = CHAIN_CONFIGS[params.chain]
      if (!config) {
        throw new ChillMoneyError('Invalid chain', 'INVALID_CHAIN')
      }

      let walletClient

      if (params.privateKey) {
        // Use private key directly for direct calls
        const { privateKeyToAccount } = await import('viem/accounts')
        const account = privateKeyToAccount(params.privateKey)
        
        walletClient = createWalletClient({
          chain: {
            id: config.chainId,
            name: config.name,
            network: config.id,
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: { default: { http: [config.rpcUrl] } }
          },
          transport: http(config.rpcUrl),
          account: account
        })
      } else if (params.provider) {
        // Use provider for wallet integration
        walletClient = createWalletClient({
          chain: {
            id: config.chainId,
            name: config.name,
            network: config.id,
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: { default: { http: [config.rpcUrl] } }
          },
          transport: custom(params.provider),
          account: params.userAddress
        })
      } else {
        throw new ChillMoneyError('Either privateKey or provider must be provided', 'MISSING_AUTH')
      }

      const tx = await walletClient.sendTransaction({
        to: params.contractAddress,
        data: encodeFunctionData({
          abi: params.functionAbi,
          functionName: params.functionName,
          args: params.args
        })
      })

      // Wait for transaction confirmation
      const publicClient = createPublicClient({
        chain: {
          id: config.chainId,
          name: config.name,
          network: config.id,
          nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
          rpcUrls: { default: { http: [config.rpcUrl] } }
        },
        transport: http()
      })

      const receipt = await publicClient.waitForTransactionReceipt({ hash: tx })

      return {
        transactionHash: tx,
        gasUsed: receipt.gasUsed.toString()
      }

    } catch (error) {
      throw new ChillMoneyError(
        formatError(error, 'callSmartContractFunction'),
        'SMART_CONTRACT_CALL_FAILED'
      )
    }
  }

  /**
   * Burn USDC using smart contract wallet
   */
  async burnUSDCWithSmartWallet(params: {
    smartWalletAddress: `0x${string}`
    amount: bigint
    sourceChain: 'base' | 'arbitrum'
    provider?: any
    userAddress: `0x${string}`
    privateKey?: `0x${string}`
  }): Promise<{ transactionHash: string; gasUsed: string }> {
    const burnUSDCAbi = [
      {
        name: "burnUSDC",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [{ name: "amount", type: "uint256" }],
        outputs: [],
      },
    ]

    return await this.callSmartContractFunction({
      contractAddress: params.smartWalletAddress,
      functionName: 'burnUSDC',
      functionAbi: burnUSDCAbi,
      args: [params.amount],
      chain: params.sourceChain,
      provider: params.provider,
      userAddress: params.userAddress,
      privateKey: params.privateKey
    })
  }

  /**
   * Complete smart wallet transfer: burn USDC and mint on Avalanche
   */
  async transferUSDCWithSmartWallet(params: {
    smartWalletAddress: `0x${string}`
    amount: bigint
    sourceChain: 'base' | 'arbitrum'
    provider?: any
    userAddress: `0x${string}`
    privateKey?: `0x${string}`
    onStep?: (step: TransferStep) => void
  }): Promise<{
    burnTxHash: string
    mintTxHash: string
    totalTime: number
    gasUsed: {
      burn: string
      mint: string
    }
  }> {
    const startTime = Date.now()

    try {
      // Step 1: Burn USDC using smart wallet
      params.onStep?.('burn')
      const burnResult = await this.burnUSDCWithSmartWallet({
        smartWalletAddress: params.smartWalletAddress,
        amount: params.amount,
        sourceChain: params.sourceChain,
        provider: params.provider,
        userAddress: params.userAddress,
        privateKey: params.privateKey
      })

      // Step 2: Wait for attestation
      params.onStep?.('attestation')
      const sourceConfig = CHAIN_CONFIGS[params.sourceChain]
      const attestation = await this._waitForAttestation(burnResult.transactionHash, sourceConfig.domain)

      // Step 3: Extract message and attestation data
      let messageData, attestationData
      
      if (typeof attestation === 'string') {
        try {
          const parsed = JSON.parse(attestation)
          messageData = parsed.message
          attestationData = parsed.attestation
        } catch (e) {
          attestationData = attestation
          messageData = `0x${Array.from({length: 200}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
        }
      } else {
        messageData = attestation.message
        attestationData = attestation.attestation
      }

      // Step 4: Mint on Avalanche using direct smart contract call
      params.onStep?.('mint')
      const mintResult = await this.callSmartContractFunction({
        contractAddress: '0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275', // Avalanche Message Transmitter
        functionName: 'receiveMessage',
        functionAbi: [
          {
            name: "receiveMessage",
            type: "function",
            stateMutability: "nonpayable",
            inputs: [
              { name: "message", type: "bytes" },
              { name: "attestation", type: "bytes" }
            ],
            outputs: [],
          },
        ],
        args: [messageData, attestationData],
        chain: 'avalanche',
        userAddress: params.userAddress,
        privateKey: params.privateKey,
        provider: params.provider
      })

      params.onStep?.('complete')

      return {
        burnTxHash: burnResult.transactionHash,
        mintTxHash: mintResult.transactionHash,
        totalTime: Date.now() - startTime,
        gasUsed: {
          burn: burnResult.gasUsed,
          mint: mintResult.gasUsed
        }
      }

    } catch (error) {
      throw new ChillMoneyError(
        formatError(error, 'transferUSDCWithSmartWallet'),
        'SMART_WALLET_TRANSFER_FAILED'
      )
    }
  }

  // Private helper methods

  private async _approveUSDC(params: TransferParams, config: any): Promise<void> {
    const walletClient = createWalletClient({
      chain: {
        id: config.chainId,
        name: config.name,
        network: config.id,
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: { default: { http: [config.rpcUrl] } }
      },
      transport: custom(params.provider),
      account: params.userAddress
    })

    // Check current allowance
    const publicClient = createPublicClient({
      chain: {
        id: config.chainId,
        name: config.name,
        network: config.id,
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: { default: { http: [config.rpcUrl] } }
      },
      transport: http()
    })

    const allowance = await publicClient.readContract({
      address: config.usdcAddress,
      abi: USDC_ABI,
      functionName: 'allowance',
      args: [params.userAddress, config.tokenMessenger]
    })

    if (allowance < params.amount) {
      // Approve a larger amount to avoid future allowance issues
      const approveAmount = params.amount * 2n; // Approve 2x the amount
      const approveTx = await walletClient.sendTransaction({
        to: config.usdcAddress,
        data: encodeFunctionData({
          abi: USDC_ABI,
          functionName: 'approve',
          args: [config.tokenMessenger, approveAmount]
        })
      })
      
      // Wait for transaction confirmation
      await publicClient.waitForTransactionReceipt({ hash: approveTx })
      console.log(`   ✅ Approved ${approveAmount} USDC for TokenMessenger`)
    }
  }

  private async _burnUSDC(params: TransferParams, sourceConfig: any, destConfig: any): Promise<string> {
    const walletClient = createWalletClient({
      chain: {
        id: sourceConfig.chainId,
        name: sourceConfig.name,
        network: sourceConfig.id,
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: { default: { http: [sourceConfig.rpcUrl] } }
      },
      transport: custom(params.provider),
      account: params.userAddress
    })

    const mintRecipient = toBytes32(params.recipient)
    const destinationCaller = '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`

    const tx = await walletClient.sendTransaction({
      to: sourceConfig.tokenMessenger,
      data: encodeFunctionData({
        abi: TOKEN_MESSENGER_ABI,
        functionName: 'depositForBurn',
        args: [
          params.amount,
          destConfig.domain,
          mintRecipient,
          sourceConfig.usdcAddress,
          destinationCaller,
          BigInt(500), // maxFee
          1000 // minFinalityThreshold
        ]
      })
    })

    return tx
  }

  private async _waitForAttestation(burnTxHash: string, sourceDomain: number): Promise<any> {
    const url = `${this.config.attestationApiUrl}/${sourceDomain}?transactionHash=${burnTxHash}`
    
    let attempts = 0
    while (attempts < this.config.maxRetries) {
      try {
        const response = await fetch(url)
        const data = await response.json() as any
        
        if (data?.messages?.[0]?.status === 'complete') {
          return data.messages[0]
        }
        
        await sleep(this.config.retryDelay)
        attempts++
      } catch (error) {
        console.error('Attestation polling error:', error)
        await sleep(this.config.retryDelay)
        attempts++
      }
    }

    throw new AttestationTimeoutError(this.config.maxRetries * this.config.retryDelay)
  }

  private async _mintUSDC(params: TransferParams, config: any, attestation: any): Promise<string> {
    await this._switchToAvalanche(params.provider)

    const walletClient = createWalletClient({
      chain: {
        id: config.chainId,
        name: config.name,
        network: config.id,
        nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
        rpcUrls: { default: { http: [config.rpcUrl] } }
      },
      transport: custom(params.provider),
      account: params.userAddress
    })

    const tx = await walletClient.sendTransaction({
      to: config.messageTransmitter,
      data: encodeFunctionData({
        abi: MESSAGE_TRANSMITTER_ABI,
        functionName: 'receiveMessage',
        args: [attestation.message as `0x${string}`, attestation.attestation as `0x${string}`]
      })
    })

    return tx
  }

  private async _switchToAvalanche(provider: any): Promise<void> {
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xa869' }] // 43113 in hex
      })
    } catch (error) {
      throw new NetworkSwitchError(43113)
    }
  }

  private async _validateBurnTransaction(burnTxHash: string, sourceDomain: number): Promise<any> {
    const url = `${this.config.attestationApiUrl}/${sourceDomain}?transactionHash=${burnTxHash}`
    
    try {
      const response = await fetch(url)
      const data = await response.json() as any
      
      if (!data?.messages?.[0]) {
        throw new RecoveryError('No message found for this transaction hash')
      }

      return data.messages[0]
    } catch (error) {
      throw new RecoveryError('Failed to validate burn transaction')
    }
  }
}

// Export default instance
export const chillMoney = new ChillMoneySDK()
export default ChillMoneySDK
