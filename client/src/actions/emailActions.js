import axios from 'axios';
import { TOAST_MESSAGE, TOAST_ERROR } from './types';

export default (values, callback) => async dispatch => {
  try {
    const res = await axios.post('/api/contact', values);
    dispatch({
      type: TOAST_MESSAGE,
      payload: {
        alertClass: 'alert-success',
        message: res.data.message
      }
    });
    callback();
  } catch (e) {
    dispatch({ type: TOAST_ERROR, payload: e.response.data });
  }
};
