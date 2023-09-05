import { BrowserProvider, Eip1193Provider, getAddress, isError, toQuantity } from "ethers";
import {
  fetchDaiApprovalEvents,
  fetchGridfireClaimEvents,
  fetchGridfirePurchaseEvents,
  getDaiAllowance,
  getDaiBalance,
  fetchDaiPurchaseEvents,
  gridFireCheckout
} from "web3";
import { AppDispatch, GetState } from "index";
import { BasketItem, SalesHistory } from "types";
import { toastError, toastWarning } from "state/toast";
import { createSlice } from "@reduxjs/toolkit";
import { batch } from "react-redux";
import detectEthereumProvider from "@metamask/detect-provider";

const { REACT_APP_CHAIN_ID = "" } = process.env;

interface GridfireLog {
  amount: string;
  blockNumber: number;
  transactionHash: string;
}

interface GridfirePaymentLog {
  amountPaid: string;
  artistId: string;
  artistName: string;
  blockNumber: number;
  editionId?: string;
  releaseId: string;
  releaseTitle: string;
  transactionHash: string;
}

interface Web3State {
  account: string;
  accountShort: string;
  basket: BasketItem[];
  chainId: string;
  claims: GridfireLog[];
  daiAllowance: string;
  daiApprovals: GridfireLog[];
  daiBalance: string;
  daiPurchases: GridfirePaymentLog[];
  error: string;
  isAddingToBasket: boolean;
  isCheckingOut: boolean;
  isConnected: boolean;
  isFetchingAllowance: boolean;
  isFetchingApprovals: boolean;
  isFetchingClaims: boolean;
  isFetchingPurchases: boolean;
  isFetchingSales: boolean;
  mintedEditionIds: string[];
  networkName: string;
  sales: SalesHistory;
}

const initialState: Web3State = {
  account: "",
  accountShort: "",
  basket: [],
  chainId: "",
  claims: [],
  daiAllowance: 0n.toString(),
  daiApprovals: [],
  daiBalance: 0n.toString(),
  daiPurchases: [],
  error: "",
  isAddingToBasket: false,
  isCheckingOut: false,
  isConnected: false,
  isFetchingAllowance: false,
  isFetchingApprovals: false,
  isFetchingClaims: false,
  isFetchingPurchases: false,
  isFetchingSales: false,
  mintedEditionIds: [],
  networkName: "",
  sales: []
};

const web3Slice = createSlice({
  name: "web3",
  initialState,
  reducers: {
    addToBasket(state, action) {
      if (state.basket.some(({ releaseId }) => releaseId === action.payload.releaseId)) {
        return;
      }
      state.basket = [...state.basket, action.payload];
    },
    emptyBasket(state) {
      state.basket = [];
    },
    removeFromBasket(state, action) {
      state.basket = state.basket.filter(({ releaseId }) => releaseId !== action.payload);
    },
    setAccount(state, action) {
      const account = getAddress(action.payload);
      state.account = account;
      state.accountShort = `${account.slice(0, 6)}…${account.slice(-4)}`;
    },
    setDaiAllowance(state, action) {
      state.daiAllowance = action.payload;
    },
    setDaiApprovals(state, action) {
      state.daiApprovals = action.payload;
    },
    setDaiBalance(state, action) {
      state.daiBalance = action.payload;
    },
    setDaiPurchases(state, action) {
      state.daiPurchases = action.payload;
    },
    setError(state, action) {
      state.error = action.payload;
    },
    setIsAddingToBasket(state, action) {
      state.isAddingToBasket = action.payload;
    },
    setIsCheckingOut(state, action) {
      state.isCheckingOut = action.payload;
    },
    setGridfireClaims(state, action) {
      state.claims = action.payload;
    },
    setIsConnected(state, action) {
      state.isConnected = action.payload;
    },
    setIsFetchingAllowance(state, action) {
      state.isFetchingAllowance = action.payload;
    },
    setIsFetchingApprovals(state, action) {
      state.isFetchingApprovals = action.payload;
    },
    setIsFetchingClaims(state, action) {
      state.isFetchingClaims = action.payload;
    },
    setIsFetchingSales(state, action) {
      state.isFetchingSales = action.payload;
    },
    setMintedEditionIds(state, action) {
      state.mintedEditionIds = [...state.mintedEditionIds, action.payload];
    },
    setIsFetchingPurchases(state, action) {
      state.isFetchingPurchases = action.payload;
    },
    setNetworkName(state, action) {
      const { chainId, name } = action.payload;
      state.networkName = name;
      state.chainId = chainId;
    },
    setSales(state, action) {
      state.sales = action.payload;
    }
  }
});

