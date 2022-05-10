async function main() {
  // We get the contract to deploy
  const Contract = await ethers.getContractFactory("GridFirePayment");
  const contract = await Contract.deploy();
  await contract.deployed();
  console.log("GridFirePayment deployed to:", contract.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
