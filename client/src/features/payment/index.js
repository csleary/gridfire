import { createSlice } from '@reduxjs/toolkit';

const paymentSlice = createSlice({
  name: 'payment',
  initialState: {
    error: '',
    hasPurchased: false,
    isLoading: true,
    release: {},
    paymentInfo: {},
    priceInRawXem: null,
    transactions: []
  },
  reducers: {
    resetPayment(state) {
      state.error = '';
      state.hasPurchased = false;
      state.isLoading = false;
      state.release = {};
      state.paymentInfo = {};
      state.price = '';
      state.transactions = [];
    },

    setIsLoading(state, action) {
      state.isLoading = action.payload;
    },

    setPaymentDetails(state, action) {
      const { paymentInfo, priceInRawXem, release } = action.payload;
      state.isLoading = false;
      state.paymentInfo = paymentInfo;
      state.priceInRawXem = priceInRawXem;
      state.release = release;
    },

    setPaymentError(state, action) {
      state.error = action.payload;
    },

    setPaymentReceived(state, action) {
      const { hasPurchased, transaction } = action.payload;
      state.hasPurchased = hasPurchased;
      state.transactions = state.transactions.map(t =>
        t.meta.hash.data === transaction.meta.hash.data ? transaction : t
      );
    },

    setPaymentUnconfirmed(state, action) {
      const { transaction } = action.payload;
      state.transactions = [...state.transactions, transaction];
    }
  }
});

export const {
  resetPayment,
  setPaymentError,
  setIsLoading,
  setPaymentDetails,
  setPaymentReceived,
  setPaymentUnconfirmed
} = paymentSlice.actions;

export default paymentSlice.reducer;
