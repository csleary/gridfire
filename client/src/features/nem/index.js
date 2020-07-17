import axios from 'axios';
import { createSlice } from '@reduxjs/toolkit';
import { toastError } from 'features/toast';

const nemSlice = createSlice({
  name: 'nem',
  initialState: {
    priceError: null,
    xemPriceUsd: null
  },
  reducers: {
    setXemPrice(state, action) {
      state.xemPriceUsd = action.payload.xemPriceUsd;
    },

    setPriceError(state, action) {
      state.priceError = action.payload;
    }
  }
});

const fetchXemPrice = () => async dispatch => {
  try {
    const res = await axios.get('/api/nem/price');
    if (res.error) dispatch(setPriceError(res.data.error));
    dispatch(setXemPrice(res.data));
  } catch (error) {
    dispatch(toastError(error.response.data.error));
    return { error: error.response };
  }
};

export const { setPriceError, setXemPrice } = nemSlice.actions;
export { fetchXemPrice };
export default nemSlice.reducer;