const checkoutBasket =
  (basket: BasketItem[] = []) =>
  async (dispatch: AppDispatch, getState: GetState) => {
    try {
      batch(() => {
        dispatch(setError(""));
        dispatch(setIsCheckingOut(true));
      });

      const total = basket.reduce((prev, { price }) => prev + price, 0n);

      // Only do contract checkout if there's a non-zero price.
      if (total > 0n) {
        const { userId } = getState().user;
        await gridFireCheckout(basket, userId);
      }
    } catch (error) {
      dispatch(setError(error));
      throw error;
    } finally {
      dispatch(setIsCheckingOut(false));
    }
  };

const fetchDaiAllowance = (account: string) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setIsFetchingAllowance(true));
    const currentAllowance = await getDaiAllowance(account);
    dispatch(setDaiAllowance(currentAllowance));
  } catch (error) {
    console.error(error);
  } finally {
    dispatch(setIsFetchingAllowance(false));
  }
};

const fetchDaiApprovals = (account: string) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setIsFetchingApprovals(true));
    const approvals = await fetchDaiApprovalEvents(account);
    dispatch(setDaiApprovals(approvals));
  } catch (error) {
    console.error(error);
  } finally {
    dispatch(setIsFetchingApprovals(false));
  }
};

const fetchDaiBalance = (account: string) => async (dispatch: AppDispatch) => {
  try {
    const currentBalance = await getDaiBalance(account);
    dispatch(setDaiBalance(currentBalance));
  } catch (error) {
    console.error(error);
  }
};

const fetchDaiPurchases = (account: string) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setIsFetchingPurchases(true));
    const purchases = await fetchDaiPurchaseEvents(account);
    dispatch(setDaiPurchases(purchases));
  } catch (error) {
    console.error(error);
  } finally {
    dispatch(setIsFetchingPurchases(false));
  }
};

const fetchGridfireClaims = () => async (dispatch: AppDispatch) => {
  try {
    dispatch(setIsFetchingClaims(true));
    const claims = await fetchGridfireClaimEvents();
    dispatch(setClaims(claims));
  } catch (error) {
    console.error(error);
  } finally {
    dispatch(setIsFetchingClaims(false));
  }
};

const fetchSales = () => async (dispatch: AppDispatch) => {
  try {
    dispatch(setIsFetchingSales(true));
    const sales = await fetchGridfirePurchaseEvents();
    dispatch(setSales(sales));
  } catch (error) {
    console.error(error);
  } finally {
    dispatch(setIsFetchingSales(false));
  }
};

const connectToWeb3 = () => async (dispatch: AppDispatch) => {
  const ethereum = await detectEthereumProvider();
  const requiredChainId = BigInt(REACT_APP_CHAIN_ID);

  if (!ethereum) {
    return void dispatch(
      toastWarning({ message: "No local wallet found. Do you have a web3 wallet installed?", title: "Warning" })
    );
  }

  const provider = new BrowserProvider(ethereum as unknown as Eip1193Provider);

  try {
    let network = await provider.getNetwork();

    if (network.chainId !== requiredChainId) {
      await provider.send("wallet_switchEthereumChain", [{ chainId: toQuantity(requiredChainId) }]);
      network = await provider.getNetwork();
    }

    const accounts = await provider.send("eth_requestAccounts", []);
    const [firstAccount] = accounts;

    if (!firstAccount) {
      return void dispatch(toastWarning({ message: "Could not connect. Is the wallet unlocked?", title: "Warning" }));
    }

    const { chainId, name } = network;

    batch(() => {
      dispatch(fetchDaiAllowance(firstAccount));
      dispatch(fetchDaiBalance(firstAccount));
      dispatch(setAccount(firstAccount));
      dispatch(setIsConnected(true));
      dispatch(setNetworkName({ chainId: chainId.toString(), name }));
    });
  } catch (error: any) {
    if (error.code === -32002) {
      dispatch(
        toastWarning({
          message:
            "Please unlock or open your wallet manually, as a previous request (e.g. account selection) is still pending.",
          title: "Your wallet is processing a previous request"
        })
      );
    } else if (!isError(error, "NETWORK_ERROR")) {
      dispatch(toastError({ message: error.message }));
    }
  }
};

export const {
  addToBasket,
  emptyBasket,
  removeFromBasket,
  setAccount,
  setDaiAllowance,
  setDaiApprovals,
  setDaiBalance,
  setDaiPurchases,
  setError,
  setGridfireClaims: setClaims,
  setIsAddingToBasket,
  setIsCheckingOut,
  setIsConnected,
  setIsFetchingAllowance,
  setIsFetchingApprovals,
  setIsFetchingClaims,
  setIsFetchingPurchases,
  setIsFetchingSales,
  setMintedEditionIds,
  setNetworkName,
  setSales
} = web3Slice.actions;

export {
  checkoutBasket,
  connectToWeb3,
  fetchDaiAllowance,
  fetchDaiApprovals,
  fetchDaiBalance,
  fetchDaiPurchases,
  fetchGridfireClaims,
  fetchSales
};

export default web3Slice.reducer;
