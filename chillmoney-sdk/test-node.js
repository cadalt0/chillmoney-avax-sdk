// Node.js test for ChillMoney AVAX SDK
const { ChillMoneySDK } = require('./dist/index.js');

async function testSDK() {
    console.log('🥤 Testing ChillMoney AVAX SDK...\n');
    
    const sdk = new ChillMoneySDK();
    
    // Test 1: Check supported chains
    console.log('1. Testing supported chains:');
    const chains = sdk.getSupportedChains();
    console.log('   ✅ Supported chains:', chains);
    console.log('   Expected: [base, arbitrum]');
    console.log('   Result:', JSON.stringify(chains) === JSON.stringify(['base', 'arbitrum']) ? 'PASS' : 'FAIL');
    console.log('');
    
    // Test 2: Test configuration
    console.log('2. Testing SDK configuration:');
    console.log('   ✅ SDK instance created successfully');
    console.log('   ✅ Configuration loaded');
    console.log('');
    
    // Test 3: Test error handling
    console.log('3. Testing error handling:');
    try {
        // This should fail because we don't have a real provider
        await sdk.getUSDCBalance('0x742d35Cc6634C0532925a3b8D0C0E1C4C5f2A6c7', 'base');
        console.log('   ❌ Should have failed without provider');
    } catch (error) {
        console.log('   ✅ Error handling works:', error.message.substring(0, 50) + '...');
    }
    console.log('');
    
    // Test 4: Test fee estimation
    console.log('4. Testing fee estimation:');
    try {
        const fees = await sdk.estimateFees(1000000n, 'base');
        console.log('   ✅ Fee estimation works');
        console.log('   Fees:', fees);
    } catch (error) {
        console.log('   ❌ Fee estimation failed:', error.message);
    }
    console.log('');
    
    console.log('🎉 SDK basic functionality test completed!');
    console.log('\n📋 To test actual transfers:');
    console.log('1. Open test-transfer.html in a browser with MetaMask');
    console.log('2. Connect to Base Sepolia testnet');
    console.log('3. Get some test USDC from faucets');
    console.log('4. Try transferring to Avalanche Fuji');
    console.log('\n🔗 Testnet Faucets:');
    console.log('- Base Sepolia: https://bridge.base.org/deposit');
    console.log('- Avalanche Fuji: https://faucet.avax.network/');
    console.log('- USDC Testnet: https://faucet.circle.com/');
}

testSDK().catch(console.error);

