// Auto Transfer Script for Smart Contract Wallet
// This script will auto approve, burn USDC, wait for attestation, and mint on Avalanche
require('dotenv').config();
const { ChillMoneySDK } = require('./dist/index.js');
const { ethers } = require('ethers');

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

// Chain configs from learn.js
const BURN_CONFIGS = {
  base: {
    rpc: "https://sepolia.base.org",
    label: "Base Sepolia",
    chainId: 6
  },
  avalanche: {
    rpc: "https://api.avax-test.network/ext/bc/C/rpc",
    label: "Avalanche Fuji",
    chainId: 1
  }
};

// Avalanche mint config (from ChillMoney SDK constants)
const AVALANCHE_CONFIG = {
  rpc: "https://api.avax-test.network/ext/bc/C/rpc", // Correct Avalanche Fuji RPC
  messageTransmitter: "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275" // Correct Avalanche message transmitter
};

const MESSAGE_TRANSMITTER_ABI = [
  {
    type: 'function',
    name: 'receiveMessage',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'message', type: 'bytes' },
      { name: 'attestation', type: 'bytes' },
    ],
    outputs: [],
  },
];

// --- Fetch attestation from Circle API (from learn.js) ---
async function fetchAttestation(chainId, transactionHash) {
  const url = `https://iris-api-sandbox.circle.com/v2/messages/${chainId}?transactionHash=${transactionHash}`;
  
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    try {
      attempts++;
      console.log(`🔄 Attempt ${attempts} to fetch attestation for ${transactionHash}...`);
      
      // Wait 10 seconds before first attempt, then 5 seconds between retries
      if (attempts === 1) {
        await new Promise(r => setTimeout(r, 10000));
      } else {
        await new Promise(r => setTimeout(r, 5000));
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.messages && data.messages.length > 0) {
        const message = data.messages[0];
        if (message.attestation && message.status === 'complete') {
          console.log(`✅ Attestation fetched: ${message.attestation.substring(0, 20)}...`);
          return {
            attestation: message.attestation,
            message: message.message,
            status: message.status
          };
        }
      }
      
      console.log(`⏳ Attestation not ready yet (attempt ${attempts}/${maxAttempts})`);
      
    } catch (error) {
      console.error(`❌ Error fetching attestation (attempt ${attempts}):`, error.message);
      if (attempts >= maxAttempts) throw error;
    }
  }
  
  throw new Error('Failed to fetch attestation after maximum attempts');
}

// --- Mint on Avalanche using attestation (from learn.js) ---
async function mintOnAvalanche(attestation, message) {
  const provider = new ethers.JsonRpcProvider(AVALANCHE_CONFIG.rpc);
  const signer = new ethers.Wallet(PRIVATE_KEY, provider);
  
  const contract = new ethers.Contract(AVALANCHE_CONFIG.messageTransmitter, MESSAGE_TRANSMITTER_ABI, signer);
  
  console.log(`🪙 Minting on Avalanche with attestation...`);
  const tx = await contract.receiveMessage(message, attestation);
  const receipt = await tx.wait();
  
  console.log(`✅ Avalanche mint success: ${tx.hash}`);
  return {
    chain: 'avalanche',
    transactionHash: tx.hash,
    gasUsed: receipt.gasUsed.toString()
  };
}

// --- Burn USDC function (from learn.js) ---
async function burnUSDCOnChain(chainKey, walletAddress, amount) {
  const cfg = BURN_CONFIGS[chainKey];
  if (!cfg) {
    throw new Error(`Unsupported chain ${chainKey}. Use base, avalanche.`);
  }

  const provider = new ethers.JsonRpcProvider(cfg.rpc);
  const signer = new ethers.Wallet(PRIVATE_KEY, provider);

  const abi = [
    {
      name: "burnUSDC",
      type: "function",
      stateMutability: "nonpayable",
      inputs: [{ name: "amount", type: "uint256" }],
      outputs: [],
    },
  ];

  const contract = new ethers.Contract(walletAddress, abi, signer);

  console.log(`🔥 ${cfg.label} burning ${amount} wei from ${walletAddress}`);
  const tx = await contract.burnUSDC(amount);
  const receipt = await tx.wait();

  console.log(`✅ ${cfg.label} burn success: ${tx.hash}`);
  
  // Fetch attestation and mint on Avalanche
  console.log(`⏳ Waiting for attestation...`);
  const attestationData = await fetchAttestation(cfg.chainId, tx.hash);
  
  console.log(`🪙 Minting on Avalanche...`);
  const mintResult = await mintOnAvalanche(attestationData.attestation, attestationData.message);
  
  return {
    chain: chainKey,
    transactionHash: tx.hash,
    gasUsed: receipt.gasUsed.toString(),
    walletAddress,
    amountBurned: amount,
    attestation: attestationData.attestation,
    avalancheMint: mintResult
  };
}

// This function is no longer needed since we call smart wallet directly

