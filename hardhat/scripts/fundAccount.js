const ADDRESS_1 = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
const ADDRESS_2 = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
const DAI_CONTRACT_ADDRESS = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const DAI_WHALE = "0x5d38b4e4783e34e2301a2a36c39a03c45798c4dd";

async function main() {
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [DAI_WHALE]
  });

  const daiAbi = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function balanceOf(address) view returns (uint)",
    "function transfer(address to, uint amount)"
  ];

  const signer = await ethers.getSigner(DAI_WHALE);
  const daiContract = new ethers.Contract(DAI_CONTRACT_ADDRESS, daiAbi, signer);
  await daiContract.transfer(ADDRESS_1, ethers.utils.parseEther("5000"));
  await daiContract.transfer(ADDRESS_2, ethers.utils.parseEther("5000"));
}

main();
