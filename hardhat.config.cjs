require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-ethers");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.17",
  networks: {
    hardhat: {
      chainId: 1337,
      gas: 12000000,
      gasPrice: 8000000000
    },
    sepolia: {
      url: "https://eth-sepolia.g.alchemy.com/v2/K_XNNzEyJg_0ka1pfXzMa2TCXB75iykt",
      accounts: [process.env.PRIVATE_KEY],
      ethers: {
        version: "6.14.3"
      }
    },
  },
  ethers: {
    version: "6.14.3"
  }
};
