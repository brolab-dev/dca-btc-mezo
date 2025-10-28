const TelegramBot = require('node-telegram-bot-api');
const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');
require("dotenv").config();

// Database file for storing wallet-to-chatId mappings
const DB_FILE = path.join(__dirname, '../data/telegram-users.json');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Load or initialize database
function loadDatabase() {
    if (fs.existsSync(DB_FILE)) {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(data);
    }
    return {};
}

function saveDatabase(db) {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// Initialize bot
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
    console.error('❌ TELEGRAM_BOT_TOKEN not found in .env file');
    console.log('Please add your Telegram bot token to .env:');
    console.log('TELEGRAM_BOT_TOKEN=your_bot_token_here');
    process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });
const DCA_CONTRACT_ADDRESS = process.env.DCA_CONTRACT_ADDRESS || "0x29C17CD908EF3087812760C099735AA7f1cDacA4";

console.log('🤖 Telegram Bot Started!');
console.log('Bot is ready to receive commands...\n');

// /start command - Link wallet to Telegram
bot.onText(/\/start(.*)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const walletAddress = match[1].trim();
    
    if (!walletAddress) {
        bot.sendMessage(chatId, 
            '👋 Welcome to DCA Protocol Bot!\n\n' +
            'To link your wallet, use:\n' +
            '`/start YOUR_WALLET_ADDRESS`\n\n' +
            'Or get a linking URL from the DCA Protocol web app.',
            { parse_mode: 'Markdown' }
        );
        return;
    }
    
    // Validate wallet address
    if (!ethers.isAddress(walletAddress)) {
        bot.sendMessage(chatId, '❌ Invalid wallet address. Please check and try again.');
        return;
    }
    
    // Store mapping
    const db = loadDatabase();
    db[walletAddress.toLowerCase()] = {
        chatId: chatId,
        username: msg.from.username || msg.from.first_name,
        linkedAt: new Date().toISOString()
    };
    saveDatabase(db);
    
    bot.sendMessage(chatId,
        `✅ Wallet linked successfully!\n\n` +
        `📍 Address: \`${walletAddress}\`\n\n` +
        `You will now receive notifications when your DCA plans execute.\n\n` +
        `Use /help to see available commands.`,
        { parse_mode: 'Markdown' }
    );
});

// /help command
bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId,
        '📚 *Available Commands:*\n\n' +
        '/start WALLET - Link your wallet address\n' +
        '/wallet - View your linked wallet\n' +
        '/plans - View your active DCA plans\n' +
        '/history - View execution history\n' +
        '/unlink - Unlink your wallet\n' +
        '/help - Show this help message\n\n' +
        '💡 You will receive automatic notifications when your plans execute!',
        { parse_mode: 'Markdown' }
    );
});

// /wallet command
bot.onText(/\/wallet/, async (msg) => {
    const chatId = msg.chat.id;
    const db = loadDatabase();
    
    // Find wallet for this chatId
    const entry = Object.entries(db).find(([_, data]) => data.chatId === chatId);
    
    if (!entry) {
        bot.sendMessage(chatId, 
            '❌ No wallet linked.\n\n' +
            'Use /start YOUR_WALLET_ADDRESS to link your wallet.',
            { parse_mode: 'Markdown' }
        );
        return;
    }
    
    const [walletAddress, userData] = entry;
    
    try {
        const provider = ethers.provider;
        const balance = await provider.getBalance(walletAddress);
        
        bot.sendMessage(chatId,
            `💼 *Your Wallet*\n\n` +
            `📍 Address: \`${walletAddress}\`\n` +
            `💰 Balance: ${ethers.formatEther(balance)} ETH\n` +
            `🔗 Linked: ${new Date(userData.linkedAt).toLocaleString()}\n\n` +
            `[View on Explorer](https://explorer.test.mezo.org/address/${walletAddress})`,
            { parse_mode: 'Markdown' }
        );
    } catch (error) {
        bot.sendMessage(chatId, '❌ Error fetching wallet information.');
    }
});

// /plans command
bot.onText(/\/plans/, async (msg) => {
    const chatId = msg.chat.id;
    const db = loadDatabase();
    
    const entry = Object.entries(db).find(([_, data]) => data.chatId === chatId);
    
    if (!entry) {
        bot.sendMessage(chatId, '❌ No wallet linked. Use /start YOUR_WALLET_ADDRESS');
        return;
    }
    
    const [walletAddress] = entry;
    
    try {
        const dcaContract = await ethers.getContractAt("DCAContract", DCA_CONTRACT_ADDRESS);
        const planIds = await dcaContract.getUserPlans(walletAddress);
        
        if (planIds.length === 0) {
            bot.sendMessage(chatId, '📋 You have no active DCA plans.');
            return;
        }
        
        let message = `📋 *Your DCA Plans* (${planIds.length})\n\n`;
        
        for (const planId of planIds) {
            const plan = await dcaContract.getPlan(planId);
            
            if (plan.isActive) {
                const canExecute = await dcaContract.canExecutePlan(planId);
                const nextExecution = await dcaContract.getNextExecutionTime(planId);
                
                message += `*Plan #${planId}*\n`;
                message += `💵 Amount: ${ethers.formatEther(plan.amountPerExecution)} mUSD\n`;
                message += `⏱ Cycle: ${Number(plan.timeCycle) / 3600} hours\n`;
                message += `📊 Progress: ${plan.totalExecutions}/${plan.maxExecutions === 0n ? '∞' : plan.maxExecutions}\n`;
                message += `${canExecute ? '✅' : '⏳'} ${canExecute ? 'Ready to execute' : 'Waiting'}\n`;
                
                if (!canExecute && nextExecution > 0n) {
                    const now = Math.floor(Date.now() / 1000);
                    const timeUntil = Number(nextExecution) - now;
                    if (timeUntil > 0) {
                        message += `⏰ Next: ${formatTimeUntil(timeUntil)}\n`;
                    }
                }
                message += '\n';
            }
        }
        
        bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error('Error fetching plans:', error);
        bot.sendMessage(chatId, '❌ Error fetching plans.');
    }
});

