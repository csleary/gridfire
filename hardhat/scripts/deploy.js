async function main() {
  const [deployer] = await ethers.getSigners();
  const Contract = await ethers.getContractFactory("GridFirePayment", deployer);
  const contract = await Contract.deploy();
  await contract.deployed();
  console.log("GridFirePayment deployed to:", contract.address, "by", deployer.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
