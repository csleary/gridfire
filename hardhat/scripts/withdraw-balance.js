const DAI_CONTRACT_ADDRESS = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const OWNER_ADDRESS = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";

async function main() {
  const daiAbi = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function balanceOf(address) view returns (uint)",
    "function transfer(address to, uint amount)"
  ];

  const signer = await ethers.getSigner("0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266");
  const daiContract = new ethers.Contract(DAI_CONTRACT_ADDRESS, daiAbi, signer);
  const contract = await ethers.getContractAt("GridFirePayment", "0x413b1AfCa96a3df5A686d8BFBF93d30688a7f7D9", signer);
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
