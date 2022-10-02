/* eslint-disable no-undef */
const { DEPLOYER_TESTNET_PRIVATE_KEY, GRIDFIRE_PAYMENT_ADDRESS } = process.env;

async function main() {
  const wallet = new ethers.Wallet(DEPLOYER_TESTNET_PRIVATE_KEY);
  const provider = ethers.getDefaultProvider(hre.config.networks["arb-rinkeby"].url);
  const signer = wallet.connect(provider);
  console.log(signer.address);
  const contract = await ethers.getContractAt("GridFirePayment", GRIDFIRE_PAYMENT_ADDRESS, signer);
  const result = await contract.withdraw();
  console.log(result);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
