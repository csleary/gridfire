require("dotenv").config();
require("@nomiclabs/hardhat-waffle");

/**
 * @type import('hardhat/config').HardhatUserConfig
 */

const { ALCHEMY_API_KEY, MNEMONIC } = process.env;

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 1337,
      forking: {
        url: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
        blockNumber: 14730000
      },
      mining: {
        auto: true,
        interval: 0
      }
    }
  },
  paths: {
    artifacts: "../client/src/artifacts"
  },
  solidity: "0.8.14"
};
