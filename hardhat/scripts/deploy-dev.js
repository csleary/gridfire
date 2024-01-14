/* eslint-disable no-undef */

async function main() {
  const [deployer] = await ethers.getSigners();

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
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
