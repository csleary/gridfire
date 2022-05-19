import { Contract, ethers, utils } from "ethers";
import { daiAbi, daiContractAddress } from "web3/dai";
import detectEthereumProvider from "@metamask/detect-provider";
import GridFirePayment from "web3/GridFirePayment.json";

const { REACT_APP_CONTRACT_ADDRESS } = process.env;

const getProvider = async () => {
  const ethereum = await detectEthereumProvider();
  return new ethers.providers.Web3Provider(ethereum);
};

const claimBalance = async () => {
  const provider = await getProvider();
  const signer = provider.getSigner();
  const gridFireContract = getGridFireContract(signer);
  const transactionReceipt = await gridFireContract.claim();
  const { status } = await transactionReceipt.wait(0);
  if (status !== 1) throw new Error("Claim unsuccessful.");
};

const getBalance = async paymentAddress => {
  const provider = await getProvider();
  const gridFireContract = getGridFireContract(provider);
  return gridFireContract.getBalance(paymentAddress);
};

const getDaiAllowance = async account => {
  const provider = await getProvider();
  const daiContract = new Contract(daiContractAddress, daiAbi, provider);
  return daiContract.allowance(account, REACT_APP_CONTRACT_ADDRESS);
};

const getDaiContract = signerOrProvider => {
  return new Contract(daiContractAddress, daiAbi, signerOrProvider);
};

const getGridFireContract = signerOrProvider => {
  return new Contract(REACT_APP_CONTRACT_ADDRESS, GridFirePayment.abi, signerOrProvider);
};

const gridFireCheckout = async basket => {
  const provider = await getProvider();
  const signer = provider.getSigner();
  const gridFireContract = getGridFireContract(signer);

  const contractBasket = basket.map(({ paymentAddress, price }) => ({
    artist: paymentAddress,
    amountPaid: price,
    releasePrice: price
  }));

  const transactionReceipt = await gridFireContract.checkout(contractBasket);
  const { status, transactionHash } = await transactionReceipt.wait();
  if (status !== 1) throw new Error("Transaction unsuccessful.");
  return transactionHash;
};

const purchaseRelease = async (paymentAddress, price) => {
  const provider = await getProvider();
  const signer = provider.getSigner();
  const gridFirePayment = getGridFireContract(signer);
  const weiReleasePrice = utils.parseEther(`${price}`);
  const transactionReceipt = await gridFirePayment.purchase(paymentAddress, weiReleasePrice, weiReleasePrice);
  const { status, transactionHash } = await transactionReceipt.wait();
  if (status !== 1) throw new Error("Transaction unsuccessful.");
  return transactionHash;
};

const setDaiAllowance = async (newLimitInDai = "") => {
  const provider = await getProvider();
  const signer = provider.getSigner();
  const daiContract = getDaiContract(signer);
  const requestedAllowance = utils.parseEther(newLimitInDai);
  const approvalReceipt = await daiContract.approve(REACT_APP_CONTRACT_ADDRESS, requestedAllowance);
  const { status } = await approvalReceipt.wait();
  if (status !== 1) throw new Error("Approval unsuccessful.");
};

export {
  claimBalance,
  gridFireCheckout,
  getBalance,
  getDaiAllowance,
  getDaiContract,
  getGridFireContract,
  purchaseRelease,
  setDaiAllowance
};
