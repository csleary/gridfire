const { ethers, upgrades } = require("hardhat");
const hre = require("hardhat");
const { DEPLOYER_MAINNET_PRIVATE_KEY } = process.env;
const address = "";

/**
 * Remember to:
 * 1. Update the DAI address in the contract.
 * 2. Compile and deploy contract.
 * 3. Update the contract address in the client and server, and rebuild/redeploy.
 */

async function main() {
  const wallet = new ethers.Wallet(DEPLOYER_MAINNET_PRIVATE_KEY);
  const provider = ethers.getDefaultProvider(hre.config.networks["arb-mainnet"].url);
  console.log("Provider URL:", provider.connection.url);
  const signer = wallet.connect(provider);
  const Contract = await ethers.getContractFactory("GridFirePayment", signer);
  const contract = await upgrades.upgradeProxy(address, Contract);
  await contract.deployed();
  console.log("GridFirePayment deployed to:", contract.address, "by", signer.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
