import { Contract, ethers, utils } from "ethers";
import daiAbi from "web3/dai";
import detectEthereumProvider from "@metamask/detect-provider";
import GridFirePayment from "web3/GridFirePayment.json";

const { REACT_APP_CONTRACT_ADDRESS, REACT_APP_DAI_CONTRACT_ADDRESS: daiContractAddress } = process.env;

const getProvider = async () => {
  const ethereum = await detectEthereumProvider();
  return new ethers.providers.Web3Provider(ethereum);
};

const claimBalance = async () => {
  const provider = await getProvider();
  const signer = provider.getSigner();
  //
  const daiContract = new Contract(daiContractAddress, daiAbi, provider);
  const allowance = await daiContract.allowance(REACT_APP_CONTRACT_ADDRESS, signer.getAddress());
  console.log(allowance);
  //
  const gridFireContract = getGridFireContract(signer);
  const transactionReceipt = await gridFireContract.claim().catch(console.log);
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

const getDaiBalance = async account => {
  const provider = await getProvider();
  const daiContract = new Contract(daiContractAddress, daiAbi, provider);
  return daiContract.balanceOf(account);
};

const getDaiApprovalEvents = async account => {
  const provider = await getProvider();
  const daiContract = new Contract(daiContractAddress, daiAbi, provider);
  const approvalsFilter = daiContract.filters.Approval(account, REACT_APP_CONTRACT_ADDRESS);
  const approvals = await daiContract.queryFilter(approvalsFilter);
  return approvals;
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

  const contractBasket = basket.map(({ id, paymentAddress, price }) => ({
    artist: paymentAddress,
    id,
    amountPaid: price,
    releasePrice: price
  }));

  const transactionReceipt = await gridFireContract.checkout(contractBasket);
  const { status, transactionHash } = await transactionReceipt.wait();
  if (status !== 1) throw new Error("Transaction unsuccessful.");
  return transactionHash;
};

const getGridFireClaimEvents = async paymentAddress => {
  const provider = await getProvider();
  const gridFire = getGridFireContract(provider);
  const claimFilter = gridFire.filters.Claim(paymentAddress);
  return gridFire.queryFilter(claimFilter);
};

const getGridFirePurchaseEvents = async paymentAddress => {
  const provider = await getProvider();
  const gridFire = getGridFireContract(provider);
  const purchaseFilter = gridFire.filters.Purchase(null, paymentAddress);
  return gridFire.queryFilter(purchaseFilter);
};

const purchaseRelease = async (paymentAddress, id, price) => {
  const provider = await getProvider();
  const signer = provider.getSigner();
  const gridFirePayment = getGridFireContract(signer);
  const weiReleasePrice = utils.parseEther(`${price}`);
  const transactionReceipt = await gridFirePayment.purchase(paymentAddress, id, weiReleasePrice, weiReleasePrice);
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
  getGridFirePurchaseEvents,
  purchaseRelease,
  setDaiAllowance
};
