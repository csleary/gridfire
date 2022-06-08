require("dotenv").config();
require("@nomiclabs/hardhat-waffle");

/**
 * @type import('hardhat/config').HardhatUserConfig
 */

const { ALCHEMY_MAINNET_KEY, ALCHEMY_ARBITRUM_MAINNET_KEY, ALCHEMY_ARBITRUM_RINKEBY_KEY } = process.env;

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    "arb-mainnet": {
      url: `https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_ARBITRUM_MAINNET_KEY}`
    },
    "arb-rinkeby": {
      url: `https://arb-rinkeby.g.alchemy.com/v2/${ALCHEMY_ARBITRUM_RINKEBY_KEY}`
    },
    hardhat: {
      chainId: 1337,
      forking: {
        url: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_MAINNET_KEY}`,
        blockNumber: 14730000
      },
      mining: {
        auto: true,
        interval: 0
      }
    }
  },
  paths: {
    artifacts: "./artifacts"
  },
  solidity: "0.8.14"
};
