import { Contract, ethers, utils } from "ethers";
import { daiAbi, daiContractAddress } from "web3/dai";
import detectEthereumProvider from "@metamask/detect-provider";
import GridFirePayment from "artifacts/contracts/GridFirePayment.sol/GridFirePayment.json";

const { REACT_APP_CONTRACT_ADDRESS } = process.env;

const claimBalance = async () => {
  const ethereum = await detectEthereumProvider();
  const signer = new ethers.providers.Web3Provider(ethereum).getSigner();
  const gridFireContract = getGridFireContract(signer);
  const transactionReceipt = await gridFireContract.claim();
  const { status } = await transactionReceipt.wait(0);
  if (status !== 1) throw new Error("Claim unsuccessful.");
};

const getBalance = async paymentAddress => {
  const ethereum = await detectEthereumProvider();
  const provider = new ethers.providers.Web3Provider(ethereum);
  const gridFireContract = getGridFireContract(provider);
  const balance = await gridFireContract.getBalance(paymentAddress);
  return balance;
};

const getDaiAllowance = async account => {
  const ethereum = await detectEthereumProvider();
  const provider = new ethers.providers.Web3Provider(ethereum);
  const daiContract = new Contract(daiContractAddress, daiAbi, provider);
  const currentAllowance = await daiContract.allowance(account, REACT_APP_CONTRACT_ADDRESS);
  return currentAllowance;
};

const getDaiContract = signerOrProvider => {
  return new Contract(daiContractAddress, daiAbi, signerOrProvider);
};

const getGridFireContract = signerOrProvider => {
  return new Contract(REACT_APP_CONTRACT_ADDRESS, GridFirePayment.abi, signerOrProvider);
};

const setDaiAllowance = async (newLimitInDai = "") => {
  const ethereum = await detectEthereumProvider();
  const provider = new ethers.providers.Web3Provider(ethereum);
  const signer = provider.getSigner();
  const daiContract = getDaiContract(signer);
  const requestedAllowance = utils.parseEther(newLimitInDai);
  const approvalReceipt = await daiContract.approve(REACT_APP_CONTRACT_ADDRESS, requestedAllowance);
  const { status } = await approvalReceipt.wait(0);
  if (status !== 1) throw new Error("Approval unsuccessful.");
};

export { claimBalance, getBalance, getDaiAllowance, getDaiContract, getGridFireContract, setDaiAllowance };
