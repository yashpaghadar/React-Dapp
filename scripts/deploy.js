const fs = require('fs');
const path = require('path');

async function main() {
    try {
        console.log("Starting deployment...");
        
        // Get the deployer account
        const [deployer] = await ethers.getSigners();
        console.log("Deploying with account:", deployer.address);
        console.log("Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH");

        // Deploy the contract
        console.log("Deploying HelloToken contract...");
        const HelloToken = await ethers.getContractFactory("HelloToken");
        const helloToken = await HelloToken.deploy(1000000); // 1,000,000 initial supply
        console.log("Contract deployment initiated. Waiting for deployment...");
        
        // Wait for deployment
        const deployTx = await helloToken.deployTransaction;
        console.log("Deployment transaction hash:", deployTx.hash);
        await helloToken.deployed();
        
        // Log deployment details
        console.log("\n=== Deployment Complete ===");
        console.log("Contract Address:", helloToken.address);
        console.log("Network:", network.name);
        console.log("Deployer:", deployer.address);
        const decimals = await helloToken.decimals();
        const totalSupply = await helloToken.totalSupply();
        const formattedSupply = ethers.utils.formatEther(totalSupply, "ETH");
        console.log("Initial Supply:", formattedSupply);
        console.log("Decimals:", decimals);
        
        // Verify the initial supply is correct
        const deployerBalance = await helloToken.balanceOf(deployer.address);
        const formattedBalance = ethers.utils.formatEther(deployerBalance,  "ETH");
        console.log("Deployer's token balance:", formattedBalance);
      
        // Write HelloToken address to dedicated file
        fs.writeFileSync(
            path.join(__dirname, '../src/contracts/hello-token-address.json'),
            JSON.stringify({ address: helloToken.address }, null, 2)
        );
        console.log("HelloToken contract address saved to src/contracts/hello-token-address.json");
        
        console.log("\nDeployment successful!");
    } catch (error) {
        console.error("\n=== Deployment Failed ===");
        console.error("Error:", error.message);
        console.error("Stack trace:", error.stack);
        process.exit(1);
    }
}

main();
