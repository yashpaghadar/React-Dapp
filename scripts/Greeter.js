const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

async function deployContract() {
    const network = await ethers.provider.getNetwork();
    console.log("Deploying to network:", network.name);
    const Greeter = await ethers.getContractFactory("Greeter");
    const [deployer] = await ethers.getSigners();
    console.log("Deployer Address:", deployer.address);
   
    // Deploy with explicit gas settings
    // Read HelloToken address from JSON

    const helloTokenAddressJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/contracts/hello-token-address.json')));
    const helloTokenAddress = helloTokenAddressJson.address;

    // Deploy Greeter with HelloToken address
    const greeter = await Greeter.deploy(
        "Hello, Blockchain!!",
        helloTokenAddress,
        {
            gasLimit: 3000000,
            gasPrice: 10000000000 // 10 gwei in wei
        }
    );
    
    const deployTx = greeter.deployTransaction;
    const receipt = await greeter.deployTransaction.wait();
    const contractAddress = greeter.address;
    console.log("Contract Address:", contractAddress);
    console.log("Deployment Transaction hash:", deployTx.hash);
    //console.log("Transaction hash:", receipt.transactionHash);
    console.log("Block number:", receipt.blockNumber);
    console.log("Gas Used:", receipt.gasUsed.toString());
    console.log("Deployment Timestamp:", (await ethers.provider.getBlock(receipt.blockNumber)).timestamp);
    console.log("\nDeployment successful!\n");
    // Write contract address to file
    fs.writeFileSync(
        path.join(__dirname, '../src/contracts/contract-address.json'),
        JSON.stringify({ address: contractAddress }, null, 2)
    );
    console.log('Contract address saved to src/contracts/contract-address.json');
    return { greeter, contractAddress };
}

async function main() {
    const { greeter, contractAddress } = await deployContract();
}

main().catch((error) => {
    console.error("Error during deployment:", error);
    process.exitCode = 1;
});