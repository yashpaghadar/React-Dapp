const fs = require('fs');
const path = require('path');

async function main() {
    try {
        console.log("Starting HelloNFT deployment...");
        const [deployer] = await ethers.getSigners();
        console.log("Deploying with account:", deployer.address);
        console.log("Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH");

        // Deploy HelloNFT contract
        const HelloNFT = await ethers.getContractFactory("HelloNFT");
        const helloNFT = await HelloNFT.deploy();
        console.log("Contract deployment initiated. Waiting for deployment...");
        await helloNFT.deployed();
        console.log("HelloNFT deployed at:", helloNFT.address);

        // Mint 1 NFT to deployer with metadata
        const folderCID = "bafybeiadfdvthpteettt2msdsr5jhvxjwgddq3tfw327qx256vylclvyye";
        const tokenURI = `https://gateway.pinata.cloud/ipfs/${folderCID}/0.json`;
        const mintTx = await helloNFT.mintNFT(deployer.address, tokenURI);
        await mintTx.wait();
        const mintedTokenId = 0; 
        console.log(`Minted NFT Token ID: ${mintedTokenId} to ${deployer.address}`);
        console.log(`View your NFT on Etherscan under the ERC721 tab for contract: https://${network.name}.etherscan.io/address/${helloNFT.address}`);

        // Save contract address for frontend
        fs.writeFileSync(
            path.join(__dirname, '../src/contracts/hello-nft-address.json'),
            JSON.stringify({ address: helloNFT.address }, null, 2)
        );
        console.log("HelloNFT contract address saved to src/contracts/hello-nft-address.json");
        console.log("\nDeployment successful!");
    } catch (error) {
        console.error("\n=== Deployment Failed ===");
        console.error("Error:", error.message);
        console.error("Stack trace:", error.stack);
        process.exit(1);
    }
}

main();
