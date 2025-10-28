const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DCAContract - Main Flow Test", function () {
    let dcaContract;
    let owner;
    let user1;
    let keeper;
    let musdToken;
    let btcToken;
    let router;

    const ONE_HOUR = 3600;
    const ONE_DAY = 86400;

    // Contract addresses on Mezo Testnet
    const dcaContractAddress = "0x25E22CEE7B3Ab8c8813a83cf2C8C307AB87C070C";
    const musdTokenAddress = "0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503";
    const btcTokenAddress = "0x7b7C000000000000000000000000000000000000";
    const routerAddress = "0x9a1ff7FE3a0F69959A3fBa1F1e5ee18e1A9CD7E9";

    before(async function () {
        [owner, user1, keeper] = await ethers.getSigners();

        dcaContract = await ethers.getContractAt("DCAContract", dcaContractAddress);
        musdToken = await ethers.getContractAt("IERC20", musdTokenAddress);
        btcToken = await ethers.getContractAt("IERC20", btcTokenAddress);
        router = await ethers.getContractAt("IRouter", routerAddress);

        console.log("\n=== DCA Contract Main Flow Test ===");
        console.log("DCA Contract:", dcaContractAddress);
        console.log("User address:", user1.address);
        console.log("Keeper address:", keeper.address);
    });

    describe("Plan Creation", function () {
        it("Should create a DCA plan successfully", async function () {
            const amountPerExecution = ethers.parseEther("100");
            const timeCycle = ONE_DAY;
            const maxExecutions = 10;

            await expect(
                dcaContract.connect(user1).createPlan(
                    amountPerExecution,
                    timeCycle,
                    maxExecutions,
                    { value: ethers.parseEther("0.001") }
                )
            ).to.emit(dcaContract, "PlanCreated");

            const plan = await dcaContract.getPlan(1);
            expect(plan.user).to.equal(user1.address);
            expect(plan.amountPerExecution).to.equal(amountPerExecution);
            expect(plan.timeCycle).to.equal(timeCycle);
            expect(plan.maxExecutions).to.equal(maxExecutions);
            expect(plan.isActive).to.be.true;
        });

        it("Should fail to create plan with invalid time cycle", async function () {
            const amountPerExecution = ethers.utils.parseEther("100");
            const invalidTimeCycle = 7200; // 2 hours (not allowed)
            const maxExecutions = 10;

            await expect(
                dcaContract.connect(user1).createPlan(
                    amountPerExecution,
                    invalidTimeCycle,
                    maxExecutions,
                    { value: ethers.utils.parseEther("0.001") }
                )
            ).to.be.revertedWith("Invalid time cycle");
        });

        it("Should fail to create plan with insufficient execution fee", async function () {
            const amountPerExecution = ethers.utils.parseEther("100");
            const timeCycle = ONE_DAY;
            const maxExecutions = 10;

            await expect(
                dcaContract.connect(user1).createPlan(
                    amountPerExecution,
                    timeCycle,
                    maxExecutions,
                    { value: ethers.utils.parseEther("0.0005") } // Less than required fee
                )
            ).to.be.revertedWith("Insufficient execution fee");
        });
    });

    describe("Plan Management", function () {
        beforeEach(async function () {
            // Create a test plan
            await dcaContract.connect(user1).createPlan(
                ethers.utils.parseEther("100"),
                ONE_DAY,
                5,
                { value: ethers.utils.parseEther("0.001") }
            );

            // Approve DCA contract to spend user's mUSD
            await mockMUSD.connect(user1).approve(
                dcaContract.address,
                ethers.constants.MaxUint256
            );
        });

        it("Should stop a plan successfully", async function () {
            await expect(dcaContract.connect(user1).stopPlan(1))
                .to.emit(dcaContract, "PlanStopped")
                .withArgs(1, user1.address);

            const plan = await dcaContract.getPlan(1);
            expect(plan.isActive).to.be.false;
        });

        it("Should fail to stop plan if not owner", async function () {
            await expect(
                dcaContract.connect(user2).stopPlan(1)
            ).to.be.revertedWith("Not plan owner");
        });

        it("Should return user's plan IDs", async function () {
            // Create another plan
            await dcaContract.connect(user1).createPlan(
                ethers.utils.parseEther("50"),
                ONE_HOUR,
                0,
                { value: ethers.utils.parseEther("0.001") }
            );

            const userPlans = await dcaContract.getUserPlans(user1.address);
            expect(userPlans.length).to.equal(2);
            expect(userPlans[0]).to.equal(1);
            expect(userPlans[1]).to.equal(2);
        });
    });

    describe("Plan Execution", function () {
        beforeEach(async function () {
            // Create and setup test plan
            await dcaContract.connect(user1).createPlan(
                ethers.utils.parseEther("100"),
                ONE_HOUR,
                3,
                { value: ethers.utils.parseEther("0.001") }
            );

            await mockMUSD.connect(user1).approve(
                dcaContract.address,
                ethers.constants.MaxUint256
            );
        });

        it("Should check if plan can be executed", async function () {
            const canExecute = await dcaContract.canExecutePlan(1);
            expect(canExecute).to.be.true;
        });

        it("Should get next execution time correctly", async function () {
            const nextTime = await dcaContract.getNextExecutionTime(1);
            expect(nextTime).to.equal(0); // Can execute immediately
        });

        it("Should check user approval status", async function () {
            const hasApproval = await dcaContract.hasUserApprovedSufficientMUSD(user1.address);
            expect(hasApproval).to.be.true;
        });
    });

    describe("Admin Functions", function () {
        it("Should update execution fee", async function () {
            const newFee = ethers.utils.parseEther("0.002");
            
            await expect(dcaContract.updateExecutionFee(newFee))
                .to.emit(dcaContract, "ExecutionFeeUpdated")
                .withArgs(newFee);

            expect(await dcaContract.executionFee()).to.equal(newFee);
        });

        it("Should fail to update execution fee if not owner", async function () {
            await expect(
                dcaContract.connect(user1).updateExecutionFee(ethers.utils.parseEther("0.002"))
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should withdraw fees", async function () {
            // Create a plan to generate fees
            await dcaContract.connect(user1).createPlan(
                ethers.utils.parseEther("100"),
                ONE_DAY,
                1,
                { value: ethers.utils.parseEther("0.001") }
            );

            const initialBalance = await owner.getBalance();
            await dcaContract.withdrawFees();
            const finalBalance = await owner.getBalance();

            expect(finalBalance).to.be.gt(initialBalance);
        });
    });

    describe("Batch Operations", function () {
        beforeEach(async function () {
            // Create multiple plans
            await dcaContract.connect(user1).createPlan(
                ethers.utils.parseEther("100"),
                ONE_HOUR,
                2,
                { value: ethers.utils.parseEther("0.001") }
            );

            await dcaContract.connect(user1).createPlan(
                ethers.utils.parseEther("50"),
                ONE_HOUR,
                2,
                { value: ethers.utils.parseEther("0.001") }
            );

            await mockMUSD.connect(user1).approve(
                dcaContract.address,
                ethers.constants.MaxUint256
            );
        });

        it("Should get executable plans", async function () {
            const executablePlans = await dcaContract.getExecutablePlans();
            expect(executablePlans.length).to.equal(2);
        });

        it("Should batch execute plans", async function () {
            const planIds = [1, 2];
            
            // Note: This test would need mock router implementation
            // await dcaContract.batchExecutePlans(planIds);
        });
    });
});
