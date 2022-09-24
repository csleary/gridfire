import { BigNumber, Contract, ethers, utils } from "ethers";
import axios from "axios";
import daiAbi from "web3/dai";
import detectEthereumProvider from "@metamask/detect-provider";
import gridFirePaymentAbi from "web3/gridfire";

const { REACT_APP_CONTRACT_ADDRESS, REACT_APP_DAI_CONTRACT_ADDRESS: daiContractAddress } = process.env;

const getProvider = async () => {
  const ethereum = await detectEthereumProvider();
  return new ethers.providers.Web3Provider(ethereum);
};

const claimBalance = async () => {
  const provider = await getProvider();
  const signer = provider.getSigner();
  const gridFireContract = getGridFireContract(signer);
  const transactionReceipt = await gridFireContract.claim();
  const { status } = await transactionReceipt.wait();
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

const getDaiBalance = async account => {
  const provider = await getProvider();
  const daiContract = new Contract(daiContractAddress, daiAbi, provider);
  return daiContract.balanceOf(account);
};

const getDaiApprovalEvents = async account => {
  const res = await axios.get(`/api/web3/approvals/${account}`);
  return res.data;
};

const getDaiContract = signerOrProvider => {
  return new Contract(daiContractAddress, daiAbi, signerOrProvider);
};

const getGridFireContract = signerOrProvider => {
  return new Contract(REACT_APP_CONTRACT_ADDRESS, gridFirePaymentAbi, signerOrProvider);
};

const getGridFireClaimEvents = async paymentAddress => {
  const res = await axios.get(`/api/web3/claims/${paymentAddress}`);
  return res.data;
};

const getGridFireEditionsByReleaseId = async releaseId => {
  const res = await axios.get(`/api/web3/editions/${releaseId}`);
  return res.data;
};

const getGridFireEditionUris = async releaseId => {
  const res = await axios.get(`/api/web3/editions/uri/${releaseId}`);
  return res.data;
};

const getGridFirePurchaseEvents = async paymentAddress => {
  const res = await axios.get(`/api/web3/purchases/${paymentAddress}`);
  return res.data;
};

const getUserEditions = async userId => {
  const res = await axios.get(`/api/web3/editions/user/${userId}`);
  return res.data;
};

const gridFireCheckout = async (basket, userId) => {
  const provider = await getProvider();
  const signer = provider.getSigner();
  const gridFireContract = getGridFireContract(signer);

  const contractBasket = basket.map(({ paymentAddress, price, releaseId }) => ({
    artist: paymentAddress,
    releaseId,
    amountPaid: price,
    releasePrice: price
  }));

  const transactionReceipt = await gridFireContract.checkout(contractBasket, userId);
  const { status, transactionHash } = await transactionReceipt.wait();
  if (status !== 1) throw new Error("Transaction unsuccessful.");
  return transactionHash;
};

const mintEdition = async ({ description, price, releaseId, amount }) => {
  const provider = await getProvider();
  const signer = provider.getSigner();
  const gridFireContract = getGridFireContract(signer);
  const res = await axios.post(`/api/web3/mint`, { description, price, releaseId, amount });
  const metadataUri = res.data;
  const bigNumAmount = BigNumber.from(`${amount}`);
  const weiPrice = utils.parseEther(`${price}`);
  const mintReceipt = await gridFireContract.mintEdition(bigNumAmount, weiPrice, metadataUri, releaseId);
  const { status } = await mintReceipt.wait();
  if (status !== 1) throw new Error("Edition mint unsuccessful.");
};

const purchaseEdition = async ({ artist, editionId, price }) => {
  const provider = await getProvider();
  const signer = provider.getSigner();
  const gridFirePayment = getGridFireContract(signer);
  const transactionReceipt = await gridFirePayment.purchaseGridFireEdition(editionId, price, artist);
  const { status, transactionHash } = await transactionReceipt.wait();
  if (status !== 1) throw new Error("Transaction unsuccessful.");
  return transactionHash;
};

const purchaseRelease = async ({ paymentAddress, price, releaseId, userId }) => {
  const provider = await getProvider();
  const signer = provider.getSigner();
  const gridFirePayment = getGridFireContract(signer);
  const weiReleasePrice = utils.parseEther(`${price}`);
  const transactionReceipt = await gridFirePayment.purchase(paymentAddress, releaseId, userId, weiReleasePrice);
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
  getDaiBalance,
  getDaiContract,
  getDaiApprovalEvents,
  getGridFireClaimEvents,
  getGridFireContract,
  getGridFireEditionsByReleaseId,
  getGridFireEditionUris,
  getGridFirePurchaseEvents,
  getUserEditions,
  mintEdition,
  purchaseEdition,
  purchaseRelease,
  setDaiAllowance
};
