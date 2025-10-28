const { ethers } = require("hardhat");
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
require("dotenv").config();

// Configuration
const CHECK_INTERVAL = 60 * 1000; // Check every 60 seconds
const MIN_ETH_BALANCE = ethers.parseEther("0.01"); // Minimum ETH balance to continue operating

// Telegram configuration
const TELEGRAM_ENABLED = process.env.TELEGRAM_BOT_ENABLED === 'true';
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const DB_FILE = path.join(__dirname, '../data/telegram-users.json');

let telegramBot = null;

// Initialize Telegram bot if enabled
if (TELEGRAM_ENABLED && TELEGRAM_TOKEN) {
    try {
        telegramBot = new TelegramBot(TELEGRAM_TOKEN);
        console.log('✅ Telegram notifications enabled');
    } catch (error) {
        console.warn('⚠️  Failed to initialize Telegram bot:', error.message);
    }
} else {
    console.log('ℹ️  Telegram notifications disabled');
}

// Load Telegram users database
function loadTelegramUsers() {
    if (fs.existsSync(DB_FILE)) {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(data);
    }
    return {};
}

// Send Telegram notification
async function sendTelegramNotification(walletAddress, planId, amountIn, amountOut, txHash) {
    if (!telegramBot) return;

    try {
        const db = loadTelegramUsers();
        const userData = db[walletAddress.toLowerCase()];

        if (!userData) return; // User not linked

        const message =
            `🎉 *Plan Executed!*\n\n` +
            `📋 Plan #${planId}\n` +
            `💵 ${ethers.formatEther(amountIn)} mUSD → ${parseFloat(ethers.formatEther(amountOut)).toFixed(8)} BTC\n` +
            `💰 Price: ${(Number(ethers.formatEther(amountIn)) / Number(ethers.formatEther(amountOut))).toFixed(2)} mUSD/BTC\n\n` +
            `[View Transaction](https://explorer.test.mezo.org/tx/${txHash})`;

        await telegramBot.sendMessage(userData.chatId, message, { parse_mode: 'Markdown' });
        console.log(`  ✅ Telegram notification sent to ${userData.username || 'user'}`);
    } catch (error) {
        console.error(`  ⚠️  Failed to send Telegram notification:`, error.message);
    }
}

class KeeperBot {
    constructor(contractAddress, checkInterval = CHECK_INTERVAL) {
        this.contractAddress = contractAddress;
        this.checkInterval = checkInterval;
        this.isRunning = false;
        this.dcaContract = null;
        this.keeper = null;
        this.executionCount = 0;
        this.lastCheckTime = null;
    }

    async initialize() {
        console.log("=== DCA Keeper Bot Initializing ===\n");
        
        // Get the signer (keeper account)
        [this.keeper] = await ethers.getSigners();
        console.log("Keeper address:", this.keeper.address);
        
        // Check keeper balance
        const balance = await ethers.provider.getBalance(this.keeper.address);
        console.log("Keeper ETH balance:", ethers.formatEther(balance), "ETH");
        
        if (balance < MIN_ETH_BALANCE) {
            throw new Error(`Insufficient ETH balance. Minimum required: ${ethers.formatEther(MIN_ETH_BALANCE)} ETH`);
        }
        
        // Connect to the DCA contract
        console.log("\nConnecting to DCA Contract at:", this.contractAddress);
        this.dcaContract = await ethers.getContractAt("DCAContract", this.contractAddress);
        
        // Verify keeper
        const contractKeeper = await this.dcaContract.keeper();
        console.log("Contract keeper:", contractKeeper);
        
        if (contractKeeper.toLowerCase() !== this.keeper.address.toLowerCase()) {
            throw new Error(
                `Not authorized as keeper!\n` +
                `Contract keeper: ${contractKeeper}\n` +
                `Your address: ${this.keeper.address}\n` +
                `Update the keeper using updateKeeper() function or use the correct private key.`
            );
        }
        
        console.log("✅ Keeper verified!\n");
        
        // Get execution fee
        const executionFee = await this.dcaContract.executionFee();
        console.log("Execution fee per plan:", ethers.formatEther(executionFee), "ETH");
        console.log("Check interval:", this.checkInterval / 1000, "seconds\n");
        
        console.log("=== Keeper Bot Ready ===\n");
    }

    async checkAndExecutePlans() {
        try {
            this.lastCheckTime = new Date();
            const timestamp = this.lastCheckTime.toLocaleString();
            
            console.log(`[${timestamp}] Checking for executable plans...`);
            
            // Check keeper balance
            const balance = await ethers.provider.getBalance(this.keeper.address);
            if (balance < MIN_ETH_BALANCE) {
                console.log(`⚠️  WARNING: Low ETH balance: ${ethers.formatEther(balance)} ETH`);
                console.log(`   Minimum required: ${ethers.formatEther(MIN_ETH_BALANCE)} ETH`);
                console.log(`   Please top up the keeper account!\n`);
                return;
            }
            
            // Get executable plans
            const executablePlans = await this.dcaContract.getExecutablePlans();
            
            if (executablePlans.length === 0) {
                console.log(`   No plans ready for execution.\n`);
                return;
            }
            
            console.log(`   ✅ Found ${executablePlans.length} executable plan(s): [${executablePlans.join(', ')}]`);
            
            // Execute plans
            await this.executePlans(executablePlans);
            
        } catch (error) {
            console.error(`   ❌ Error during check:`, error.message);
            console.log("");
        }
    }

