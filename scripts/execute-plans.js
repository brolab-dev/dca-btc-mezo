const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
    console.log("=== DCA Plan Manual Execution Script ===\n");

    // Get the signer (keeper account)
    const [keeper] = await ethers.getSigners();
    console.log("Keeper address:", keeper.address);
    
    // Check keeper balance
    const balance = await ethers.provider.getBalance(keeper.address);
    console.log("Keeper ETH balance:", ethers.formatEther(balance), "ETH\n");

    // Get DCA contract address from environment or use default
    const DCA_CONTRACT_ADDRESS = process.env.DCA_CONTRACT_ADDRESS || "0x25E22CEE7B3Ab8c8813a83cf2C8C307AB87C070C";
    
    console.log("Connecting to DCA Contract at:", DCA_CONTRACT_ADDRESS);
    
    // Connect to the DCA contract
    const dcaContract = await ethers.getContractAt("DCAContract", DCA_CONTRACT_ADDRESS);
    
    // Verify keeper
    const contractKeeper = await dcaContract.keeper();
    console.log("Contract keeper:", contractKeeper);
    
    if (contractKeeper.toLowerCase() !== keeper.address.toLowerCase()) {
        console.log("\n⚠️  WARNING: You are not the keeper!");
        console.log("Current keeper:", contractKeeper);
        console.log("Your address:", keeper.address);
        console.log("\nYou need to either:");
        console.log("1. Use the keeper account's private key");
        console.log("2. Update the keeper address using updateKeeper() function\n");
        return;
    }
    
    console.log("✅ Keeper verified!\n");
    
    // Get execution fee
    const executionFee = await dcaContract.executionFee();
    console.log("Execution fee per plan:", ethers.formatEther(executionFee), "ETH\n");
    
    // Get all executable plans
    console.log("Fetching executable plans...");
    const executablePlans = await dcaContract.getExecutablePlans();
    
    if (executablePlans.length === 0) {
        console.log("❌ No plans are ready for execution at this time.\n");
        
        // Show some stats
        const nextPlanId = await dcaContract.nextPlanId();
        console.log("Total plans created:", (nextPlanId - 1n).toString());
        
        // Check a few recent plans
        if (nextPlanId > 1n) {
            console.log("\nRecent plans status:");
            const plansToCheck = Math.min(5, Number(nextPlanId - 1n));
            for (let i = Number(nextPlanId - 1n); i > Number(nextPlanId - 1n) - plansToCheck && i > 0; i--) {
                try {
                    const plan = await dcaContract.getPlan(i);
                    const canExecute = await dcaContract.canExecutePlan(i);
                    const nextExecution = await dcaContract.getNextExecutionTime(i);
                    
                    console.log(`\nPlan #${i}:`);
                    console.log(`  Owner: ${plan.user}`);
                    console.log(`  Active: ${plan.isActive}`);
                    console.log(`  Amount per execution: ${ethers.formatEther(plan.amountPerExecution)} mUSD`);
                    console.log(`  Executions: ${plan.totalExecutions}/${plan.maxExecutions === 0n ? '∞' : plan.maxExecutions}`);
                    console.log(`  Can execute now: ${canExecute}`);
                    
                    if (!canExecute && plan.isActive) {
                        const now = Math.floor(Date.now() / 1000);
                        const timeUntil = Number(nextExecution) - now;
                        if (timeUntil > 0) {
                            console.log(`  Next execution in: ${Math.floor(timeUntil / 60)} minutes`);
                        }
                    }
                } catch (error) {
                    console.log(`  Error checking plan #${i}:`, error.message);
                }
            }
        }
        return;
    }
    
    console.log(`✅ Found ${executablePlans.length} executable plan(s):\n`);
    
    // Display details of executable plans
    for (const planId of executablePlans) {
        try {
            const plan = await dcaContract.getPlan(planId);
            console.log(`Plan #${planId}:`);
            console.log(`  Owner: ${plan.user}`);
            console.log(`  Amount: ${ethers.formatEther(plan.amountPerExecution)} mUSD`);
            console.log(`  Executions: ${plan.totalExecutions}/${plan.maxExecutions === 0n ? '∞' : plan.maxExecutions}`);
            console.log(`  Time cycle: ${plan.timeCycle} seconds`);
            console.log("");
        } catch (error) {
            console.log(`  Error fetching plan #${planId}:`, error.message);
        }
    }
    
    // Estimate gas cost
    const estimatedGasCost = executionFee * BigInt(executablePlans.length);
    console.log(`Estimated total cost: ${ethers.formatEther(estimatedGasCost)} ETH\n`);
    
    // Check if keeper has enough balance
    if (balance < estimatedGasCost) {
        console.log("⚠️  WARNING: Insufficient ETH balance for execution!");
        console.log(`Required: ${ethers.formatEther(estimatedGasCost)} ETH`);
        console.log(`Available: ${ethers.formatEther(balance)} ETH\n`);
        return;
    }
    
    // Execute plans
    console.log("Executing plans...\n");

    let tx;
    try {
        if (executablePlans.length === 1) {
            // Execute single plan
            console.log(`Executing plan #${executablePlans[0]}...`);
            tx = await dcaContract.executePlan(executablePlans[0]);
            console.log("Transaction hash:", tx.hash);
            console.log("Waiting for confirmation...");

            const receipt = await tx.wait();
            console.log("✅ Plan executed successfully!");
            console.log("Gas used:", receipt.gasUsed.toString());
            console.log("Block number:", receipt.blockNumber);
        } else {
            // Batch execute multiple plans
            console.log(`Batch executing ${executablePlans.length} plans...`);
            tx = await dcaContract.batchExecutePlans(executablePlans);
            console.log("Transaction hash:", tx.hash);
            console.log("Waiting for confirmation...");

            const receipt = await tx.wait();
            console.log(`✅ Successfully executed ${executablePlans.length} plans!`);
            console.log("Gas used:", receipt.gasUsed.toString());
            console.log("Block number:", receipt.blockNumber);
        }

        // Parse events to show execution details
        console.log("\nExecution details:");
        const receipt = await ethers.provider.getTransactionReceipt(tx.hash);
        const planExecutedTopic = ethers.id("PlanExecuted(uint256,address,uint256,uint256,uint256)");

        const executionEvents = receipt.logs.filter(log => log.topics[0] === planExecutedTopic);

        for (const event of executionEvents) {
            const decoded = dcaContract.interface.parseLog({
                topics: event.topics,
                data: event.data
            });

            console.log(`\nPlan #${decoded.args.planId}:`);
            console.log(`  User: ${decoded.args.user}`);
            console.log(`  Amount In: ${ethers.formatEther(decoded.args.amountIn)} mUSD`);
            console.log(`  Amount Out: ${ethers.formatEther(decoded.args.amountOut)} BTC`);
            console.log(`  Execution #${decoded.args.executionNumber}`);
        }
        
    } catch (error) {
        console.error("\n❌ Error executing plans:");
        console.error(error.message);
        
        if (error.message.includes("Only keeper can execute plans")) {
            console.log("\n⚠️  You are not authorized as the keeper!");
        } else if (error.message.includes("Plan cannot be executed")) {
            console.log("\n⚠️  One or more plans cannot be executed. They may have been executed by someone else.");
        } else if (error.message.includes("Insufficient mUSD balance")) {
            console.log("\n⚠️  Plan owner has insufficient mUSD balance!");
        } else if (error.message.includes("Insufficient mUSD allowance")) {
            console.log("\n⚠️  Plan owner needs to approve more mUSD!");
        }
    }
    
    console.log("\n=== Execution Complete ===\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

