import {
  ADD_NEM_ADDRESS,
  FETCH_INCOMING_TRANSACTIONS,
  FETCH_INCOMING_TRANSACTIONS_ERROR,
  FETCH_INCOMING_TRANSACTIONS_LOADING,
  FETCH_INCOMING_TRANSACTIONS_UPDATING,
  FETCH_XEM_PRICE
} from './types';
import axios from 'axios';
import { toastError } from './index';

export const addNemAddress = values => async dispatch => {
  try {
    const res = await axios.post('/api/nem/address', values);
    dispatch({ type: ADD_NEM_ADDRESS, payload: res.data });
    return res.data;
  } catch (e) {
    toastError(e.response.data.error)(dispatch);
    return e.response.data;
  }
};

export const fetchXemPrice = () => async dispatch => {
  try {
    const res = await axios.get('/api/nem/price');
    dispatch({ type: FETCH_XEM_PRICE, payload: res.data });
  } catch (e) {
    toastError(e.response.data.error)(dispatch);
  }
};

export const fetchIncomingTxs = (
  paymentParams,
  isUpdating
) => async dispatch => {
  try {
    if (isUpdating) {
      dispatch({
        type: FETCH_INCOMING_TRANSACTIONS_UPDATING,
        isUpdating: true
      });
    } else {
      dispatch({ type: FETCH_INCOMING_TRANSACTIONS_LOADING, isLoading: true });
    }
    const res = await axios.post('/api/nem/transactions', paymentParams);
    dispatch({
      type: FETCH_INCOMING_TRANSACTIONS,
      isLoading: false,
      isUpdating: false,
      payload: res.data
    });
  } catch (e) {
    dispatch({
      type: FETCH_INCOMING_TRANSACTIONS_ERROR,
      isLoading: false,
      isUpdating: false,
      error: e.response.data.error
    });
    toastError(e.response.data.error)(dispatch);
  }
};
