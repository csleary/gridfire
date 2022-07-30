const DAI_CONTRACT_ADDRESS = "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1";
const CONTRACT_ADDRESS = "0xa51c1fc2f0d1a1b8494ed1fe312d7c3a78ed91c0";
const OWNER_ADDRESS = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";
const ARTIST_ADDRESS = "0x6ecba09ea8fa363546b3b546734f0ab56887d489";

async function main() {
  const daiAbi = ["function balanceOf(address) view returns (uint)", "function transfer(address to, uint amount)"];
  const signer = await ethers.getSigner("0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266");
  const daiContract = new ethers.Contract(DAI_CONTRACT_ADDRESS, daiAbi, signer);
  const contract = await ethers.getContractAt("GridFirePayment", CONTRACT_ADDRESS, signer);
  const ownerBalance = await contract.getBalance(OWNER_ADDRESS);
  console.log("Owner balance: DAI", ethers.utils.formatEther(ownerBalance));
  const artistBalance = await contract.getBalance(ARTIST_ADDRESS);
  console.log("Artist balance: DAI", ethers.utils.formatEther(artistBalance));
  const daiOwned = await daiContract.balanceOf(CONTRACT_ADDRESS);
  console.log("Contract balance: DAI", ethers.utils.formatEther(daiOwned));
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
