const { ethers } = require("hardhat");

async function main() {
    const [deployer, user1] = await ethers.getSigners();
    
    // Contract addresses from your deployment
    const DCA_CONTRACT_ADDRESS = "0x25E22CEE7B3Ab8c8813a83cf2C8C307AB87C070C";
    const MUSD_TOKEN_ADDRESS = "0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503";
    
    console.log("=== Mezo Testnet Setup ===");
    console.log("Deployer:", deployer.address);
    console.log("User1:", user1.address);
    
    // Connect to contracts
    const dcaContract = await ethers.getContractAt("DCAContract", DCA_CONTRACT_ADDRESS);
    const musdToken = await ethers.getContractAt("IERC20", MUSD_TOKEN_ADDRESS);
    
    // Check balances
    const deployerBalance = await ethers.provider.getBalance(deployer.address);
    const user1Balance = await ethers.provider.getBalance(user1.address);
    
    console.log("\n=== ETH Balances ===");
    console.log("Deployer ETH:", ethers.formatEther(deployerBalance));
    console.log("User1 ETH:", ethers.formatEther(user1Balance));
    
    // Check mUSD balances
    try {
        const deployerMUSD = await musdToken.balanceOf(deployer.address);
        const user1MUSD = await musdToken.balanceOf(user1.address);
        
        console.log("\n=== mUSD Balances ===");
        console.log("Deployer mUSD:", ethers.formatEther(deployerMUSD));
        console.log("User1 mUSD:", ethers.formatEther(user1MUSD));
        
        // If user1 has no mUSD but deployer does, transfer some
        if (user1MUSD === 0n && deployerMUSD > ethers.parseEther("100")) {
            console.log("\n=== Transferring mUSD to User1 ===");
            const transferAmount = ethers.parseEther("1000");
            const tx = await musdToken.connect(deployer).transfer(user1.address, transferAmount);
            await tx.wait();
            console.log("Transferred", ethers.formatEther(transferAmount), "mUSD to User1");
            
            const newBalance = await musdToken.balanceOf(user1.address);
            console.log("User1 new mUSD balance:", ethers.formatEther(newBalance));
        }
        
    } catch (error) {
        console.log("Error checking mUSD balances:", error.message);
    }
    
    // Check DCA contract state
    console.log("\n=== DCA Contract Info ===");
    try {
        const executionFee = await dcaContract.executionFee();
        console.log("Execution fee:", ethers.formatEther(executionFee), "ETH");
        
        const musdAddress = await dcaContract.musdToken();
        const btcAddress = await dcaContract.btcToken();
        const routerAddress = await dcaContract.swapRouter();
        
        console.log("mUSD Token:", musdAddress);
        console.log("BTC Token:", btcAddress);
        console.log("Router:", routerAddress);
        
    } catch (error) {
        console.log("Error reading contract:", error.message);
    }
    
    // Approve mUSD spending for user1 if they have balance
    try {
        const user1MUSD = await musdToken.balanceOf(user1.address);
        if (user1MUSD > 0n) {
            console.log("\n=== Setting up mUSD Approval ===");
            const currentAllowance = await musdToken.allowance(user1.address, DCA_CONTRACT_ADDRESS);
            console.log("Current allowance:", ethers.formatEther(currentAllowance));
            
            if (currentAllowance < ethers.parseEther("1000")) {
                const tx = await musdToken.connect(user1).approve(DCA_CONTRACT_ADDRESS, ethers.MaxUint256);
                await tx.wait();
                console.log("✅ Approved unlimited mUSD spending for DCA contract");
            } else {
                console.log("✅ Already has sufficient allowance");
            }
        }
    } catch (error) {
        console.log("Error setting up approval:", error.message);
    }
    
    console.log("\n=== Setup Complete ===");
    console.log("Ready to run integration tests!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