    async executePlans(planIds) {
        try {
            let tx;
            
            if (planIds.length === 1) {
                console.log(`   Executing plan #${planIds[0]}...`);
                tx = await this.dcaContract.executePlan(planIds[0]);
            } else {
                console.log(`   Batch executing ${planIds.length} plans...`);
                tx = await this.dcaContract.batchExecutePlans(planIds);
            }
            
            console.log(`   Transaction hash: ${tx.hash}`);
            console.log(`   Waiting for confirmation...`);
            
            const receipt = await tx.wait();
            
            console.log(`   ✅ Execution successful!`);
            console.log(`   Gas used: ${receipt.gasUsed.toString()}`);
            console.log(`   Block: ${receipt.blockNumber}`);
            
            // Parse and display execution details
            const planExecutedTopic = ethers.id("PlanExecuted(uint256,address,uint256,uint256,uint256)");
            const executionEvents = receipt.logs.filter(log => log.topics[0] === planExecutedTopic);
            
            for (const event of executionEvents) {
                const decoded = this.dcaContract.interface.parseLog({
                    topics: event.topics,
                    data: event.data
                });

                this.executionCount++;
                console.log(`   Plan #${decoded.args.planId}: ${ethers.formatEther(decoded.args.amountIn)} mUSD → ${ethers.formatEther(decoded.args.amountOut)} BTC (Execution #${decoded.args.executionNumber})`);

                // Send Telegram notification
                await sendTelegramNotification(
                    decoded.args.user,
                    decoded.args.planId,
                    decoded.args.amountIn,
                    decoded.args.amountOut,
                    tx.hash
                );
            }
            
            console.log("");
            
        } catch (error) {
            console.error(`   ❌ Execution failed:`, error.message);
            
            if (error.message.includes("Only keeper can execute plans")) {
                console.log(`   ⚠️  Not authorized as keeper!`);
            } else if (error.message.includes("Plan cannot be executed")) {
                console.log(`   ⚠️  Plan was already executed or is not ready.`);
            } else if (error.message.includes("Insufficient mUSD balance")) {
                console.log(`   ⚠️  Plan owner has insufficient mUSD balance.`);
            } else if (error.message.includes("Insufficient mUSD allowance")) {
                console.log(`   ⚠️  Plan owner needs to approve more mUSD.`);
            }
            
            console.log("");
        }
    }

    async start() {
        if (this.isRunning) {
            console.log("Keeper bot is already running!");
            return;
        }
        
        await this.initialize();
        
        this.isRunning = true;
        console.log("🤖 Keeper bot started. Press Ctrl+C to stop.\n");
        
        // Initial check
        await this.checkAndExecutePlans();
        
        // Set up interval for periodic checks
        this.intervalId = setInterval(async () => {
            if (this.isRunning) {
                await this.checkAndExecutePlans();
            }
        }, this.checkInterval);
    }

    stop() {
        if (!this.isRunning) {
            console.log("Keeper bot is not running!");
            return;
        }
        
        this.isRunning = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        
        console.log("\n=== Keeper Bot Stopped ===");
        console.log(`Total executions: ${this.executionCount}`);
        console.log(`Last check: ${this.lastCheckTime ? this.lastCheckTime.toLocaleString() : 'N/A'}`);
    }

    getStatus() {
        return {
            isRunning: this.isRunning,
            executionCount: this.executionCount,
            lastCheckTime: this.lastCheckTime,
            keeperAddress: this.keeper?.address,
            contractAddress: this.contractAddress,
            checkInterval: this.checkInterval
        };
    }
}

// Main execution
async function main() {
    // Get DCA contract address from environment or use default
    const DCA_CONTRACT_ADDRESS = process.env.DCA_CONTRACT_ADDRESS || "0x29C17CD908EF3087812760C099735AA7f1cDacA4";
    
    // Get check interval from environment (in seconds) or use default
    const checkIntervalSeconds = process.env.KEEPER_CHECK_INTERVAL || 60;
    const checkInterval = checkIntervalSeconds * 1000;
    
    // Create and start keeper bot
    const keeper = new KeeperBot(DCA_CONTRACT_ADDRESS, checkInterval);
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log("\n\nReceived SIGINT signal...");
        keeper.stop();
        process.exit(0);
    });
    
    process.on('SIGTERM', () => {
        console.log("\n\nReceived SIGTERM signal...");
        keeper.stop();
        process.exit(0);
    });
    
    // Start the keeper bot
    try {
        await keeper.start();
    } catch (error) {
        console.error("\n❌ Failed to start keeper bot:");
        console.error(error.message);
        process.exit(1);
    }
}

// Run the keeper bot
if (require.main === module) {
    main().catch((error) => {
        console.error(error);
        process.exit(1);
    });
}

module.exports = KeeperBot;

