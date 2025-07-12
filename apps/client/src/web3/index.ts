import daiAbi from "@gridfire/shared/abi/dai";
import gridFireEditionsAbi from "@gridfire/shared/abi/editions";
import gridFirePaymentAbi from "@gridfire/shared/abi/payment";
import { BasketItem } from "@gridfire/shared/types";
import detectEthereumProvider from "@metamask/detect-provider";
import { nanoid } from "@reduxjs/toolkit";
import axios from "axios";
import { BrowserProvider, Contract, Eip1193Provider, encodeBytes32String, JsonRpcSigner, parseEther } from "ethers";

import { store } from "@/main";
import { addActiveProcess, removeActiveProcess } from "@/state/user";

const editionsContractAddress = import.meta.env.VITE_GRIDFIRE_EDITIONS_ADDRESS;
const paymentContactAddress = import.meta.env.VITE_GRIDFIRE_PAYMENT_ADDRESS;
const daiContractAddress = import.meta.env.VITE_DAI_CONTRACT_ADDRESS;
const ethereum = await detectEthereumProvider();
let provider = new BrowserProvider(ethereum as unknown as Eip1193Provider) as BrowserProvider;

const getProvider = async () => {
  if (provider) {
    return provider;
  }

  const ethereum = await detectEthereumProvider();
  if (!ethereum) {
    throw new Error("Please install a we3 wallet (e.g. MetaMask).");
  }

  provider = new BrowserProvider(ethereum as unknown as Eip1193Provider) as BrowserProvider;
  return provider;
};

const claimBalance = async () => {
  const provider = await getProvider();
  const signer = await provider.getSigner();
  const gridFireContract = getGridfireContract(signer);
  const transactionReceipt = await gridFireContract.claim();
  const { status } = await transactionReceipt.wait();
  if (status !== 1) throw new Error("Claim unsuccessful.");
};

const getBalance = async (paymentAddress: string): Promise<string> => {
  const provider = await getProvider();
  const gridFireContract = getGridfireContract(provider);
  const balanceBigInt = await gridFireContract.getBalance(paymentAddress);
  return balanceBigInt.toString();
};

const getDaiAllowance = async (account: string): Promise<string> => {
  const provider = await getProvider();
  const daiContract = new Contract(daiContractAddress, daiAbi, provider);
  const allowanceBigInt = await daiContract.allowance(account, paymentContactAddress);
  return allowanceBigInt.toString();
};

const getDaiBalance = async (account: string): Promise<string> => {
  const provider = await getProvider();
  const daiContract = new Contract(daiContractAddress, daiAbi, provider);
  const balanceBigInt = await daiContract.balanceOf(account);
  return balanceBigInt.toString();
};

const getDaiContract = (signerOrProvider: BrowserProvider | JsonRpcSigner) => {
  return new Contract(daiContractAddress, daiAbi, signerOrProvider);
};

const getGridfireContract = (signerOrProvider: BrowserProvider | JsonRpcSigner) => {
  return new Contract(paymentContactAddress, gridFirePaymentAbi, signerOrProvider);
};

const getGridfireEditionsContract = (signerOrProvider: BrowserProvider | JsonRpcSigner) => {
  return new Contract(editionsContractAddress, gridFireEditionsAbi, signerOrProvider);
};

const fetchVisibleGridfireEditionsByReleaseId = async (releaseId: string) => {
  const res = await axios.get(`/api/editions/${releaseId}`);
  return res.data;
};

const fetchMintedGridfireEditionsByReleaseId = async (releaseId: string) => {
  const res = await axios.get(`/api/editions/${releaseId}/minted`);
  return res.data;
};

const fetchGridfireEditionUris = async (releaseId: string) => {
  const res = await axios.get(`/api/editions/${releaseId}/uri`);
  return res.data;
};

const fetchGridfirePurchaseEvents = async () => {
  const res = await axios.get("/api/web3/sales");
  return res.data;
};

const fetchResolvedAddress = async (address: string) => {
  const res = await axios.get(`/api/web3/domain/${address}`);
  return res.data;
};

const fetchUserEditions = async () => {
  const res = await axios.get("/api/editions/user");
  return res.data;
};

