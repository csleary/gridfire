import axios from 'axios';
import { TOAST_ERROR, TOAST_SUCCESS } from './types';

export default (values, callback) => async dispatch => {
  try {
    const res = await axios.post('/api/contact', values);
    dispatch({ type: TOAST_SUCCESS, text: res.data.success });
    callback();
  } catch (e) {
    dispatch({ type: TOAST_ERROR, text: e.response.data.error });
  }
};
