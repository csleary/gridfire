import { createSlice } from "@reduxjs/toolkit";

const paymentSlice = createSlice({
  name: "payment",
  initialState: {
    error: "",
    hasPurchased: false,
    isLoading: true,
    release: {},
    paymentInfo: {},
    transactions: []
  },
  reducers: {
    resetPayment(state) {
      state.error = "";
      state.hasPurchased = false;
      state.isLoading = false;
      state.release = {};
      state.paymentInfo = {};
      state.price = "";
      state.transactions = [];
    },

    setIsLoading(state, action) {
      state.isLoading = action.payload;
    },

    setPaymentError(state, action) {
      state.error = action.payload;
    },

    setPaymentReceived(state, action) {
      const { hasPurchased, transaction } = action.payload;
      state.hasPurchased = hasPurchased;
      state.transactions = [...state.transactions, transaction];
    },

    setPaymentUnconfirmed(state, action) {
      const { transaction } = action.payload;
      state.transactions = [...state.transactions, transaction];
    }
  }
});

export const { resetPayment, setPaymentError, setIsLoading, setPaymentReceived, setPaymentUnconfirmed } =
  paymentSlice.actions;

export default paymentSlice.reducer;
