// Setup script for ChillMoney AVAX SDK testing
const fs = require('fs');
const path = require('path');

console.log('🥤 ChillMoney AVAX SDK Setup');
console.log('============================\n');

// Check if .env exists
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, 'env.example');

if (!fs.existsSync(envPath)) {
    if (fs.existsSync(envExamplePath)) {
        console.log('📋 Creating .env file from template...');
        fs.copyFileSync(envExamplePath, envPath);
        console.log('✅ .env file created!');
    } else {
        console.log('📝 Creating .env file...');
        const envContent = `# ChillMoney AVAX SDK Environment Variables
PRIVATE_KEY=your_private_key_here

# Optional: User address override (usually derived from private key)
# USER_ADDRESS=0x742d35Cc6634C0532925a3b8D0C0E1C4C5f2A6c7

# Optional: Recipient address (leave empty to send to yourself)
# RECIPIENT_ADDRESS=0x742d35Cc6634C0532925a3b8D0C0E1C4C5f2A6c7

# Using public RPC endpoints - no API keys needed!
# BASE_RPC_URL=https://sepolia.base.org
# ARBITRUM_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
# AVALANCHE_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
`;
        fs.writeFileSync(envPath, envContent);
        console.log('✅ .env file created!');
    }
} else {
    console.log('✅ .env file already exists');
}

console.log('\n📋 Next Steps:');
console.log('1. Edit .env file and add your private key');
console.log('2. (Optional) Set USER_ADDRESS to override the derived address');
console.log('3. (Optional) Set RECIPIENT_ADDRESS to send to a different address');
console.log('4. Get test USDC from: https://faucet.circle.com/');
console.log('5. Make sure you have some ETH on Base Sepolia for gas');
console.log('6. Run: node test-private-key.js');
console.log('\n🔗 Testnet Faucets:');
console.log('- Base Sepolia ETH: https://bridge.base.org/deposit');
console.log('- Avalanche Fuji AVAX: https://faucet.avax.network/');
console.log('- USDC Testnet: https://faucet.circle.com/');
console.log('\n⚠️  Make sure to use testnet private keys only!');
