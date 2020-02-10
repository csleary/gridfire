import { FETCH_XEM_PRICE } from './types';
import axios from 'axios';
import { toastError } from './index';

export const fetchXemPrice = () => async dispatch => {
  try {
    const res = await axios.get('/api/nem/price');
    dispatch({ type: FETCH_XEM_PRICE, payload: res.data });
    return res;
  } catch (e) {
    toastError(e.response.data.error)(dispatch);
    return { error: e.response };
  }
};
