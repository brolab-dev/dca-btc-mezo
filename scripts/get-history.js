const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
    console.log("=== DCA Execution History ===\n");

    // Get user address from command line or use default
    const userAddress = process.argv[2] || process.env.USER_ADDRESS;
    
    if (!userAddress) {
        console.log("Usage: npm run history [USER_ADDRESS]");
        console.log("Or set USER_ADDRESS in .env file\n");
        
        // Get the signer address as default
        const [signer] = await ethers.getSigners();
        console.log("Using signer address:", signer.address);
        console.log("");
        await fetchHistory(signer.address);
    } else {
        console.log("Fetching history for:", userAddress);
        console.log("");
        await fetchHistory(userAddress);
    }
}

async function fetchHistory(userAddress) {
    try {
        // Get DCA contract address from environment or use default
        const DCA_CONTRACT_ADDRESS = process.env.DCA_CONTRACT_ADDRESS || "0x29C17CD908EF3087812760C099735AA7f1cDacA4";
        
        console.log("DCA Contract:", DCA_CONTRACT_ADDRESS);
        console.log("");
        
        // Connect to the DCA contract
        const dcaContract = await ethers.getContractAt("DCAContract", DCA_CONTRACT_ADDRESS);

        // Get current block number
        const latestBlock = await ethers.provider.getBlockNumber();

        // Mezo testnet has a 10,000 block limit for getLogs
        // We'll query in chunks to avoid this limitation
        const BLOCK_CHUNK_SIZE = 10000;
        const CONTRACT_DEPLOY_BLOCK = 8309000; // Approximate deploy block

        let allEvents = [];
        let fromBlock = CONTRACT_DEPLOY_BLOCK;

        console.log(`Scanning blocks ${CONTRACT_DEPLOY_BLOCK} to ${latestBlock}...`);

        // Query in chunks
        const filter = dcaContract.filters.PlanExecuted(null, userAddress);

        while (fromBlock <= latestBlock) {
            const toBlock = Math.min(fromBlock + BLOCK_CHUNK_SIZE, latestBlock);

            try {
                const events = await dcaContract.queryFilter(filter, fromBlock, toBlock);
                allEvents = [...allEvents, ...events];

                if (events.length > 0) {
                    console.log(`  Found ${events.length} event(s) in blocks ${fromBlock}-${toBlock}`);
                }
            } catch (chunkError) {
                console.warn(`  Warning: Error querying blocks ${fromBlock}-${toBlock}:`, chunkError.message);
            }

            fromBlock = toBlock + 1;
        }

        const events = allEvents;
        
        if (events.length === 0) {
            console.log("❌ No execution history found for this address.\n");
            console.log("This could mean:");
            console.log("  • No DCA plans have been executed yet");
            console.log("  • The address has no active plans");
            console.log("  • Plans are scheduled but haven't executed yet\n");
            return;
        }
        
        console.log(`✅ Found ${events.length} execution(s)\n`);
        console.log("=".repeat(100));
        
        let totalMUSD = 0n;
        let totalBTC = 0n;
        
        // Display each execution
        for (let i = 0; i < events.length; i++) {
            const event = events[i];
            const { planId, user, amountIn, amountOut, executionNumber } = event.args;
            
            // Get block details for timestamp
            const block = await ethers.provider.getBlock(event.blockNumber);
            const timestamp = new Date(Number(block.timestamp) * 1000);
            
            // Calculate price
            const price = (Number(ethers.formatEther(amountIn)) / Number(ethers.formatEther(amountOut))).toFixed(2);
            
            console.log(`\n📊 Execution #${i + 1}`);
            console.log("-".repeat(100));
            console.log(`Plan ID:           #${planId}`);
            console.log(`Execution Number:  #${executionNumber}`);
            console.log(`Date:              ${timestamp.toLocaleString()}`);
            console.log(`Time Ago:          ${getTimeAgo(timestamp)}`);
            console.log("");
            console.log(`mUSD Spent:        ${ethers.formatEther(amountIn)} mUSD`);
            console.log(`BTC Received:      ${ethers.formatEther(amountOut)} BTC`);
            console.log(`Price:             ${price} mUSD/BTC`);
            console.log("");
            console.log(`Transaction:       ${event.transactionHash}`);
            console.log(`Block:             ${event.blockNumber}`);
            console.log(`Explorer:          https://explorer.test.mezo.org/tx/${event.transactionHash}`);
            
            totalMUSD += amountIn;
            totalBTC += amountOut;
        }
        
        // Summary statistics
        console.log("\n" + "=".repeat(100));
        console.log("\n📈 SUMMARY STATISTICS\n");
        console.log("-".repeat(100));
        console.log(`Total Executions:  ${events.length}`);
        console.log(`Total mUSD Spent:  ${ethers.formatEther(totalMUSD)} mUSD`);
        console.log(`Total BTC Acquired: ${ethers.formatEther(totalBTC)} BTC`);
        console.log(`Average Price:     ${(Number(ethers.formatEther(totalMUSD)) / Number(ethers.formatEther(totalBTC))).toFixed(2)} mUSD/BTC`);

        // Calculate average per execution using Number conversion
        const avgPerExec = Number(ethers.formatEther(totalMUSD)) / events.length;
        console.log(`Average per Exec:  ${avgPerExec.toFixed(4)} mUSD`);
        
        // Get user's current plans
        console.log("\n" + "=".repeat(100));
        console.log("\n📋 ACTIVE PLANS\n");
        console.log("-".repeat(100));
        
        const planIds = await dcaContract.getUserPlans(userAddress);
        
        if (planIds.length === 0) {
            console.log("No active plans found.");
        } else {
            for (const planId of planIds) {
                const plan = await dcaContract.getPlan(planId);
                
                if (plan.isActive) {
                    const nextExecution = await dcaContract.getNextExecutionTime(planId);
                    const canExecute = await dcaContract.canExecutePlan(planId);
                    
                    console.log(`\nPlan #${planId}:`);
                    console.log(`  Amount per execution: ${ethers.formatEther(plan.amountPerExecution)} mUSD`);
                    console.log(`  Time cycle: ${plan.timeCycle} seconds (${Number(plan.timeCycle) / 3600} hours)`);
                    console.log(`  Executions: ${plan.totalExecutions}/${plan.maxExecutions === 0n ? '∞' : plan.maxExecutions}`);
                    console.log(`  Can execute now: ${canExecute ? '✅ Yes' : '❌ No'}`);
                    
                    if (!canExecute && nextExecution > 0n) {
                        const now = Math.floor(Date.now() / 1000);
                        const timeUntil = Number(nextExecution) - now;
                        if (timeUntil > 0) {
                            console.log(`  Next execution: ${getTimeUntil(timeUntil)}`);
                        }
                    }
                }
            }
        }
        
        console.log("\n" + "=".repeat(100) + "\n");
        
    } catch (error) {
        console.error("\n❌ Error fetching history:");
        console.error(error.message);
        console.log("");
    }
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return `${seconds} seconds ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
}

function getTimeUntil(seconds) {
    if (seconds < 60) return `in ${seconds} seconds`;
    if (seconds < 3600) return `in ${Math.floor(seconds / 60)} minutes`;
    if (seconds < 86400) return `in ${Math.floor(seconds / 3600)} hours`;
    return `in ${Math.floor(seconds / 86400)} days`;
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