const gridFireCheckout = async (basket: BasketItem[], userId: string) => {
  const processId = nanoid();
  store.dispatch(addActiveProcess({ description: "Checking out…", id: processId, type: "purchase" }));

  try {
    const provider = await getProvider();
    const signer = await provider.getSigner();
    const gridFireContract = getGridfireContract(signer);

    const contractBasket = basket.map(
      ({ paymentAddress, price, releaseId }: { paymentAddress: string; price: bigint; releaseId: string }) => ({
        amountPaid: price,
        artist: paymentAddress,
        releaseId: encodeBytes32String(releaseId)
      })
    );

    const transactionReceipt = await gridFireContract.checkout(contractBasket, encodeBytes32String(userId));
    const { status, transactionHash } = await transactionReceipt.wait();
    if (status !== 1) throw new Error("Transaction unsuccessful.");
    return transactionHash;
  } finally {
    store.dispatch(removeActiveProcess(processId));
  }
};

interface MintEditionParams {
  amount: number;
  description: string;
  price: string;
  releaseId: string;
  tracks: string[];
}

const mintEdition = async ({ amount, description, price, releaseId, tracks }: MintEditionParams) => {
  const processId = nanoid();
  store.dispatch(addActiveProcess({ description: "Minting edition…", id: processId, type: "mint" }));
  let objectId = "";

  try {
    const provider = await getProvider();
    const signer = await provider.getSigner();
    const gridFireEditions = getGridfireEditionsContract(signer);
    const res = await axios.post(`/api/editions/mint`, { amount, description, price, releaseId, tracks });
    const { metadataUri } = res.data;
    ({ objectId } = res.data);
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
  } catch (error) {
    if (objectId) {
      axios.delete(`/api/editions/mint/${objectId}`).catch(console.error); // Clean up, unpin from IPFS.
    }

    throw error;
  } finally {
    store.dispatch(removeActiveProcess(processId));
  }
};

interface PurchaseEditionParams {
  artist: string;
  editionId: bigint;
  price: bigint;
  releaseId: string;
}

const purchaseEdition = async ({ artist, editionId, price, releaseId }: PurchaseEditionParams) => {
  const processId = nanoid();
  store.dispatch(addActiveProcess({ description: "Purchasing edition…", id: processId, type: "purchase" }));

  try {
    const provider = await getProvider();
    const signer = await provider.getSigner();
    const gridFireEditions = getGridfireEditionsContract(signer);
    const releaseIdBytes = encodeBytes32String(releaseId);
    const transactionReceipt = await gridFireEditions.purchaseGridfireEdition(editionId, price, artist, releaseIdBytes);
    const { status, transactionHash } = await transactionReceipt.wait();
    if (status !== 1) throw new Error("Transaction unsuccessful.");
    return transactionHash;
  } finally {
    store.dispatch(removeActiveProcess(processId));
  }
};

interface PurchaseReleaseParams {
  paymentAddress: string;
  price: string;
  releaseId: string;
  userId: string;
}

const purchaseRelease = async ({ paymentAddress, price, releaseId, userId }: PurchaseReleaseParams) => {
  const processId = nanoid();
  store.dispatch(addActiveProcess({ description: "Purchasing edition…", id: processId, type: "purchase" }));

  try {
    const provider = await getProvider();
    const signer = await provider.getSigner();
    const gridFirePayment = getGridfireContract(signer);
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
  } finally {
    store.dispatch(removeActiveProcess(processId));
  }
};

const setDaiAllowance = async (newLimitInDai = "") => {
  const provider = await getProvider();
  const signer = await provider.getSigner();
  const daiContract = getDaiContract(signer);
  const requestedAllowance = parseEther(newLimitInDai);
  const approvalReceipt = await daiContract.approve(paymentContactAddress, requestedAllowance);
  const { status } = await approvalReceipt.wait();
  if (status !== 1) throw new Error("Approval unsuccessful.");
};

export {
  claimBalance,
  fetchGridfireEditionUris,
  fetchGridfirePurchaseEvents,
  fetchMintedGridfireEditionsByReleaseId,
  fetchResolvedAddress,
  fetchUserEditions,
  fetchVisibleGridfireEditionsByReleaseId,
  getBalance,
  getDaiAllowance,
  getDaiBalance,
  getDaiContract,
  gridFireCheckout,
  mintEdition,
  purchaseEdition,
  purchaseRelease,
  setDaiAllowance
};
