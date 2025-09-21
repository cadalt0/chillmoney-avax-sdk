// Test script using private key for Base to Avalanche transfer
require('dotenv').config();
const { ChillMoneySDK } = require('./dist/index.js');
const { createWalletClient, http, parseEther } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { baseSepolia, avalancheFuji } = require('viem/chains');

async function testPrivateKeyTransfer() {
    console.log('🥤 ChillMoney AVAX SDK - Private Key Test');
    console.log('==========================================\n');

    // Check if private key is set
    if (!process.env.PRIVATE_KEY) {
        console.error('❌ Please set PRIVATE_KEY in your .env file');
        console.log('Create a .env file with:');
        console.log('PRIVATE_KEY=your_private_key_here');
        process.exit(1);
    }

    let privateKey = process.env.PRIVATE_KEY;
    
    // Ensure private key is properly formatted
    if (!privateKey.startsWith('0x')) {
        privateKey = '0x' + privateKey;
    }
    
    const amount = 0.01; // 0.01 USDC
    const amountWei = BigInt(Math.floor(amount * 1e6)); // Convert to 6 decimals
    
    // Get addresses from environment or derive from private key
    const recipientAddress = process.env.RECIPIENT_ADDRESS || 'SAME_AS_SENDER';
    const userAddressOverride = process.env.USER_ADDRESS; // Optional override

    console.log(`💰 Transferring ${amount} USDC from Base to Avalanche`);
    console.log(`🔑 Using private key: ${privateKey.slice(0, 6)}...${privateKey.slice(-4)}`);
    console.log('');

    try {
        // Initialize SDK with public RPC endpoints
        const sdk = new ChillMoneySDK({
            baseRpcUrl: 'https://sepolia.base.org',
            arbitrumRpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
            avalancheRpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
            retryDelay: 3000, // Check every 3 seconds
            maxRetries: 100   // 5 minutes total timeout
        });

        // Derive account from private key
        const account = privateKeyToAccount(privateKey);
        const derivedAddress = account.address;

        // Create wallet clients for both chains using public RPCs
        const baseWallet = createWalletClient({
            chain: {
                id: 84532, // Base Sepolia
                name: 'Base Sepolia',
                network: 'base-sepolia',
                nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
                rpcUrls: { default: { http: ['https://sepolia.base.org'] } },
                blockExplorers: { default: { name: 'Basescan', url: 'https://sepolia.basescan.org' } }
            },
            transport: http('https://sepolia.base.org'),
            account: account
        });

        const avalancheWallet = createWalletClient({
            chain: avalancheFuji,
            transport: http('https://api.avax-test.network/ext/bc/C/rpc'),
            account: account
        });

        // Use override address or derive from private key
        const userAddress = userAddressOverride || derivedAddress;
        const finalRecipient = recipientAddress === 'SAME_AS_SENDER' ? userAddress : recipientAddress;
        
        // Track current chain ID for provider
        let currentChainId = '0x14a34'; // Start with Base Sepolia
        
        console.log(`👤 User Address: ${userAddress}`);
        console.log(`📬 Recipient Address: ${finalRecipient}`);
        
        // Validate addresses if provided
        if (userAddressOverride && userAddressOverride !== derivedAddress) {
            console.log('⚠️  Warning: USER_ADDRESS override provided but does not match private key address');
            console.log(`   Private key address: ${derivedAddress}`);
            console.log(`   Override address: ${userAddressOverride}`);
        }

        // Step 1: Check Base USDC balance
        console.log('\n1️⃣ Checking Base USDC balance...');
        try {
            const baseBalance = await sdk.getUSDCBalance(userAddress, 'base');
            console.log(`   Base USDC Balance: ${baseBalance.formatted.usdc} USDC`);
            
            if (baseBalance.usdc < amountWei) {
                console.log('❌ Insufficient USDC balance on Base');
                console.log('   Please get test USDC from: https://faucet.circle.com/');
                return;
            }
        } catch (error) {
            console.log('⚠️  Could not check balance (this is normal for testnet)');
        }

        // Step 2: Check Avalanche USDC balance before transfer
        console.log('\n2️⃣ Checking Avalanche USDC balance before transfer...');
        try {
            const avalancheBalanceBefore = await sdk.getUSDCBalance(userAddress, 'avalanche');
            console.log(`   Avalanche USDC Balance: ${avalancheBalanceBefore.formatted.usdc} USDC`);
        } catch (error) {
            console.log('⚠️  Could not check Avalanche balance');
        }

        // Step 3: Perform the transfer
        console.log('\n3️⃣ Starting Base to Avalanche transfer...');
        console.log('   This will:');
        console.log('   - Approve USDC spending on Base');
        console.log('   - Burn USDC on Base');
        console.log('   - Wait for Circle attestation');
        console.log('   - Mint USDC on Avalanche');
        console.log('');

        const startTime = Date.now();
        
        const result = await sdk.transferUSDC({
            amount: amountWei,
            recipient: finalRecipient, // Send to specified recipient
            sourceChain: 'base',
            provider: {
                request: async ({ method, params }) => {
                    // Mock provider for private key usage
                    if (method === 'eth_requestAccounts') {
                        return [userAddress];
                    }
                    if (method === 'eth_chainId') {
                        // Return current chain ID based on context
                        // This will be updated when switching chains
                        return currentChainId || '0x14a34'; // Default to Base Sepolia
                    }
                    if (method === 'wallet_switchEthereumChain') {
                        const chainId = params[0].chainId;
                        currentChainId = chainId; // Update current chain ID
                        if (chainId === '0x14a34') { // Base Sepolia
                            console.log('   🔄 Switched to Base Sepolia');
                        } else if (chainId === '0xa869') { // Avalanche Fuji
                            console.log('   🔄 Switched to Avalanche Fuji');
                        }
                        return null;
                    }
                    if (method === 'eth_sendTransaction') {
                        // Use the appropriate wallet client based on current chain
                        console.log(`   📝 Sending transaction to: ${params[0].to}`);
                        let tx;
                        if (currentChainId === '0xa869') {
                            // Use Avalanche wallet for minting
                            tx = await avalancheWallet.sendTransaction({
                                to: params[0].to,
                                data: params[0].data,
                                value: params[0].value || 0n
                            });
                        } else {
                            // Use Base wallet for burning
                            tx = await baseWallet.sendTransaction({
                                to: params[0].to,
                                data: params[0].data,
                                value: params[0].value || 0n
                            });
                        }
                        console.log(`   ✅ Transaction sent: ${tx}`);
                        return tx;
                    }
                    throw new Error(`Unsupported method: ${method}`);
                }
            },
            userAddress: userAddress,
            onStep: (step) => {
                const timestamp = new Date().toLocaleTimeString();
                console.log(`   [${timestamp}] Step: ${step}`);
                
                switch (step) {
                    case 'approve':
                        console.log('   🪙 Approving USDC spending...');
                        break;
                    case 'burn':
                        console.log('   🔥 Burning USDC on Base...');
                        break;
                    case 'attestation':
                        console.log('   ⏳ Waiting for Circle attestation...');
                        break;
                    case 'mint':
                        console.log('   ✨ Minting USDC on Avalanche...');
                        break;
                    case 'complete':
                        console.log('   ✅ Transfer completed!');
                        break;
                }
            }
        });

        const totalTime = Date.now() - startTime;

        console.log('\n🎉 Transfer Results:');
        console.log(`   Burn Transaction: ${result.burnTxHash}`);
        console.log(`   Mint Transaction: ${result.mintTxHash}`);
        console.log(`   Total Time: ${totalTime}ms`);
        console.log(`   Amount: ${amount} USDC`);

        // Step 4: Check Avalanche balance after transfer
        console.log('\n4️⃣ Checking Avalanche USDC balance after transfer...');
        try {
            const avalancheBalanceAfter = await sdk.getUSDCBalance(finalRecipient, 'avalanche');
            console.log(`   Avalanche USDC Balance: ${avalancheBalanceAfter.formatted.usdc} USDC`);
        } catch (error) {
            console.log('⚠️  Could not check final balance');
        }

        // Step 5: Show explorer links
        console.log('\n🔗 Explorer Links:');
        console.log(`   Base Burn TX: https://sepolia.basescan.org/tx/${result.burnTxHash}`);
        console.log(`   Avalanche Mint TX: https://testnet.snowtrace.io/tx/${result.mintTxHash}`);

        console.log('\n✅ Test completed successfully!');

    } catch (error) {
        console.error('\n❌ Transfer failed:', error.message);
        console.error('Stack trace:', error.stack);
        
        // If it's an attestation timeout, show recovery instructions
        if (error.message.includes('Attestation timeout')) {
            console.log('\n🛠️  Recovery Instructions:');
            console.log('1. Wait a few minutes for attestation to complete');
            console.log('2. Use the recovery function with the burn transaction hash');
            console.log('3. Or try the transfer again');
        }
    }
}

// Run the test
testPrivateKeyTransfer().catch(console.error);
