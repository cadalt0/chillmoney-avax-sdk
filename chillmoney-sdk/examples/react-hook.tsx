import { useState, useCallback } from 'react'
import { ChillMoneySDK, TransferParams, TransferResult, BalanceResult } from 'chillmoney-avax-sdk'

// Custom React hook for ChillMoney SDK
export function useChillMoney() {
  const [sdk] = useState(() => new ChillMoneySDK())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState<string | null>(null)

  const transfer = useCallback(async (params: Omit<TransferParams, 'provider' | 'userAddress' | 'onStep'>) => {
    setLoading(true)
    setError(null)
    setCurrentStep(null)

    try {
      const result = await sdk.transferUSDC({
        ...params,
        provider: window.ethereum,
        userAddress: window.ethereum?.selectedAddress as `0x${string}`,
        onStep: (step) => setCurrentStep(step)
      })

      setCurrentStep('complete')
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Transfer failed'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [sdk])

  const recover = useCallback(async (burnTxHash: string, sourceChain: 'base' | 'arbitrum') => {
    setLoading(true)
    setError(null)
    setCurrentStep(null)

    try {
      const result = await sdk.recoverTransfer({
        burnTxHash,
        sourceChain,
        provider: window.ethereum,
        userAddress: window.ethereum?.selectedAddress as `0x${string}`,
        onStep: (step) => setCurrentStep(step)
      })

      setCurrentStep('complete')
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Recovery failed'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [sdk])

  const getBalance = useCallback(async (address: string, chain: 'base' | 'arbitrum' | 'avalanche'): Promise<BalanceResult> => {
    return await sdk.getUSDCBalance(address as `0x${string}`, chain)
  }, [sdk])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    transfer,
    recover,
    getBalance,
    loading,
    error,
    currentStep,
    clearError
  }
}

// React component example
export function TransferComponent() {
  const { transfer, recover, getBalance, loading, error, currentStep, clearError } = useChillMoney()
  const [amount, setAmount] = useState('')
  const [recipient, setRecipient] = useState('')
  const [sourceChain, setSourceChain] = useState<'base' | 'arbitrum'>('base')
  const [balance, setBalance] = useState<BalanceResult | null>(null)

  const handleTransfer = async () => {
    if (!amount || !recipient) return

    try {
      const result = await transfer({
        amount: BigInt(parseFloat(amount) * 1e6),
        recipient: recipient as `0x${string}`,
        sourceChain
      })

      console.log('Transfer completed:', result)
      alert('Transfer completed successfully!')
    } catch (err) {
      console.error('Transfer failed:', err)
    }
  }

  const handleRecover = async () => {
    const burnTxHash = prompt('Enter burn transaction hash:')
    if (!burnTxHash) return

    try {
      const result = await recover(burnTxHash, sourceChain)
      console.log('Recovery completed:', result)
      alert('Recovery completed successfully!')
    } catch (err) {
      console.error('Recovery failed:', err)
    }
  }

  const handleCheckBalance = async () => {
    if (!recipient) return

    try {
      const bal = await getBalance(recipient, sourceChain)
      setBalance(bal)
    } catch (err) {
      console.error('Balance check failed:', err)
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <h2>ChillMoney Transfer</h2>
      
      {error && (
        <div style={{ 
          background: '#fee', 
          color: '#c00', 
          padding: '10px', 
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          {error}
          <button onClick={clearError} style={{ marginLeft: '10px' }}>×</button>
        </div>
      )}

      {currentStep && (
        <div style={{ 
          background: '#eef', 
          color: '#006', 
          padding: '10px', 
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          Current Step: {currentStep}
        </div>
      )}

      <div style={{ marginBottom: '15px' }}>
        <label>Source Chain:</label>
        <select 
          value={sourceChain} 
          onChange={(e) => setSourceChain(e.target.value as 'base' | 'arbitrum')}
          style={{ marginLeft: '10px', padding: '5px' }}
        >
          <option value="base">Base</option>
          <option value="arbitrum">Arbitrum</option>
        </select>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label>Amount (USDC):</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="1.0"
          style={{ marginLeft: '10px', padding: '5px' }}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label>Recipient Address:</label>
        <input
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="0x..."
          style={{ marginLeft: '10px', padding: '5px', width: '300px' }}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <button 
          onClick={handleCheckBalance}
          disabled={loading || !recipient}
          style={{ marginRight: '10px', padding: '8px 16px' }}
        >
          Check Balance
        </button>
        {balance && (
          <span>Balance: {balance.formatted.usdc} USDC</span>
        )}
      </div>

      <div style={{ marginBottom: '15px' }}>
        <button 
          onClick={handleTransfer}
          disabled={loading || !amount || !recipient}
          style={{ 
            marginRight: '10px', 
            padding: '8px 16px',
            background: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          {loading ? 'Transferring...' : 'Transfer USDC'}
        </button>

        <button 
          onClick={handleRecover}
          disabled={loading}
          style={{ 
            padding: '8px 16px',
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          Recover Transfer
        </button>
      </div>
    </div>
  )
}
