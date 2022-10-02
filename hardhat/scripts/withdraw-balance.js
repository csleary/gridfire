/* eslint-disable no-undef */
const DAI_CONTRACT_ADDRESS = "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1";
const GRIDFIRE_PAYMENT_ADDRESS = "0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0";
const OWNER_ADDRESS = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";

async function main() {
  const daiAbi = ["function balanceOf(address) view returns (uint)", "function transfer(address to, uint amount)"];
  const signer = await ethers.getSigner("0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266");
  const daiContract = new ethers.Contract(DAI_CONTRACT_ADDRESS, daiAbi, signer);
  const contract = await ethers.getContractAt("GridFirePayment", GRIDFIRE_PAYMENT_ADDRESS, signer);
  const result = await contract.getBalance(OWNER_ADDRESS);
  console.log("GridFire balance: DAI", ethers.utils.formatEther(result));
  const daiOwned = await daiContract.balanceOf(OWNER_ADDRESS);
  console.log("Own balance: DAI", ethers.utils.formatEther(daiOwned));
  const withdrawal = await contract.claim();
  console.log(withdrawal);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
