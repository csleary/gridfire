import { createSlice } from '@reduxjs/toolkit';

const web3Slice = createSlice({
  name: 'web3',
  initialState: {
    account: '',
    chainId: '',
    isConnected: false,
    networkName: ''
  },
  reducers: {
    setAccount(state, action) {
      const account = action.payload;
      state.account = account;
      state.isConnected = account ? true : false;
    },

    setIsConnected(state, action) {
      state.isConnected = action.payload;
    },

    setNetworkName(state, action) {
      state.networkName = action.payload.networkName;
      state.chainId = action.payload.chainId;
    }
  }
});

export const { setAccount, setIsConnected, setNetworkName } = web3Slice.actions;
export default web3Slice.reducer;
