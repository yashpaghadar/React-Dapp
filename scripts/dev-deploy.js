const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    try {
        // Compile contracts first
        console.log("Compiling contracts...");
        await require("hardhat").run("compile");

        // Deploy contract
        console.log("Deploying contract...");
        const Contract = await ethers.getContractFactory("Greeter");
        const contract = await Contract.deploy("Hello, World!");
        await contract.deployed();

        console.log(`Contract deployed to: ${contract.address}`);

        // Save contract address
        const contractAddress = {
            address: contract.address
        };
        
        const filePath = path.join(__dirname, '../src/contract-address.json');
        fs.writeFileSync(filePath, JSON.stringify(contractAddress, null, 2));
        
        console.log("Contract address saved to contract-address.json");
        
        console.log("Contract deployment complete!");
        console.log("You can now start the development server by running:");
        console.log("npm run dev:frontend");
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

main();
