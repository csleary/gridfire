/* eslint-disable no-undef */
require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");
require("dotenv/config");

/**
 * @type import('hardhat/config').HardhatUserConfig
 */

const {
  ALCHEMY_ARBITRUM_MAINNET_KEY,
  ALCHEMY_ARBITRUM_RINKEBY_KEY,
  ALCHEMY_ARBITRUM_SEPOLIA_KEY,
  ARBISCAN_API_KEY,
  GRIDFIRE_EDITIONS_ADDRESS,
  GRIDFIRE_PAYMENT_ADDRESS
} = process.env;

config = {
  defaultNetwork: "hardhat",
  etherscan: {
    apiKey: ARBISCAN_API_KEY
  },
  networks: {
    "arb-mainnet": {
      url: `https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_ARBITRUM_MAINNET_KEY}`
    },
    "arb-rinkeby": {
      url: `https://arb-rinkeby.g.alchemy.com/v2/${ALCHEMY_ARBITRUM_RINKEBY_KEY}`
    },
    "arb-sepolia": {
      url: `https://arb-sepolia.g.alchemy.com/v2/${ALCHEMY_ARBITRUM_SEPOLIA_KEY}`
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
  solidity: "0.8.20"
};

task("deploy", "Deploy contracts to Arbitrum mainnet")
  .addParam("account", "Deployer account")
  .setAction(async (taskArgs, hre) => {
    const { ethers, upgrades } = hre;
    const { account } = taskArgs;
    const wallet = new ethers.Wallet(account);
    const provider = ethers.getDefaultProvider(config.networks["arb-mainnet"].url);
    const deployer = wallet.connect(provider);
    const connection = provider._getConnection();
    console.log("Provider URL:", connection.url);

    const gridfirePaymentContract = await ethers.getContractFactory("GridfirePayment", deployer);
    const gridfirePayment = await upgrades.deployProxy(gridfirePaymentContract, [], { kind: "uups" });
    const gridfirePaymentAddress = await gridfirePayment.getAddress();
    console.log(`GridfirePayment deployed to: ${gridfirePaymentAddress} (update client), by ${deployer.address}`);

    const gridfireEditionsContract = await ethers.getContractFactory("GridfireEditions", deployer);
    const gridfireEditions = await upgrades.deployProxy(gridfireEditionsContract, [gridfirePaymentAddress], {
      kind: "uups"
    });
    const gridfireEditionsAddress = await gridfireEditions.getAddress();
    console.log(`GridfireEditions deployed to: ${gridfireEditionsAddress} (update client), by ${deployer.address}`);

    await gridfirePayment.setGridfireEditionsAddress(gridfireEditionsAddress);
    const gridfireEditionsSavedAddress = await gridfirePayment.getGridfireEditionsAddress();
    console.log(`gridfireEditionsAddress: ${gridfireEditionsSavedAddress}`);
  });

task("upgrade", "Upgrade contracts on Arbitrum mainnet")
  .addParam("account", "Deployer account")
  .setAction(async (taskArgs, hre) => {
    const { ethers, upgrades } = hre;
    const { account } = taskArgs;
    const wallet = new ethers.Wallet(account);
    const provider = ethers.getDefaultProvider(config.networks["arb-mainnet"].url);
    const connection = provider._getConnection();
    console.log("Provider URL:", connection.url);
    const deployer = wallet.connect(provider);

    const gridfirePaymentContract = await ethers.getContractFactory("GridfirePayment", deployer);
    const gridfirePayment = await upgrades.upgradeProxy(GRIDFIRE_PAYMENT_ADDRESS, gridfirePaymentContract);
    const gridfirePaymentAddress = await gridfirePayment.getAddress();
    console.log(`GridfirePayment upgraded: ${gridfirePaymentAddress} (update client), by ${deployer.address}`);

    const gridfireEditionsContract = await ethers.getContractFactory("GridfireEditions", deployer);
    const gridfireEditions = await upgrades.upgradeProxy(GRIDFIRE_EDITIONS_ADDRESS, gridfireEditionsContract);
    const gridfireEditionsAddress = await gridfireEditions.getAddress();
    console.log(`GridfireEditions upgraded: ${gridfireEditionsAddress} (update client), by ${deployer.address}`);

    await gridfirePayment.setGridfireEditionsAddress(gridfireEditionsAddress);
    const gridfireEditionsSavedAddress = await gridfirePayment.getGridfireEditionsAddress();
    console.log(`gridfireEditionsAddress: ${gridfireEditionsSavedAddress}`);
  });

task("deploy-sepolia", "Deploy contracts to Arbitrum Sepolia testnet")
  .addParam("account", "Deployer account")
  .setAction(async (taskArgs, hre) => {
    const { ethers, upgrades } = hre;
    const { account } = taskArgs;
    const wallet = new ethers.Wallet(account);
    const provider = ethers.getDefaultProvider(config.networks["arb-sepolia"].url);
    const connection = provider._getConnection();
    console.log("Provider URL:", connection.url);
    const deployer = wallet.connect(provider);

    const gridfirePaymentContract = await ethers.getContractFactory("GridfirePayment", deployer);
    const gridfirePayment = await upgrades.deployProxy(gridfirePaymentContract, [], { kind: "uups" });
    const gridfirePaymentAddress = await gridfirePayment.getAddress();
    console.log(`GridfirePayment deployed to: ${gridfirePaymentAddress} (update client), by ${deployer.address}`);

    const gridfireEditionsContract = await ethers.getContractFactory("GridfireEditions", deployer);
    const gridfireEditions = await upgrades.deployProxy(gridfireEditionsContract, [gridfirePaymentAddress], {
      kind: "uups"
    });
    const gridfireEditionsAddress = await gridfireEditions.getAddress();
    console.log(`GridfireEditions deployed to: ${gridfireEditionsAddress} (update client), by ${deployer.address}`);

    await gridfirePayment.setGridfireEditionsAddress(gridfireEditionsAddress);
    const gridfireEditionsSavedAddress = await gridfirePayment.getGridfireEditionsAddress();
    console.log(`gridfireEditionsAddress: ${gridfireEditionsSavedAddress}`);
  });

module.exports = config;
