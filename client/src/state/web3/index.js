import { BigNumber, constants, ethers, utils } from "ethers";
import { getDaiAllowance, getDaiBalance, gridFireCheckout } from "web3/contract";
import { toastError, toastSuccess, toastWarning } from "state/toast";
import { createSlice } from "@reduxjs/toolkit";
import { fetchUser } from "state/user";
import axios from "axios";
import { batch } from "react-redux";
import detectEthereumProvider from "@metamask/detect-provider";

const { REACT_APP_CHAIN_ID } = process.env;

const web3Slice = createSlice({
  name: "web3",
  initialState: {
    account: "",
    accountShort: "",
    basket: [],
    chainId: "",
    error: "",
    daiAllowance: utils.parseEther("0"),
    daiBalance: utils.parseEther("0"),
    isAddingToBasket: false,
    isCheckingOut: false,
    isConnected: false,
    isFetchingAllowance: false,
    networkName: ""
  },
  reducers: {
    addToBasket(state, action) {
      state.basket = [...state.basket, action.payload];
    },

    emptyBasket(state) {
      state.basket = [];
    },

    removeFromBasket(state, action) {
      state.basket = state.basket.filter(item => item.id !== action.payload);
    },

    setAccount(state, action) {
      const account = action.payload;
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

    setNetworkName(state, action) {
      const { chainId, name } = action.payload;
      state.networkName = name;
      state.chainId = chainId;
    }
  }
});

const checkoutBasket =
  (basket = []) =>
  async dispatch => {
    try {
      batch(() => {
        dispatch(setError(""));
        dispatch(setIsCheckingOut(true));
      });

      const total = basket.reduce((prev, curr) => prev.add(curr.price), BigNumber.from("0"));

      // Only do contract checkout if there's a non-zero price.
      let transactionHash;
      if (total.gt(constants.Zero)) {
        transactionHash = await gridFireCheckout(basket);
      }

      // Backend purchase validation.
      await axios.post(`/api/release/purchase`, { transactionHash });
      dispatch(fetchUser());
      dispatch(toastSuccess({ message: "Purchased!", title: "Success" }));
    } catch (error) {
      dispatch(setError(error));
      throw error;
    } finally {
      dispatch(setIsCheckingOut(false));
    }
  };

const fetchDaiAllowance = account => async dispatch => {
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

const fetchDaiBalance = account => async dispatch => {
  try {
    const currentBalance = await getDaiBalance(account);
    dispatch(setDaiBalance(currentBalance));
  } catch (error) {
    console.error(error);
  }
};

const connectToWeb3 = () => async dispatch => {
  const ethereum = await detectEthereumProvider();
  const requiredChainId = Number.parseInt(REACT_APP_CHAIN_ID);

  if (!ethereum) {
    return void dispatch(
      toastWarning({ message: "No local wallet found. Do you have a web3 wallet installed?", title: "Warning" })
    );
  }

  try {
    const provider = new ethers.providers.Web3Provider(ethereum);
    let network = await provider.getNetwork();

    if (network.chainId !== requiredChainId) {
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: utils.hexValue(requiredChainId) }]
      });

      network = await provider.getNetwork();
    }

    const accounts = await ethereum.request({ method: "eth_requestAccounts" });
    const [firstAccount] = accounts;

    if (!firstAccount) {
      return void dispatch(toastWarning({ message: "Could not connect. Is the wallet unlocked?", title: "Warning" }));
    }

    batch(() => {
      dispatch(fetchDaiAllowance(firstAccount));
      dispatch(fetchDaiBalance(firstAccount));
      dispatch(setAccount(firstAccount));
      dispatch(setIsConnected(true));
      dispatch(setNetworkName(network));
    });
  } catch (error) {
    if (error.code === 4902) {
      try {
        await ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: utils.hexValue(requiredChainId),
              rpcUrls: ["https://arb1.arbitrum.io/rpc", "https://rpc.ankr.com/arbitrum"],
              chainName: "Arbitrum One",
              nativeCurrency: {
                name: "ETH",
                symbol: "ETH",
                decimals: 18
              },
              blockExplorerUrls: ["https://arbiscan.io/"]
            }
          ]
        });
      } catch (error) {
        dispatch(
          toastWarning({
            message:
              "Please add the Arbitrum network to your wallet (e.g. via Chainlist.org) in order to switch to it.",
            title: "Network not recognised"
          })
        );
      }
    } else if (error.code === -32002) {
      dispatch(
        toastWarning({
          message:
            "Please unlock or open your wallet manually, as a previous request (e.g. account selection) is still pending.",
          title: "Your wallet is processing a previous request"
        })
      );
    } else {
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
  setNetworkName
} = web3Slice.actions;

export { checkoutBasket, connectToWeb3, fetchDaiAllowance, fetchDaiBalance };
export default web3Slice.reducer;
