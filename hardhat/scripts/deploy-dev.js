/* eslint-disable no-undef */

async function main() {
  const [deployer] = await ethers.getSigners();

  const gridFirePaymentContract = await ethers.getContractFactory("GridFirePayment", deployer);
  const gridFirePayment = await upgrades.deployProxy(gridFirePaymentContract);
  console.log(`GridFirePayment deployed to: ${gridFirePayment.address} (update client), by ${deployer.address}`);

  const gridFireEditionsContract = await ethers.getContractFactory("GridFireEditions", deployer);
  const gridFireEditions = await upgrades.deployProxy(gridFireEditionsContract, [gridFirePayment.address]);
  console.log(`GridFireEditions deployed to: ${gridFireEditions.address} (update client), by ${deployer.address}`);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
