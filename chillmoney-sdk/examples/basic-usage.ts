import { ChillMoneySDK } from 'chillmoney-avax-sdk'

// Basic usage example
async function basicExample() {
  const chillMoney = new ChillMoneySDK()

  try {
    // Check balance before transfer
    const balance = await chillMoney.getUSDCBalance(
      '0x742d35Cc6634C0532925a3b8D0C0E1C4C5f2A6c7',
      'base'
    )
    console.log('Base USDC Balance:', balance.formatted.usdc)

    // Transfer 1 USDC from Base to Avalanche
    const result = await chillMoney.transferUSDC({
      amount: 1000000n, // 1 USDC (6 decimals)
      recipient: '0x742d35Cc6634C0532925a3b8D0C0E1C4C5f2A6c7',
      sourceChain: 'base',
      provider: window.ethereum,
      userAddress: '0x742d35Cc6634C0532925a3b8D0C0E1C4C5f2A6c7',
      onStep: (step) => {
        console.log(`Transfer step: ${step}`)
      }
    })

    console.log('Transfer completed!')
    console.log('Burn TX:', result.burnTxHash)
    console.log('Mint TX:', result.mintTxHash)
    console.log('Total time:', result.totalTime, 'ms')

  } catch (error) {
    console.error('Transfer failed:', error)
  }
}

// Recovery example
async function recoveryExample() {
  const chillMoney = new ChillMoneySDK()

  try {
    // Recover a stuck transfer
    const result = await chillMoney.recoverTransfer({
      burnTxHash: '0x1234567890abcdef...',
      sourceChain: 'base',
      provider: window.ethereum,
      userAddress: '0x742d35Cc6634C0532925a3b8D0C0E1C4C5f2A6c7',
      onStep: (step) => {
        console.log(`Recovery step: ${step}`)
      }
    })

    console.log('Recovery completed!')
    console.log('Mint TX:', result.mintTxHash)

  } catch (error) {
    console.error('Recovery failed:', error)
  }
}

// Balance checking example
async function balanceExample() {
  const chillMoney = new ChillMoneySDK()

  try {
    // Check balances on all supported chains
    const [baseBalance, arbitrumBalance, avalancheBalance] = await Promise.all([
      chillMoney.getUSDCBalance('0x742d35Cc6634C0532925a3b8D0C0E1C4C5f2A6c7', 'base'),
      chillMoney.getUSDCBalance('0x742d35Cc6634C0532925a3b8D0C0E1C4C5f2A6c7', 'arbitrum'),
      chillMoney.getUSDCBalance('0x742d35Cc6634C0532925a3b8D0C0E1C4C5f2A6c7', 'avalanche')
    ])

    console.log('Base USDC:', baseBalance.formatted.usdc)
    console.log('Arbitrum USDC:', arbitrumBalance.formatted.usdc)
    console.log('Avalanche USDC:', avalancheBalance.formatted.usdc)

  } catch (error) {
    console.error('Balance check failed:', error)
  }
}

// Export examples
export { basicExample, recoveryExample, balanceExample }
