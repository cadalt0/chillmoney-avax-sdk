# 🥤 ChillMoney AVAX SDK

**The easiest way to transfer USDC from Base/Arbitrum to Avalanche using Circle's CCTP protocol**

[![npm version](https://badge.fury.io/js/chillmoney-avax-sdk.svg)](https://badge.fury.io/js/chillmoney-avax-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Quick Start

```bash
npm install chillmoney-avax-sdk
```

```javascript
const { ChillMoneySDK } = require('chillmoney-avax-sdk');

const sdk = new ChillMoneySDK({
  baseRpcUrl: 'https://sepolia.base.org',
  arbitrumRpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
  avalancheRpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc'
});

// Transfer USDC from Base to Avalanche
const result = await sdk.transferUSDCWithSmartWallet({
  smartWalletAddress: '0x5B078e081DA6b8F31b60EED13959f3B6Cf0C8c73',
  amount: 1000n, // 0.001 USDC in wei
  sourceChain: 'base',
  userAddress: '0x5B078e081DA6b8F31b60EED13959f3B6Cf0C8c73',
  privateKey: '0x677f33...'
});
```

## ✨ Why ChillMoney SDK?

### 🎯 **Circle CCTP Made Simple**
- **No Complex Setup** - Just 3 lines of code
- **No Manual Attestation** - Automatic Circle attestation handling
- **No Smart Contract Knowledge** - SDK handles all the complexity
- **Production Ready** - Battle-tested with real transactions

### 🔥 **What Makes It Special**
- ✅ **Direct Smart Contract Calls** - No wallet providers needed
- ✅ **Full CCTP Flow** - Burn → Attestation → Mint automatically
- ✅ **Multi-Chain Support** - Base Sepolia & Arbitrum Sepolia → Avalanche Fuji
- ✅ **TypeScript Support** - Full type safety
- ✅ **Error Handling** - Comprehensive error management
- ✅ **Gas Optimization** - Optimized for minimal gas usage

## 📋 Table of Contents

- [Installation](#-installation)
- [Basic Usage](#-basic-usage)
- [API Reference](#-api-reference)
- [Examples](#-examples)
- [Smart Contract Integration](#-smart-contract-integration)
- [Error Handling](#-error-handling)
- [Configuration](#-configuration)
- [Troubleshooting](#-troubleshooting)

## 🛠 Installation

### NPM
```bash
npm install chillmoney-avax-sdk
```

### Yarn
```bash
yarn add chillmoney-avax-sdk
```

### Local Development
```bash
# Install from local directory
npm install file:../chillmoney-sdk

# Or copy the dist folder
cp -r chillmoney-sdk/dist ./node_modules/chillmoney-avax-sdk/
```

## 🚀 Basic Usage

### 1. Initialize the SDK

```javascript
const { ChillMoneySDK } = require('chillmoney-avax-sdk');

const sdk = new ChillMoneySDK({
  baseRpcUrl: 'https://sepolia.base.org',
  arbitrumRpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
  avalancheRpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
  retryDelay: 3000,    // Optional: Attestation check interval
  maxRetries: 100      // Optional: Max attestation attempts
});
```

### 2. Transfer USDC

```javascript
// Simple transfer using private key
const result = await sdk.transferUSDCWithSmartWallet({
  smartWalletAddress: '0x5B078e081DA6b8F31b60EED13959f3B6Cf0C8c73',
  amount: 1000n, // 0.001 USDC in wei
  sourceChain: 'base', // or 'arbitrum'
  userAddress: '0x5B078e081DA6b8F31b60EED13959f3B6Cf0C8c73',
  privateKey: '0x677f33b163f12c23fe6b5ee69f5096c33b9f8b4201273d4e711f3d9e3bf37525',
  onStep: (step) => {
    console.log(`Step: ${step}`);
  }
});

console.log('Transfer completed!');
console.log(`Burn TX: ${result.burnTxHash}`);
console.log(`Mint TX: ${result.mintTxHash}`);
```

## 📚 API Reference

### ChillMoneySDK Class

#### Constructor Options

```typescript
interface SDKConfig {
  baseRpcUrl: string;           // Base Sepolia RPC URL
  arbitrumRpcUrl: string;       // Arbitrum Sepolia RPC URL
  avalancheRpcUrl: string;      // Avalanche Fuji RPC URL
  retryDelay?: number;          // Attestation check interval (default: 3000ms)
  maxRetries?: number;          // Max attestation attempts (default: 100)
}
```

#### Methods

##### `transferUSDCWithSmartWallet(params)`

Complete cross-chain transfer using smart contract wallet.

```typescript
interface SmartWalletTransferParams {
  smartWalletAddress: `0x${string}`;  // Smart contract wallet address
  amount: bigint;                     // Amount in wei (6 decimals for USDC)
  sourceChain: 'base' | 'arbitrum';  // Source chain
  userAddress: `0x${string}`;        // User's EOA address
  privateKey?: `0x${string}`;        // Private key for signing
  provider?: any;                     // Wallet provider (alternative to privateKey)
  onStep?: (step: TransferStep) => void; // Step callback
}

interface SmartWalletTransferResult {
  burnTxHash: string;           // Burn transaction hash
  mintTxHash: string;           // Mint transaction hash
  totalTime: number;            // Total transfer time in ms
  gasUsed: {
    burn: string;               // Gas used for burn
    mint: string;               // Gas used for mint
  };
}
```

##### `burnUSDCWithSmartWallet(params)`

Burn USDC using smart contract wallet.

```typescript
interface BurnParams {
  smartWalletAddress: `0x${string}`;
  amount: bigint;
  sourceChain: 'base' | 'arbitrum';
  userAddress: `0x${string}`;
  privateKey?: `0x${string}`;
  provider?: any;
}

interface BurnResult {
  transactionHash: string;
  gasUsed: string;
}
```

##### `getUSDCBalance(address, chain)`

Get USDC balance for an address.

```typescript
interface BalanceResult {
  usdc: bigint;                 // Balance in wei
  formatted: {
    usdc: string;               // Formatted balance (e.g., "1.5 USDC")
  };
}
```

##### `callSmartContractFunction(params)`

Call any smart contract function directly.

```typescript
interface SmartContractCallParams {
  contractAddress: `0x${string}`;
  functionName: string;
  functionAbi: any[];
  args: any[];
  chain: 'base' | 'arbitrum' | 'avalanche';
  userAddress: `0x${string}`;
  privateKey?: `0x${string}`;
  provider?: any;
}
```

## 🎯 Examples

### Example 1: Basic Transfer

```javascript
const { ChillMoneySDK } = require('chillmoney-avax-sdk');

async function basicTransfer() {
  const sdk = new ChillMoneySDK({
    baseRpcUrl: 'https://sepolia.base.org',
    arbitrumRpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    avalancheRpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc'
  });

  const result = await sdk.transferUSDCWithSmartWallet({
    smartWalletAddress: '0x5B078e081DA6b8F31b60EED13959f3B6Cf0C8c73',
    amount: 1000n, // 0.001 USDC
    sourceChain: 'base',
    userAddress: '0x5B078e081DA6b8F31b60EED13959f3B6Cf0C8c73',
    privateKey: '0x677f33b163f12c23fe6b5ee69f5096c33b9f8b4201273d4e711f3d9e3bf37525'
  });

  console.log('Transfer completed!');
  console.log(`Burn: ${result.burnTxHash}`);
  console.log(`Mint: ${result.mintTxHash}`);
}

basicTransfer().catch(console.error);
```

### Example 2: With Step Callbacks

```javascript
const result = await sdk.transferUSDCWithSmartWallet({
  smartWalletAddress: '0x5B078e081DA6b8F31b60EED13959f3B6Cf0C8c73',
  amount: 1000n,
  sourceChain: 'base',
  userAddress: '0x5B078e081DA6b8F31b60EED13959f3B6Cf0C8c73',
  privateKey: '0x677f33b163f12c23fe6b5ee69f5096c33b9f8b4201273d4e711f3d9e3bf37525',
  onStep: (step) => {
    switch (step) {
      case 'burn':
        console.log('🔥 Burning USDC on Base...');
        break;
      case 'attestation':
        console.log('⏳ Waiting for Circle attestation...');
        break;
      case 'mint':
        console.log('✨ Minting USDC on Avalanche...');
        break;
      case 'complete':
        console.log('✅ Transfer completed!');
        break;
    }
  }
});
```

### Example 3: Check Balance First

```javascript
// Check balance before transfer
const balance = await sdk.getUSDCBalance('0x5B078e081DA6b8F31b60EED13959f3B6Cf0C8c73', 'base');
console.log(`Base USDC Balance: ${balance.formatted.usdc}`);

if (balance.usdc >= 1000n) {
  // Proceed with transfer
  const result = await sdk.transferUSDCWithSmartWallet({...});
} else {
  console.log('Insufficient balance');
}
```

## 🔧 Smart Contract Integration

### Using with Smart Contract Wallets

The SDK is designed to work seamlessly with smart contract wallets that have a `burnUSDC` function:

```solidity
// Smart contract wallet must have this function
function burnUSDC(uint256 amount) external {
    // Implementation for burning USDC
}
```

### Direct Smart Contract Calls

```javascript
// Call any smart contract function
const result = await sdk.callSmartContractFunction({
  contractAddress: '0x5B078e081DA6b8F31b60EED13959f3B6Cf0C8c73',
  functionName: 'burnUSDC',
  functionAbi: [
    {
      name: "burnUSDC",
      type: "function",
      stateMutability: "nonpayable",
      inputs: [{ name: "amount", type: "uint256" }],
      outputs: [],
    }
  ],
  args: [1000n],
  chain: 'base',
  userAddress: '0x5B078e081DA6b8F31b60EED13959f3B6Cf0C8c73',
  privateKey: '0x677f33b163f12c23fe6b5ee69f5096c33b9f8b4201273d4e711f3d9e3bf37525'
});
```

## 🎮 Included Examples

### `auto-transfer-full-sdk.js`

Complete example showing full SDK usage with detailed logging:

```bash
npm run auto-transfer:full-sdk
```

**Features:**
- ✅ Full SDK transfer flow
- ✅ Detailed step-by-step logging
- ✅ Balance checking before/after
- ✅ Error handling and recovery
- ✅ Explorer links

**Usage:**
```javascript
// Set environment variables
PRIVATE_KEY=your_private_key_here
WALLET_ADDRESS=0x5B078e081DA6b8F31b60EED13959f3B6Cf0C8c73
AMOUNT=1000
SOURCE_CHAIN=base

// Run the example
node auto-transfer-full-sdk.js
```

### `test-private-key.js`

Advanced example with private key management and multi-chain support:

```bash
npm run test-private-key
```

**Features:**
- ✅ Private key derivation
- ✅ Multi-chain wallet support
- ✅ Custom recipient addresses
- ✅ Advanced error handling
- ✅ Recovery instructions

**Environment Variables:**
```bash
PRIVATE_KEY=your_private_key_here
RECIPIENT_ADDRESS=0x... # Optional, defaults to sender
USER_ADDRESS=0x... # Optional override
```

## 🚨 Error Handling

### Common Errors

#### `Insufficient USDC Balance`
```javascript
try {
  const result = await sdk.transferUSDCWithSmartWallet({...});
} catch (error) {
  if (error.message.includes('Insufficient')) {
    console.log('Please fund your wallet with test USDC');
    console.log('Get test USDC from: https://faucet.circle.com/');
  }
}
```

#### `Attestation Timeout`
```javascript
try {
  const result = await sdk.transferUSDCWithSmartWallet({...});
} catch (error) {
  if (error.message.includes('Attestation timeout')) {
    console.log('Attestation is taking longer than expected');
    console.log('You can retry the transfer or wait a few minutes');
  }
}
```

#### `Invalid Private Key`
```javascript
try {
  const result = await sdk.transferUSDCWithSmartWallet({...});
} catch (error) {
  if (error.message.includes('invalid private key')) {
    console.log('Please check your private key format');
    console.log('Private key should be 64 hex characters with or without 0x prefix');
  }
}
```

### Error Types

```typescript
class ChillMoneyError extends Error {
  code: string;
  details?: string;
}

// Common error codes:
// - INSUFFICIENT_BALANCE
// - ATTESTATION_TIMEOUT
// - INVALID_PRIVATE_KEY
// - SMART_CONTRACT_CALL_FAILED
// - INVALID_CHAIN
// - MISSING_AUTH
```

## ⚙️ Configuration

### RPC URLs

**Testnet (Recommended for development):**
```javascript
const sdk = new ChillMoneySDK({
  baseRpcUrl: 'https://sepolia.base.org',
  arbitrumRpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
  avalancheRpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc'
});
```

**Mainnet (Production):**
```javascript
const sdk = new ChillMoneySDK({
  baseRpcUrl: 'https://mainnet.base.org',
  arbitrumRpcUrl: 'https://arb1.arbitrum.io/rpc',
  avalancheRpcUrl: 'https://api.avax.network/ext/bc/C/rpc'
});
```

### Custom RPC Providers

```javascript
const sdk = new ChillMoneySDK({
  baseRpcUrl: 'https://base-sepolia.g.alchemy.com/v2/YOUR_API_KEY',
  arbitrumRpcUrl: 'https://arb-sepolia.g.alchemy.com/v2/YOUR_API_KEY',
  avalancheRpcUrl: 'https://avax-fuji.g.alchemy.com/v2/YOUR_API_KEY'
});
```

## 🔍 Troubleshooting

### Common Issues

#### 1. "Invalid private key" Error
**Solution:** Ensure your private key is 64 hex characters:
```javascript
// Correct formats:
'0x677f33b163f12c23fe6b5ee69f5096c33b9f8b4201273d4e711f3d9e3bf37525'
'677f33b163f12c23fe6b5ee69f5096c33b9f8b4201273d4e711f3d9e3bf37525'
```

#### 2. "Cannot convert 0.01 to BigInt" Error
**Solution:** Convert decimal amounts to wei:
```javascript
// Wrong
amount: 0.01

// Correct
amount: BigInt(Math.floor(0.01 * 1000000)) // 10000 wei
```

#### 3. "Attestation timeout" Error
**Solution:** Circle attestations can take 1-2 minutes:
```javascript
// Increase timeout
const sdk = new ChillMoneySDK({
  // ... other config
  retryDelay: 5000,    // Check every 5 seconds
  maxRetries: 120      // 10 minutes total
});
```

#### 4. "Smart contract call failed" Error
**Solution:** Check if the smart contract has the required function:
```solidity
// Required function in smart contract
function burnUSDC(uint256 amount) external {
    // Implementation
}
```

### Debug Mode

Enable detailed logging:

```javascript
const sdk = new ChillMoneySDK({
  // ... config
  debug: true // Enable debug logging
});
```

### Network Issues

If you're experiencing network issues:

1. **Check RPC URLs** - Ensure they're accessible
2. **Use different RPC providers** - Try Alchemy, Infura, or public RPCs
3. **Check network status** - Verify the networks are operational
4. **Retry with backoff** - Implement exponential backoff

## 🌐 Supported Networks

### Testnets (Development)
- ✅ **Base Sepolia** → Avalanche Fuji
- ✅ **Arbitrum Sepolia** → Avalanche Fuji

### Mainnet (Production)
- ✅ **Base** → Avalanche
- ✅ **Arbitrum** → Avalanche

## 🔗 Useful Links

- [Circle CCTP Documentation](https://developers.circle.com/stablecoins/docs/cctp-technical-reference)
- [Base Sepolia Faucet](https://faucet.circle.com/)
- [Avalanche Fuji Faucet](https://faucet.avax.network/)
- [Base Sepolia Explorer](https://sepolia.basescan.org/)
- [Avalanche Fuji Explorer](https://testnet.snowtrace.io/)

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/chillmoney/chillmoney-avax-sdk/issues)
- **Discord:** [ChillMoney Discord](https://discord.gg/chillmoney)
- **Email:** support@chillmoney.com

## 🎉 Acknowledgments

- **Circle** - For the amazing CCTP protocol
- **Base** - For the fast and cheap L2
- **Arbitrum** - For the efficient rollup
- **Avalanche** - For the high-performance blockchain

---

**Made with ❤️ by the ChillMoney Team**

*Simplifying cross-chain USDC transfers, one transaction at a time.*