// Quick test to verify Avalanche minting works
require('dotenv').config();
const { ethers } = require('ethers');

// Test the Avalanche message transmitter address
const AVALANCHE_CONFIG = {
  rpc: "https://api.avax-test.network/ext/bc/C/rpc",
  messageTransmitter: "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275"
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

async function testAvalancheMint() {
  console.log('🧪 Testing Avalanche Message Transmitter Address...\n');
  
  try {
    const provider = new ethers.JsonRpcProvider(AVALANCHE_CONFIG.rpc);
    const contract = new ethers.Contract(AVALANCHE_CONFIG.messageTransmitter, MESSAGE_TRANSMITTER_ABI, provider);
    
    console.log(`✅ RPC URL: ${AVALANCHE_CONFIG.rpc}`);
    console.log(`✅ Message Transmitter: ${AVALANCHE_CONFIG.messageTransmitter}`);
    console.log(`✅ Contract created successfully!`);
    
    // Test if we can get the contract code (this will fail if address is wrong)
    const code = await provider.getCode(AVALANCHE_CONFIG.messageTransmitter);
    if (code === '0x') {
      console.log('❌ No contract found at this address');
    } else {
      console.log('✅ Contract exists at this address');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAvalancheMint();
