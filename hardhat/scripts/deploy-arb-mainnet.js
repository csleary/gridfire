const { DEPLOYER_MAINNET_PRIVATE_KEY } = process.env;

async function main() {
  const wallet = new ethers.Wallet(DEPLOYER_MAINNET_PRIVATE_KEY);
  const provider = ethers.getDefaultProvider(hre.config.networks["arb-mainnet"].url);
  console.log("Provider URL:", provider.connection.url);
  const signer = wallet.connect(provider);
  const Contract = await ethers.getContractFactory("GridFirePayment", signer);
  const contract = await Contract.deploy();
  await contract.deployed();
  console.log("GridFirePayment deployed to:", contract.address, "by", signer.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
