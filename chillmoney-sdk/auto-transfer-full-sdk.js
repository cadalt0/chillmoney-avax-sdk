// Full SDK Auto Transfer - Everything through ChillMoney SDK
require('dotenv').config();
const { ChillMoneySDK } = require('./dist/index.js');

// Target wallet address
const WALLET_ADDRESS = '0x5B078e081DA6b8F31b60EED13959f3B6Cf0C8c73';

// Amount to transfer (0.001 USDC = 1000 wei with 6 decimals)
const AMOUNT = 1000n; // 0.001 USDC

// Load private key from environment
const PRIVATE_KEY = process.env.PRIVATE_KEY;
if (!PRIVATE_KEY) {
  console.error('❌ Please set PRIVATE_KEY in your .env file');
  process.exit(1);
}

// Ensure private key is properly formatted as hex
const formattedPrivateKey = PRIVATE_KEY.startsWith('0x') ? PRIVATE_KEY : `0x${PRIVATE_KEY}`;

// Validate private key format
if (!/^0x[0-9a-fA-F]{64}$/.test(formattedPrivateKey)) {
  console.error('❌ Invalid private key format. Must be 64 hex characters with or without 0x prefix');
  console.error(`   Got: ${formattedPrivateKey}`);
  process.exit(1);
}

async function autoTransferFullSDK() {
  console.log('🥤 ChillMoney AVAX SDK - FULL SDK TRANSFER');
  console.log('==========================================\n');
  
  console.log(`🎯 Target Wallet: ${WALLET_ADDRESS}`);
  console.log(`💰 Amount: ${AMOUNT} wei (0.001 USDC)`);
  console.log(`🔗 Route: Base Sepolia → Avalanche Fuji`);
  console.log(`🔑 Using Private Key: ${PRIVATE_KEY.slice(0, 6)}...${PRIVATE_KEY.slice(-4)}\n`);

  try {
    // Initialize ChillMoney SDK
    const sdk = new ChillMoneySDK({
      baseRpcUrl: 'https://sepolia.base.org',
      arbitrumRpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
      avalancheRpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
      retryDelay: 3000,
      maxRetries: 100
    });

    console.log('🚀 Starting FULL SDK transfer...\n');

    // Step 1: Check USDC balance using SDK
    console.log('1️⃣ Checking USDC balance on Base...');
    try {
      const balance = await sdk.getUSDCBalance(WALLET_ADDRESS, 'base');
      console.log(`   💰 Base USDC Balance: ${balance.formatted.usdc} USDC`);
      
      if (balance.usdc < AMOUNT) {
        console.log('❌ Insufficient USDC balance on Base');
        console.log('   Please fund the wallet with test USDC from: https://faucet.circle.com/');
        return;
      }
    } catch (error) {
      console.log('⚠️  Could not check balance (this is normal for testnet)');
    }

    // Step 2: Check Avalanche balance before transfer
    console.log('\n2️⃣ Checking Avalanche USDC balance before transfer...');
    try {
      const avalancheBalanceBefore = await sdk.getUSDCBalance(WALLET_ADDRESS, 'avalanche');
      console.log(`   💰 Avalanche USDC Balance: ${avalancheBalanceBefore.formatted.usdc} USDC`);
    } catch (error) {
      console.log('⚠️  Could not check Avalanche balance');
    }

    // Step 3: FULL SDK TRANSFER - Everything through SDK
    console.log('\n3️⃣ Starting FULL SDK transfer...');
    console.log('   This will use SDK for:');
    console.log('   - Burn USDC on Base');
    console.log('   - Wait for Circle attestation');
    console.log('   - Mint USDC on Avalanche');
    console.log('   - All using direct private key calls');
    console.log('');

    const result = await sdk.transferUSDCWithSmartWallet({
      smartWalletAddress: WALLET_ADDRESS,
      amount: AMOUNT,
      sourceChain: 'base',
      userAddress: WALLET_ADDRESS,
      privateKey: formattedPrivateKey,
      onStep: (step) => {
        console.log(`   📝 Step: ${step}`);
        switch (step) {
          case 'burn':
            console.log('   🔥 Burning USDC on Base using SDK...');
            break;
          case 'attestation':
            console.log('   ⏳ Waiting for Circle attestation using SDK...');
            break;
          case 'mint':
            console.log('   ✨ Minting USDC on Avalanche using SDK...');
            break;
          case 'complete':
            console.log('   ✅ Transfer completed using SDK!');
            break;
        }
      }
    });

    // Step 4: Check final balances
    console.log('\n4️⃣ Checking final balances...');
    try {
      const avalancheBalanceAfter = await sdk.getUSDCBalance(WALLET_ADDRESS, 'avalanche');
      console.log(`   💰 Final Avalanche USDC Balance: ${avalancheBalanceAfter.formatted.usdc} USDC`);
    } catch (error) {
      console.log('⚠️  Could not check final Avalanche balance');
    }

    console.log('\n🎉 FULL SDK Transfer Results:');
    console.log(`   🔥 Burn Transaction: ${result.burnTxHash}`);
    console.log(`   ✨ Mint Transaction: ${result.mintTxHash}`);
    console.log(`   ⏱️  Total Time: ${result.totalTime}ms`);
    console.log(`   💰 Amount: 0.001 USDC`);
    console.log(`   ⛽ Gas Used (Burn): ${result.gasUsed.burn}`);
    console.log(`   ⛽ Gas Used (Mint): ${result.gasUsed.mint}`);

    // Step 5: Show explorer links
    console.log('\n🔗 Explorer Links:');
    console.log(`   Base Burn TX: https://sepolia.basescan.org/tx/${result.burnTxHash}`);
    console.log(`   Avalanche Mint TX: https://testnet.snowtrace.io/tx/${result.mintTxHash}`);

    console.log('\n✅ FULL SDK transfer completed!');
    console.log('🎯 100% ChillMoney SDK - No external calls!');
    console.log('🏔️  USDC successfully transferred from Base to Avalanche!');
    console.log('🔥 All operations: Burn, Attestation, Mint - through SDK!');

  } catch (error) {
    console.error('\n❌ Full SDK transfer failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Main execution
if (require.main === module) {
  autoTransferFullSDK();
}

module.exports = { autoTransferFullSDK };
