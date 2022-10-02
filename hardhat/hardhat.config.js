/* eslint-disable no-undef */
require("dotenv").config();
require("@nomiclabs/hardhat-waffle");
require("@openzeppelin/hardhat-upgrades");

/**
 * @type import('hardhat/config').HardhatUserConfig
 */

const {
  ALCHEMY_ARBITRUM_MAINNET_KEY,
  ALCHEMY_ARBITRUM_RINKEBY_KEY,
  GRIDFIRE_EDITIONS_ADDRESS,
  GRIDFIRE_PAYMENT_ADDRESS
} = process.env;

config = {
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
        url: `https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_ARBITRUM_MAINNET_KEY}`,
        blockNumber: 14000000
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
  solidity: "0.8.16"
};

task("deploy", "Deploy contracts to Arbitrum mainnet")
  .addParam("account", "Deployer account")
  .setAction(async (taskArgs, hre) => {
    const { ethers, upgrades } = hre;
    const { account } = taskArgs;
    const wallet = new ethers.Wallet(account);
    const provider = ethers.getDefaultProvider(hre.config.networks["arb-mainnet"].url);
    console.log(`Provider URL: ${provider.connection.url}`);
    const deployer = wallet.connect(provider);

    const gridFirePaymentContract = await ethers.getContractFactory("GridFirePayment", deployer);
    const gridFirePayment = await upgrades.deployProxy(gridFirePaymentContract);
    console.log(`GridFirePayment deployed to: ${gridFirePayment.address} (update client), by ${deployer.address}`);

    const gridFireEditionsContract = await ethers.getContractFactory("GridFireEditions", deployer);
    const gridFireEditions = await upgrades.deployProxy(gridFireEditionsContract, [gridFirePayment.address]);
    console.log(`GridFireEditions deployed to: ${gridFireEditions.address} (update client), by ${deployer.address}`);
  });

task("upgrade", "Upgrade contracts on Arbitrum mainnet")
  .addParam("account", "Deployer account")
  .setAction(async (taskArgs, hre) => {
    const { ethers, upgrades } = hre;
    const { account } = taskArgs;
    const wallet = new ethers.Wallet(account);
    const provider = ethers.getDefaultProvider(hre.config.networks["arb-mainnet"].url);
    console.log("Provider URL:", provider.connection.url);
    const deployer = wallet.connect(provider);

    const gridFirePaymentContract = await ethers.getContractFactory("GridFirePayment", deployer);
    const gridFirePayment = await upgrades.upgradeProxy(GRIDFIRE_PAYMENT_ADDRESS, gridFirePaymentContract);
    console.log(`GridFirePayment upgraded: ${gridFirePayment.address} (update client), by ${deployer.address}`);

    const gridFireEditionsContract = await ethers.getContractFactory("GridFireEditions", deployer);
    const gridFireEditions = await upgrades.upgradeProxy(GRIDFIRE_EDITIONS_ADDRESS, gridFireEditionsContract);
    console.log(`GridFireEditions upgraded: ${gridFireEditions.address} (update client), by ${deployer.address}`);
  });

module.exports = config;
