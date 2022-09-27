const { ethers, upgrades } = require("hardhat");
const address = "0x9A676e781A523b5d0C0e43731313A708CB607508";

async function main() {
  const [deployer] = await ethers.getSigners();
  const Contract = await ethers.getContractFactory("GridFirePayment", deployer);
  const contract = await upgrades.upgradeProxy(address, Contract);
  console.log("GridFirePayment deployed to:", contract.address, "by", deployer.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