// /history command
bot.onText(/\/history/, async (msg) => {
    const chatId = msg.chat.id;
    const db = loadDatabase();
    
    const entry = Object.entries(db).find(([_, data]) => data.chatId === chatId);
    
    if (!entry) {
        bot.sendMessage(chatId, '❌ No wallet linked. Use /start YOUR_WALLET_ADDRESS');
        return;
    }
    
    const [walletAddress] = entry;
    
    try {
        const dcaContract = await ethers.getContractAt("DCAContract", DCA_CONTRACT_ADDRESS);
        
        // Get execution events
        const latestBlock = await ethers.provider.getBlockNumber();
        const BLOCK_CHUNK_SIZE = 10000;
        const CONTRACT_DEPLOY_BLOCK = 8309000;
        
        let allEvents = [];
        let fromBlock = CONTRACT_DEPLOY_BLOCK;
        
        const filter = dcaContract.filters.PlanExecuted(null, walletAddress);
        
        while (fromBlock <= latestBlock) {
            const toBlock = Math.min(fromBlock + BLOCK_CHUNK_SIZE, latestBlock);
            try {
                const events = await dcaContract.queryFilter(filter, fromBlock, toBlock);
                allEvents = [...allEvents, ...events];
            } catch (err) {
                // Skip errors
            }
            fromBlock = toBlock + 1;
        }
        
        if (allEvents.length === 0) {
            bot.sendMessage(chatId, '📊 No execution history found.');
            return;
        }
        
        let message = `📊 *Execution History* (${allEvents.length})\n\n`;
        
        // Show last 5 executions
        const recentEvents = allEvents.slice(-5).reverse();
        
        for (const event of recentEvents) {
            const { planId, amountIn, amountOut, executionNumber } = event.args;
            const block = await ethers.provider.getBlock(event.blockNumber);
            const timestamp = new Date(Number(block.timestamp) * 1000);
            
            message += `*Execution #${executionNumber}* (Plan #${planId})\n`;
            message += `💵 ${ethers.formatEther(amountIn)} mUSD → ${parseFloat(ethers.formatEther(amountOut)).toFixed(8)} BTC\n`;
            message += `📅 ${timestamp.toLocaleString()}\n`;
            message += `[View Tx](https://explorer.test.mezo.org/tx/${event.transactionHash})\n\n`;
        }
        
        if (allEvents.length > 5) {
            message += `_Showing last 5 of ${allEvents.length} executions_\n`;
        }
        
        // Summary
        const totalMUSD = allEvents.reduce((sum, e) => sum + e.args.amountIn, 0n);
        const totalBTC = allEvents.reduce((sum, e) => sum + e.args.amountOut, 0n);
        
        message += `\n📈 *Summary*\n`;
        message += `Total: ${ethers.formatEther(totalMUSD)} mUSD → ${parseFloat(ethers.formatEther(totalBTC)).toFixed(8)} BTC\n`;
        message += `Avg Price: ${(Number(ethers.formatEther(totalMUSD)) / Number(ethers.formatEther(totalBTC))).toFixed(2)} mUSD/BTC`;
        
        bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error('Error fetching history:', error);
        bot.sendMessage(chatId, '❌ Error fetching history.');
    }
});

// /unlink command
bot.onText(/\/unlink/, (msg) => {
    const chatId = msg.chat.id;
    const db = loadDatabase();
    
    const entry = Object.entries(db).find(([_, data]) => data.chatId === chatId);
    
    if (!entry) {
        bot.sendMessage(chatId, '❌ No wallet linked.');
        return;
    }
    
    const [walletAddress] = entry;
    delete db[walletAddress.toLowerCase()];
    saveDatabase(db);
    
    bot.sendMessage(chatId, '✅ Wallet unlinked successfully.');
});

// Helper function
function formatTimeUntil(seconds) {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
}

// Export function to send notifications
async function sendExecutionNotification(walletAddress, planId, amountIn, amountOut, txHash) {
    const db = loadDatabase();
    const userData = db[walletAddress.toLowerCase()];
    
    if (!userData) {
        return; // User not linked
    }
    
    const message = 
        `🎉 *Plan Executed!*\n\n` +
        `📋 Plan #${planId}\n` +
        `💵 ${ethers.formatEther(amountIn)} mUSD → ${parseFloat(ethers.formatEther(amountOut)).toFixed(8)} BTC\n` +
        `💰 Price: ${(Number(ethers.formatEther(amountIn)) / Number(ethers.formatEther(amountOut))).toFixed(2)} mUSD/BTC\n\n` +
        `[View Transaction](https://explorer.test.mezo.org/tx/${txHash})`;
    
    try {
        await bot.sendMessage(userData.chatId, message, { parse_mode: 'Markdown' });
        console.log(`✅ Notification sent to ${userData.username || 'user'}`);
    } catch (error) {
        console.error(`❌ Failed to send notification:`, error.message);
    }
}

module.exports = { sendExecutionNotification };

// Keep bot running
console.log('✅ Bot is running. Press Ctrl+C to stop.\n');

