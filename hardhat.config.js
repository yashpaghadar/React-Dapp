require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");
require("hardhat-verify");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 1337
    },
    sepolia: {
      url: process.env.SEPOLIA_URL || "https://eth-sepolia.g.alchemy.com/v2/K_XNNzEyJg_0ka1pfXzMa2TCXB75iykt",
      chainId: 11155111,
      accounts: ["745f6859ded5f3b8e8b9f05550f47b070ccabffab2ce90c5d6da9824019dc6de"]
    },
  },
  etherscan: {
    apiKey: "2W8MRRCDVQHQCEZPIHJUXTBT67NGCI2NZK",
    customChains: [
      {
        network: "sepolia",
        chainId: 11155111,
        urls: {
          apiURL: "https://api-sepolia.etherscan.io/api",
          browserURL: "https://sepolia.etherscan.io"
        }
      }
    ]
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 20000
  }
};