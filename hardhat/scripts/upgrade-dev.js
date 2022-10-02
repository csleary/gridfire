/* eslint-disable no-undef */
const { GRIDFIRE_EDITIONS_ADDRESS, GRIDFIRE_PAYMENT_ADDRESS } = process.env;

async function main() {
  const [deployer] = await ethers.getSigners();

  const gridFirePaymentContract = await ethers.getContractFactory("GridFirePayment", deployer);
  const gridFirePayment = await upgrades.upgradeProxy(GRIDFIRE_PAYMENT_ADDRESS, gridFirePaymentContract);
  console.log(`GridFirePayment upgraded: ${gridFirePayment.address} (update client), by ${deployer.address}`);

  const gridFireEditionsContract = await ethers.getContractFactory("GridFireEditions", deployer);
  const gridFireEditions = await upgrades.upgradeProxy(GRIDFIRE_EDITIONS_ADDRESS, gridFireEditionsContract);
  console.log(`GridFireEditions upgraded: ${gridFireEditions.address} (update client), by ${deployer.address}`);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
