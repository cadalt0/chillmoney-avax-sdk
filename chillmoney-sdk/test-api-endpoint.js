// Test script for the new API endpoint
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3011';

async function testTransferAPI() {
  console.log('🧪 Testing Full SDK Transfer API Endpoint');
  console.log('==========================================\n');

  const testData = {
    walletAddress: '0x5B078e081DA6b8F31b60EED13959f3B6Cf0C8c73',
    chain: 'base', // or 'arbitrum'
    amount: '1000' // 0.001 USDC in wei
  };

  try {
    console.log('📤 Sending request to API...');
    console.log('   Endpoint: POST /api/transfer-usdc');
    console.log('   Data:', JSON.stringify(testData, null, 2));
    console.log('');

    const response = await fetch(`${API_BASE}/api/transfer-usdc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ API Response:');
      console.log(JSON.stringify(result, null, 2));
      
      if (result.success) {
        console.log('\n🎉 Transfer completed successfully!');
        console.log(`   🔥 Burn TX: ${result.burnTxHash}`);
        console.log(`   ✨ Mint TX: ${result.mintTxHash}`);
        console.log(`   ⏱️  Total Time: ${result.totalTime}ms`);
        console.log(`   🔗 Burn Explorer: ${result.explorerLinks.burn}`);
        console.log(`   🔗 Mint Explorer: ${result.explorerLinks.mint}`);
      }
    } else {
      console.log('❌ API Error:');
      console.log(JSON.stringify(result, null, 2));
    }

  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

// Test with different chains
async function testBothChains() {
  console.log('🧪 Testing Both Chains (Base & Arbitrum)');
  console.log('=========================================\n');

  const testCases = [
    {
      name: 'Base Sepolia → Avalanche Fuji',
      data: {
        walletAddress: '0x5B078e081DA6b8F31b60EED13959f3B6Cf0C8c73',
        chain: 'base',
        amount: '1000'
      }
    },
    {
      name: 'Arbitrum Sepolia → Avalanche Fuji',
      data: {
        walletAddress: '0x5B078e081DA6b8F31b60EED13959f3B6Cf0C8c73',
        chain: 'arbitrum',
        amount: '1000'
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n🔄 Testing: ${testCase.name}`);
    console.log('─'.repeat(50));
    
    try {
      const response = await fetch(`${API_BASE}/api/transfer-usdc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testCase.data)
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        console.log(`✅ ${testCase.name} - SUCCESS`);
        console.log(`   Burn: ${result.burnTxHash}`);
        console.log(`   Mint: ${result.mintTxHash}`);
      } else {
        console.log(`❌ ${testCase.name} - FAILED`);
        console.log(`   Error: ${result.error}`);
      }
    } catch (error) {
      console.log(`❌ ${testCase.name} - ERROR`);
      console.log(`   ${error.message}`);
    }
  }
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--both')) {
    testBothChains();
  } else {
    testTransferAPI();
  }
}

module.exports = { testTransferAPI, testBothChains };
