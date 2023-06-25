import { BrowserProvider, Contract, Eip1193Provider, JsonRpcSigner, encodeBytes32String, parseEther } from "ethers";
import { BasketItem } from "types";
import axios from "axios";
import daiAbi from "web3/dai";
import detectEthereumProvider from "@metamask/detect-provider";
import gridFireEditionsAbi from "web3/gridfireEditionsABI";
import gridFirePaymentAbi from "web3/gridfirePaymentABI";

const {
  REACT_APP_GRIDFIRE_EDITIONS_ADDRESS = "",
  REACT_APP_GRIDFIRE_PAYMENT_ADDRESS = "",
  REACT_APP_DAI_CONTRACT_ADDRESS: daiContractAddress = ""
} = process.env;

const getProvider = async () => {
  const ethereum = await detectEthereumProvider();
  return new BrowserProvider(ethereum as unknown as Eip1193Provider);
};

const claimBalance = async () => {
  const provider = await getProvider();
  const signer = await provider.getSigner();
  const gridFireContract = getGridFireContract(signer);
  const transactionReceipt = await gridFireContract.claim();
  const { status } = await transactionReceipt.wait();
  if (status !== 1) throw new Error("Claim unsuccessful.");
};

const getBalance = async (paymentAddress: string): Promise<string> => {
  const provider = await getProvider();
  const gridFireContract = getGridFireContract(provider);
  const balanceBigInt = await gridFireContract.getBalance(paymentAddress);
  return balanceBigInt.toString();
};

const getDaiAllowance = async (account: string): Promise<string> => {
  const provider = await getProvider();
  const daiContract = new Contract(daiContractAddress, daiAbi, provider);
  const allowanceBigInt = await daiContract.allowance(account, REACT_APP_GRIDFIRE_PAYMENT_ADDRESS);
  return allowanceBigInt.toString();
};

const getDaiBalance = async (account: string): Promise<string> => {
  const provider = await getProvider();
  const daiContract = new Contract(daiContractAddress, daiAbi, provider);
  const balanceBigInt = await daiContract.balanceOf(account);
  return balanceBigInt.toString();
};

const getDaiApprovalEvents = async (account: string) => {
  const res = await axios.get(`/api/web3/approvals/${account}`);
  return res.data;
};

const getDaiContract = (signerOrProvider: BrowserProvider | JsonRpcSigner) => {
  return new Contract(daiContractAddress, daiAbi, signerOrProvider);
};

const getGridFireContract = (signerOrProvider: BrowserProvider | JsonRpcSigner) => {
  return new Contract(REACT_APP_GRIDFIRE_PAYMENT_ADDRESS, gridFirePaymentAbi, signerOrProvider);
};

const getGridFireEditionsContract = (signerOrProvider: BrowserProvider | JsonRpcSigner) => {
  return new Contract(REACT_APP_GRIDFIRE_EDITIONS_ADDRESS, gridFireEditionsAbi, signerOrProvider);
};

const getGridFireClaimEvents = async () => {
  const res = await axios.get("/api/web3/claims");
  return res.data;
};

const getGridFireEditionsByReleaseId = async (releaseId: string) => {
  const res = await axios.get(`/api/web3/editions/${releaseId}`);
  return res.data;
};

const getGridFireEditionUris = async (releaseId: string) => {
  const res = await axios.get(`/api/web3/editions/${releaseId}/uri`);
  return res.data;
};

const getGridFirePurchaseEvents = async () => {
  const res = await axios.get("/api/web3/purchases");
  return res.data;
};

const getUserEditions = async () => {
  const res = await axios.get("/api/web3/editions/user");
  return res.data;
};

const gridFireCheckout = async (basket: BasketItem[], userId: string) => {
  const provider = await getProvider();
  const signer = await provider.getSigner();
  const gridFireContract = getGridFireContract(signer);

  const contractBasket = basket.map(
    ({ paymentAddress, price, releaseId }: { paymentAddress: string; price: bigint; releaseId: string }) => ({
      artist: paymentAddress,
      releaseId: encodeBytes32String(releaseId),
      amountPaid: price
    })
  );

  const transactionReceipt = await gridFireContract.checkout(contractBasket, encodeBytes32String(userId));
  const { status, transactionHash } = await transactionReceipt.wait();
  if (status !== 1) throw new Error("Transaction unsuccessful.");
  return transactionHash;
};

interface MintEditionParams {
  amount: number;
  description: string;
  price: string;
  releaseId: string;
  tracks: string[];
}

const mintEdition = async ({ amount, description, price, releaseId, tracks }: MintEditionParams) => {
  const provider = await getProvider();
  const signer = await provider.getSigner();
  const gridFireEditions = getGridFireEditionsContract(signer);
  const res = await axios.post(`/api/web3/editions/mint`, { amount, description, price, releaseId, tracks });
  const { metadataUri, objectId } = res.data;
  const bigNumAmount = BigInt(`${amount}`);
  const weiPrice = parseEther(`${price}`);
  const releaseIdBytes = encodeBytes32String(releaseId);
  const objectIdBytes = encodeBytes32String(objectId);

  const mintReceipt = await gridFireEditions.mintEdition(
    bigNumAmount,
    weiPrice,
    metadataUri,
    releaseIdBytes,
    objectIdBytes
  );

  const { status } = await mintReceipt.wait();
  if (status !== 1) throw new Error("Edition mint unsuccessful.");
};

interface PurchaseEditionParams {
  artist: string;
  editionId: bigint;
  price: bigint;
  releaseId: string;
}

const purchaseEdition = async ({ artist, editionId, price, releaseId }: PurchaseEditionParams) => {
  const provider = await getProvider();
  const signer = await provider.getSigner();
  const gridFireEditions = getGridFireEditionsContract(signer);
  const releaseIdBytes = encodeBytes32String(releaseId);
  const transactionReceipt = await gridFireEditions.purchaseGridFireEdition(editionId, price, artist, releaseIdBytes);
  const { status, transactionHash } = await transactionReceipt.wait();
  if (status !== 1) throw new Error("Transaction unsuccessful.");
  return transactionHash;
};

interface PurchaseReleaseParams {
  paymentAddress: string;
  price: string;
  releaseId: string;
  userId: string;
}

const purchaseRelease = async ({ paymentAddress, price, releaseId, userId }: PurchaseReleaseParams) => {
  const provider = await getProvider();
  const signer = await provider.getSigner();
  const gridFirePayment = getGridFireContract(signer);
  const weiReleasePrice = parseEther(`${price}`);
  const releaseIdBytes = encodeBytes32String(releaseId);
  const userIdBytes = encodeBytes32String(userId);

  const transactionReceipt = await gridFirePayment.purchase(
    paymentAddress,
    weiReleasePrice,
    releaseIdBytes,
    userIdBytes
  );

  const { status, transactionHash } = await transactionReceipt.wait();
  if (status !== 1) throw new Error("Transaction unsuccessful.");
  return transactionHash;
};

const setDaiAllowance = async (newLimitInDai = "") => {
  const provider = await getProvider();
  const signer = await provider.getSigner();
  const daiContract = getDaiContract(signer);
  const requestedAllowance = parseEther(newLimitInDai);
  const approvalReceipt = await daiContract.approve(REACT_APP_GRIDFIRE_PAYMENT_ADDRESS, requestedAllowance);
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