async function autoTransfer() {
  console.log('🥤 ChillMoney AVAX SDK - Auto Transfer for Smart Contract Wallet');
  console.log('==============================================================\n');
  
  console.log(`🎯 Target Wallet: ${WALLET_ADDRESS}`);
  console.log(`💰 Amount: ${AMOUNT} wei (0.001 USDC)`);
  console.log(`🔗 Route: Base Sepolia → Avalanche Fuji`);
  console.log(`🔑 Using Private Key: ${PRIVATE_KEY.slice(0, 6)}...${PRIVATE_KEY.slice(-4)}\n`);

  try {
    // Initialize ChillMoney SDK for balance checking and minting
    const sdk = new ChillMoneySDK({
      baseRpcUrl: 'https://sepolia.base.org',
      arbitrumRpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
      avalancheRpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
      retryDelay: 3000,
      maxRetries: 100
    });

    console.log('🚀 Starting auto transfer process...\n');

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

    // Step 3: Burn USDC using smart wallet function (from learn.js)
    console.log('\n3️⃣ Burning USDC using smart wallet function...');
    console.log('   This will:');
    console.log('   - Call burnUSDC(amount) on the smart contract wallet');
    console.log('   - Wait for Circle attestation');
    console.log('   - Mint USDC on Avalanche using ChillMoney SDK');
    console.log('');

    const startTime = Date.now();

    // Use the burn function from learn.js
    const burnResult = await burnUSDCOnChain('base', WALLET_ADDRESS, AMOUNT);

    const totalTime = Date.now() - startTime;

    console.log('\n🎉 Transfer Results:');
    console.log(`   🔥 Burn Transaction: ${burnResult.transactionHash}`);
    console.log(`   ✨ Mint Transaction: ${burnResult.avalancheMint.transactionHash}`);
    console.log(`   ⏱️  Total Time: ${totalTime}ms`);
    console.log(`   💰 Amount Burned: ${burnResult.amountBurned} wei`);
    console.log(`   ⛽ Gas Used (Burn): ${burnResult.gasUsed}`);
    console.log(`   ⛽ Gas Used (Mint): ${burnResult.avalancheMint.gasUsed}`);

    // Step 4: Check final balance
    console.log('\n4️⃣ Checking Avalanche USDC balance after transfer...');
    try {
      const avalancheBalanceAfter = await sdk.getUSDCBalance(WALLET_ADDRESS, 'avalanche');
      console.log(`   💰 Final Avalanche USDC Balance: ${avalancheBalanceAfter.formatted.usdc} USDC`);
    } catch (error) {
      console.log('⚠️  Could not check final balance');
    }

    // Step 5: Show explorer links
    console.log('\n🔗 Explorer Links:');
    console.log(`   Base Burn TX: https://sepolia.basescan.org/tx/${burnResult.transactionHash}`);
    console.log(`   Avalanche Mint TX: https://testnet.snowtrace.io/tx/${burnResult.avalancheMint.transactionHash}`);

    console.log('\n✅ Auto transfer completed successfully!');
    console.log('🎯 Smart contract wallet burnUSDC function called successfully');
    console.log('🏔️  USDC burned on Base and minted on Avalanche!');

  } catch (error) {
    console.error('\n❌ Auto transfer failed:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Recovery instructions
    if (error.message.includes('Failed to fetch attestation')) {
      console.log('\n🛠️  Recovery Instructions:');
      console.log('1. Wait a few minutes for attestation to complete');
      console.log('2. Check the burn transaction on Base explorer');
      console.log('3. Try running the script again');
    }
  }
}

// Recovery function for stuck transfers
async function recoverTransfer(burnTxHash) {
  console.log('🔄 Recovery Mode - Mint USDC on Avalanche');
  console.log('=========================================\n');
  
  console.log(`🔍 Recovering from burn transaction: ${burnTxHash}`);
  console.log(`🔑 Using Private Key: ${PRIVATE_KEY.slice(0, 6)}...${PRIVATE_KEY.slice(-4)}`);

  try {
    console.log('🚀 Starting recovery process...\n');

    // Step 1: Fetch attestation for the burn transaction
    console.log('1️⃣ Fetching attestation for burn transaction...');
    const attestationData = await fetchAttestation(BURN_CONFIGS.base.chainId, burnTxHash);
    
    console.log('2️⃣ Minting USDC on Avalanche...');
    const mintResult = await mintOnAvalanche(attestationData.attestation, attestationData.message);

    console.log('\n🎉 Recovery Results:');
    console.log(`   ✨ Mint Transaction: ${mintResult.transactionHash}`);
    console.log(`   ⛽ Gas Used: ${mintResult.gasUsed}`);
    console.log(`   🔗 Avalanche TX: https://testnet.snowtrace.io/tx/${mintResult.transactionHash}`);

    console.log('\n✅ Recovery completed successfully!');
    console.log('🎯 USDC minted on Avalanche from previous burn');

  } catch (error) {
    console.error('\n❌ Recovery failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Utility function to check USDC balance
async function checkUSDCBalance(address, chain = 'base') {
  const cfg = BURN_CONFIGS[chain];
  if (!cfg) {
    throw new Error(`Unsupported chain ${chain}`);
  }

  const provider = new ethers.JsonRpcProvider(cfg.rpc);
  
  // USDC contract ABI (simplified)
  const USDC_ABI = [
    {
      name: "balanceOf",
      type: "function",
      stateMutability: "view",
      inputs: [{ name: "account", type: "address" }],
      outputs: [{ name: "balance", type: "uint256" }],
    },
  ];

  // USDC contract address on Base Sepolia
  const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e"; // Base Sepolia USDC
  
  const contract = new ethers.Contract(USDC_ADDRESS, USDC_ABI, provider);
  const balance = await contract.balanceOf(address);
  
  return {
    raw: balance,
    formatted: ethers.formatUnits(balance, 6) // USDC has 6 decimals
  };
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args[0] === 'recover' && args[1]) {
    recoverTransfer(args[1]);
  } else if (args[0] === 'balance') {
    checkUSDCBalance(WALLET_ADDRESS, args[1] || 'base')
      .then(balance => {
        console.log(`💰 USDC Balance: ${balance.formatted} USDC`);
      })
      .catch(console.error);
  } else {
    autoTransfer();
  }
}

module.exports = { autoTransfer, recoverTransfer, checkUSDCBalance };
