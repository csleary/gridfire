const { DEPLOYER_TESTNET_PRIVATE_KEY } = process.env;

/**
 * Remember to:
 * 1. Update the DAI address in the contract: 0xe905AaAb78C4160C3FdaC2eBbf7a01C34CA28B4F
 * 2. Compile and deploy contract.
 * 3. Update the contract address in the client and rebuild/redeploy.
 */

async function main() {
  const wallet = new ethers.Wallet(DEPLOYER_TESTNET_PRIVATE_KEY);
  const provider = ethers.getDefaultProvider(hre.config.networks["arb-rinkeby"].url);
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
