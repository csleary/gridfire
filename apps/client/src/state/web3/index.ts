import { BasketItem, SalesHistory } from "@gridfire/shared/types";
import detectEthereumProvider from "@metamask/detect-provider";
import { createSlice } from "@reduxjs/toolkit";
import { BrowserProvider, Eip1193Provider, getAddress, isError, toQuantity } from "ethers";

import { checkoutFreeBasket } from "@/state/releases";
import { toastError, toastWarning } from "@/state/toast";
import { AppDispatch, GetState } from "@/types";
import { fetchGridfirePurchaseEvents, getDaiAllowance, getDaiBalance, gridFireCheckout } from "@/web3";

const VITE_CHAIN_ID = import.meta.env.VITE_CHAIN_ID;

interface Web3State {
  account: string;
  accountShort: string;
  basket: BasketItem[];
  chainId: string;
  daiAllowance: string;
  daiBalance: string;
  error: string;
  isAddingToBasket: boolean;
  isCheckingOut: boolean;
  isConnected: boolean;
  isFetchingAllowance: boolean;
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
  daiAllowance: 0n.toString(),
  daiBalance: 0n.toString(),
  error: "",
  isAddingToBasket: false,
  isCheckingOut: false,
  isConnected: false,
  isFetchingAllowance: false,
  isFetchingSales: false,
  mintedEditionIds: [],
  networkName: "",
  sales: []
};

const web3Slice = createSlice({
  initialState,
  name: "web3",
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
    setDaiBalance(state, action) {
      state.daiBalance = action.payload;
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
    setIsConnected(state, action) {
      state.isConnected = action.payload;
    },
    setIsFetchingAllowance(state, action) {
      state.isFetchingAllowance = action.payload;
    },
    setIsFetchingSales(state, action) {
      state.isFetchingSales = action.payload;
    },
    setMintedEditionIds(state, action) {
      state.mintedEditionIds = [...state.mintedEditionIds, action.payload];
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
      dispatch(setError(""));
      dispatch(setIsCheckingOut(true));

      const total = basket.reduce((prev, { price }) => prev + price, 0n);
      const { userId } = getState().user;

      // Only do contract checkout if there's a non-zero price.
      if (total > 0n) {
        await gridFireCheckout(basket, userId);
      } else {
        await dispatch(checkoutFreeBasket(basket));
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

const fetchDaiBalance = (account: string) => async (dispatch: AppDispatch) => {
  try {
    const currentBalance = await getDaiBalance(account);
    dispatch(setDaiBalance(currentBalance));
  } catch (error) {
    console.error(error);
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
  const requiredChainId = BigInt(VITE_CHAIN_ID);

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
    dispatch(fetchDaiAllowance(firstAccount));
    dispatch(fetchDaiBalance(firstAccount));
    dispatch(setAccount(firstAccount));
    dispatch(setIsConnected(true));
    dispatch(setNetworkName({ chainId: chainId.toString(), name }));
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && error.code === -32002) {
      dispatch(
        toastWarning({
          message:
            "Please unlock or open your wallet manually, as a previous request (e.g. account selection) is still pending.",
          title: "Your wallet is processing a previous request"
        })
      );
    } else if (!isError(error, "NETWORK_ERROR") && error instanceof Error) {
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
  setDaiBalance,
  setError,
  setIsAddingToBasket,
  setIsCheckingOut,
  setIsConnected,
  setIsFetchingAllowance,
  setIsFetchingSales,
  setMintedEditionIds,
  setNetworkName,
  setSales
} = web3Slice.actions;

export type { Web3State };
export { checkoutBasket, connectToWeb3, fetchDaiAllowance, fetchDaiBalance, fetchSales };
export default web3Slice.reducer;
