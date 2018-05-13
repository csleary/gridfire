import axios from 'axios';
import {
  ADD_NEM_ADDRESS,
  FETCH_INCOMING_TRANSACTIONS,
  FETCH_INCOMING_TRANSACTIONS_LOADING,
  FETCH_INCOMING_TRANSACTIONS_UPDATING,
  FETCH_XEM_PRICE
} from './types';

export const addNemAddress = values => async dispatch => {
  const res = await axios.post('/api/nem/address', values);
  dispatch({ type: ADD_NEM_ADDRESS, payload: res.data });
};

export const fetchXemPrice = () => async dispatch => {
  try {
    const res = await axios.get('/api/nem/price');
    dispatch({ type: FETCH_XEM_PRICE, payload: res.data });
  } catch (error) {
    throw new Error(
      `We could not fetch the current XEM price. (${error.message})`
    );
  }
};

export const fetchIncomingTxs = (
  paymentParams,
  isUpdating
) => async dispatch => {
  if (isUpdating) {
    dispatch({ type: FETCH_INCOMING_TRANSACTIONS_UPDATING });
  } else {
    dispatch({ type: FETCH_INCOMING_TRANSACTIONS_LOADING });
  }
  const res = await axios.post('/api/nem/transactions', paymentParams);
  dispatch({
    type: FETCH_INCOMING_TRANSACTIONS,
    isLoading: false,
    isUpdating: false,
    payload: res.data,
    downloadToken: res.headers.authorization
  });
};
