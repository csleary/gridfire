import { ethers, network } from "hardhat";

const { DEPLOYER_ADDRESS } = process.env;
const ADDRESS_1 = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
const ADDRESS_2 = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";
const ARTIST = "0x6ECBA09EA8Fa363546b3B546734f0aB56887d489";
const DAI_CONTRACT_ADDRESS = "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1";
const DAI_WHALE = "0xc5ed2333f8a2C351fCA35E5EBAdb2A82F5d254C3";

async function main() {
  await network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [DAI_WHALE]
  });

  const daiAbi = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function balanceOf(address) view returns (uint)",
    "function transfer(address to, uint amount)"
  ];

  const signer = await ethers.getImpersonatedSigner(DAI_WHALE);
  const daiContract = new ethers.Contract(DAI_CONTRACT_ADDRESS, daiAbi, signer);

  await Promise.all([
    daiContract.transfer(ADDRESS_1, ethers.parseEther("5000")),
    daiContract.transfer(ADDRESS_2, ethers.parseEther("5000")),
    daiContract.transfer(ARTIST, ethers.parseEther("100")),
    daiContract.transfer(DEPLOYER_ADDRESS, ethers.parseEther("100")),
    signer.sendTransaction({ to: ARTIST, value: ethers.parseEther("1.0") }),
    signer.sendTransaction({ to: DEPLOYER_ADDRESS, value: ethers.parseEther("1.0") })
  ]);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
