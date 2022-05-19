import { getDaiAllowance, gridFireCheckout } from "web3/contract";
import { createSlice } from "@reduxjs/toolkit";
import { fetchUser } from "state/user";
import { toastSuccess } from "state/toast";
import { BigNumber, constants, utils } from "ethers";
import axios from "axios";
import { batch } from "react-redux";

const web3Slice = createSlice({
  name: "web3",
  initialState: {
    account: "",
    accountShort: "",
    basket: [],
    chainId: "",
    error: "",
    daiAllowance: utils.parseEther("0"),
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
      state.networkName = action.payload.networkName;
      state.chainId = action.payload.chainId;
    }
  }
});

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

const checkoutBasket =
  (basket = []) =>
  async dispatch => {
    try {
      batch(() => {
        dispatch(setError(""));
        dispatch(setIsCheckingOut(true));
      });

      const total = basket.reduce((prev, curr) => prev.add(curr.price), BigNumber.from("0"));

      // Only do contract checkout if there's something to pay.
      let transactionHash;
      if (total.gt(constants.Zero)) {
        transactionHash = await gridFireCheckout(basket);
      }

      // Backend purchase validation.
      await axios.post(`/api/release/purchase`, { basket, ...(transactionHash ? { transactionHash } : {}) });
      dispatch(fetchUser());
      dispatch(toastSuccess({ message: "Purchased!", title: "Success" }));
    } catch (error) {
      dispatch(setError(error));
      throw error;
    } finally {
      dispatch(setIsCheckingOut(false));
    }
  };

export const {
  addToBasket,
  emptyBasket,
  removeFromBasket,
  setAccount,
  setDaiAllowance,
  setError,
  setIsAddingToBasket,
  setIsCheckingOut,
  setIsConnected,
  setIsFetchingAllowance,
  setNetworkName
} = web3Slice.actions;

export { checkoutBasket, fetchDaiAllowance };
export default web3Slice.reducer;
