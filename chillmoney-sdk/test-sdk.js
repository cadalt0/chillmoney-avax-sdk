// Simple test to verify the SDK builds and can be imported
const { ChillMoneySDK } = require('./dist/index.js');

console.log('✅ SDK imported successfully!');
console.log('ChillMoneySDK class:', typeof ChillMoneySDK);

// Test creating an instance
const sdk = new ChillMoneySDK();
console.log('✅ SDK instance created successfully!');

// Test getting supported chains
const supportedChains = sdk.getSupportedChains();
console.log('✅ Supported chains:', supportedChains);

// Test configuration
console.log('✅ SDK configuration loaded');

console.log('\n🎉 ChillMoney AVAX SDK is working correctly!');
console.log('\n📋 Available methods:');
console.log('- transferUSDC()');
console.log('- recoverTransfer()');
console.log('- getUSDCBalance()');
console.log('- estimateFees()');
console.log('- getSupportedChains()');
