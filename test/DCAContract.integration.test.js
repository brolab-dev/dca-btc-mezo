const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DCAContract - Real Integration Tests", function () {
    let dcaContract;
    let owner;
    let user1;
    let user2;
    let musdToken;

    // Deployed contract addresses on Mezo Testnet
    const DCA_CONTRACT_ADDRESS = "0x25E22CEE7B3Ab8c8813a83cf2C8C307AB87C070C";
    const MUSD_TOKEN_ADDRESS = "0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503";
    const BTC_TOKEN_ADDRESS = "0x7b7C000000000000000000000000000000000000";
    const ROUTER_ADDRESS = "0x9a1ff7FE3a0F69959A3fBa1F1e5ee18e1A9CD7E9";

    const ONE_HOUR = 3600;
    const ONE_DAY = 86400;

    before(async function () {
        const signers = await ethers.getSigners();
        owner = signers[0];
        user1 = signers[0]; // Use same signer for testing
        user2 = signers[0]; // Use same signer for testing

        console.log("\n=== Real Integration Test Setup ===");
        console.log("DCA Contract:", DCA_CONTRACT_ADDRESS);
        console.log("mUSD Token:", MUSD_TOKEN_ADDRESS);
        console.log("Available signers:", signers.length);
        console.log("Test user:", user1.address);

        // Connect to deployed contracts
        dcaContract = await ethers.getContractAt("DCAContract", DCA_CONTRACT_ADDRESS);
        musdToken = await ethers.getContractAt("IERC20", MUSD_TOKEN_ADDRESS);
        
        // Check user balance
        try {
            const balance = await musdToken.balanceOf(user1.address);
            console.log("User1 mUSD balance:", ethers.formatEther(balance));
            
            if (balance === 0n) {
                console.log("⚠️  WARNING: User has no mUSD tokens. Some tests may fail.");
                console.log("   To get mUSD tokens, visit the Mezo testnet faucet or bridge.");
            }
        } catch (error) {
            console.log("Could not fetch balance:", error.message);
        }

        // Check contract state
        try {
            const executionFee = await dcaContract.executionFee();
            console.log("Current execution fee:", ethers.formatEther(executionFee), "ETH");
        } catch (error) {
            console.log("Could not fetch execution fee:", error.message);
        }
    });

    describe("Contract State Verification", function () {
        it("Should connect to deployed DCA contract", async function () {
            expect(dcaContract.target).to.equal(DCA_CONTRACT_ADDRESS);
        });

        it("Should have correct execution fee", async function () {
            const executionFee = await dcaContract.executionFee();
            expect(executionFee).to.be.gt(0);
            console.log("    Execution fee:", ethers.formatEther(executionFee), "ETH");
        });

        it("Should have correct token addresses", async function () {
            const musdAddress = await dcaContract.musdToken();
            const btcAddress = await dcaContract.btcToken();
            const routerAddress = await dcaContract.swapRouter();
            
            expect(musdAddress).to.equal(MUSD_TOKEN_ADDRESS);
            expect(btcAddress).to.equal(BTC_TOKEN_ADDRESS);
            expect(routerAddress).to.equal(ROUTER_ADDRESS);
        });
    });

    describe("Plan Creation - Real Tests", function () {
        it("Should create a DCA plan with real ETH payment", async function () {
            const amountPerExecution = ethers.parseEther("10"); // Smaller amount for testing
            const timeCycle = ONE_DAY;
            const maxExecutions = 2; // Fewer executions for testing

            const executionFee = await dcaContract.executionFee();
            
            const tx = await dcaContract.connect(user1).createPlan(
                amountPerExecution,
                timeCycle,
                maxExecutions,
                { value: executionFee }
            );

            const receipt = await tx.wait();
            console.log("    Plan created in tx:", receipt.hash);
            console.log("    Gas used:", receipt.gasUsed.toString());

            // Get the plan ID from events
            const planCreatedEvent = receipt.logs.find(
                log => log.topics[0] === ethers.id("PlanCreated(uint256,address,uint256,uint256,uint256)")
            );
            
            if (planCreatedEvent) {
                const planId = parseInt(planCreatedEvent.topics[1], 16);
                console.log("    Created plan ID:", planId);
                
                const plan = await dcaContract.getPlan(planId);
                expect(plan.user).to.equal(user1.address);
                expect(plan.amountPerExecution).to.equal(amountPerExecution);
                expect(plan.isActive).to.be.true;
            }
        });

        it("Should fail with insufficient execution fee", async function () {
            const amountPerExecution = ethers.parseEther("10");
            const timeCycle = ONE_DAY;
            const maxExecutions = 1;

            const executionFee = await dcaContract.executionFee();
            const insufficientFee = executionFee / 2n;

            await expect(
                dcaContract.connect(user1).createPlan(
                    amountPerExecution,
                    timeCycle,
                    maxExecutions,
                    { value: insufficientFee }
                )
            ).to.be.revertedWith("Insufficient execution fee");
        });
    });

    describe("Plan Management - Real Tests", function () {
        let testPlanId;

        beforeEach(async function () {
            // Create a test plan
            const executionFee = await dcaContract.executionFee();
            const tx = await dcaContract.connect(user1).createPlan(
                ethers.parseEther("5"),
                ONE_HOUR,
                1,
                { value: executionFee }
            );
            
            const receipt = await tx.wait();
            const planCreatedEvent = receipt.logs.find(
                log => log.topics[0] === ethers.id("PlanCreated(uint256,address,uint256,uint256,uint256)")
            );
            
            if (planCreatedEvent) {
                testPlanId = parseInt(planCreatedEvent.topics[1], 16);
            }
        });

        it("Should retrieve user's plans", async function () {
            const userPlans = await dcaContract.getUserPlans(user1.address);
            expect(userPlans.length).to.be.gt(0);
            console.log("    User has", userPlans.length.toString(), "plans");
        });

        it("Should stop a plan", async function () {
            if (testPlanId) {
                await expect(dcaContract.connect(user1).stopPlan(testPlanId))
                    .to.emit(dcaContract, "PlanStopped")
                    .withArgs(testPlanId, user1.address);

                const plan = await dcaContract.getPlan(testPlanId);
                expect(plan.isActive).to.be.false;
            }
        });
    });

    describe("Token Approval Tests", function () {
        it("Should check mUSD approval status", async function () {
            const hasApproval = await dcaContract.hasUserApprovedSufficientMUSD(user1.address);
            console.log("    User has sufficient mUSD approval:", hasApproval);
            
            if (!hasApproval) {
                console.log("    💡 To approve mUSD spending, run:");
                console.log(`    await musdToken.connect(user1).approve("${DCA_CONTRACT_ADDRESS}", ethers.MaxUint256);`);
            }
        });

        it("Should approve mUSD spending if user has balance", async function () {
            const balance = await musdToken.balanceOf(user1.address);
            
            if (balance > 0n) {
                const tx = await musdToken.connect(user1).approve(
                    DCA_CONTRACT_ADDRESS,
                    ethers.MaxUint256
                );
                await tx.wait();
                console.log("    ✅ mUSD approval granted");
                
                const hasApproval = await dcaContract.hasUserApprovedSufficientMUSD(user1.address);
                expect(hasApproval).to.be.true;
            } else {
                console.log("    ⚠️  Skipping approval test - user has no mUSD balance");
            }
        });
    });

    describe("Execution Readiness Tests", function () {
        let executablePlanId;

        before(async function () {
            // Create a plan that can be executed immediately
            const balance = await musdToken.balanceOf(user1.address);
            
            if (balance > ethers.parseEther("1")) {
                const executionFee = await dcaContract.executionFee();
                const tx = await dcaContract.connect(user1).createPlan(
                    ethers.parseEther("1"),
                    ONE_HOUR,
                    1,
                    { value: executionFee }
                );
                
                const receipt = await tx.wait();
                const planCreatedEvent = receipt.logs.find(
                    log => log.topics[0] === ethers.id("PlanCreated(uint256,address,uint256,uint256,uint256)")
                );
                
                if (planCreatedEvent) {
                    executablePlanId = parseInt(planCreatedEvent.topics[1], 16);
                }
            }
        });

        it("Should check if plans can be executed", async function () {
            if (executablePlanId) {
                const canExecute = await dcaContract.canExecutePlan(executablePlanId);
                console.log("    Plan", executablePlanId, "can be executed:", canExecute);
            }
        });

        it("Should get executable plans", async function () {
            const executablePlans = await dcaContract.getExecutablePlans();
            console.log("    Total executable plans:", executablePlans.length.toString());
            
            if (executablePlans.length > 0) {
                console.log("    Executable plan IDs:", executablePlans.map(id => id.toString()));
            }
        });
    });

    describe("Admin Functions Tests", function () {
        it("Should show current contract owner", async function () {
            try {
                const contractOwner = await dcaContract.owner();
                console.log("    Contract owner:", contractOwner);
                console.log("    Test owner:", owner.address);
                console.log("    Is test owner the contract owner:", contractOwner === owner.address);
            } catch (error) {
                console.log("    Could not fetch contract owner:", error.message);
            }
        });

        it("Should check contract balance", async function () {
            const contractBalance = await ethers.provider.getBalance(DCA_CONTRACT_ADDRESS);
            console.log("    Contract ETH balance:", ethers.formatEther(contractBalance), "ETH");
        });
    });
});
