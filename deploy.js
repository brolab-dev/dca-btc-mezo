const { ethers } = require("hardhat");

async function main() {
    console.log("Deploying DCA Contract to Mezo Testnet...");

    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());

    // Deploy the DCA Contract
    const DCAContract = await ethers.getContractFactory("DCAContract");
    const dcaContract = await DCAContract.deploy();

    await dcaContract.deployed();

    console.log("DCA Contract deployed to:", dcaContract.address);

    // Verify contract addresses are correct
    console.log("mUSD Token Address:", await dcaContract.MUSD_TOKEN());
    console.log("BTC Token Address:", await dcaContract.BTC_TOKEN());
    console.log("Swap Router Address:", await dcaContract.SWAP_ROUTER());

    // Save deployment info
    const deploymentInfo = {
        network: "mezo-testnet",
        contractAddress: dcaContract.address,
        deployer: deployer.address,
        deploymentTime: new Date().toISOString(),
        blockNumber: await ethers.provider.getBlockNumber(),
        transactionHash: dcaContract.deployTransaction.hash
    };

    console.log("\nDeployment Info:");
    console.log(JSON.stringify(deploymentInfo, null, 2));

    return dcaContract;
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
