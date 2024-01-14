/* eslint-disable no-undef */
const { GRIDFIRE_EDITIONS_ADDRESS, GRIDFIRE_PAYMENT_ADDRESS } = process.env;

async function main() {
  const [deployer] = await ethers.getSigners();

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
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
