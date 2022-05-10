import { createSlice } from "@reduxjs/toolkit";
import { getDaiAllowance } from "web3/contract";
import { utils } from "ethers";

const web3Slice = createSlice({
  name: "web3",
  initialState: {
    account: "",
    accountShort: "",
    chainId: "",
    daiAllowance: utils.parseEther("0"),
    isConnected: false,
    isFetchingAllowance: false,
    networkName: ""
  },
  reducers: {
    setAccount(state, action) {
      const account = action.payload;
      state.account = account;
      state.accountShort = `${account.slice(0, 6)}…${account.slice(-4)}`;
    },

    setDaiAllowance(state, action) {
      state.daiAllowance = action.payload;
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

export const { setAccount, setDaiAllowance, setIsConnected, setIsFetchingAllowance, setNetworkName } =
  web3Slice.actions;

export { fetchDaiAllowance };
export default web3Slice.reducer;
