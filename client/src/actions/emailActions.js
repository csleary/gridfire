import axios from 'axios';
import { TOAST_MESSAGE } from './types';

export default (values, callback) => async dispatch => {
  try {
    const res = await axios.post('/api/contact', values);

    if (res.status === 200) {
      dispatch({
        type: TOAST_MESSAGE,
        payload: {
          alertClass: 'alert-success',
          message: res.data
        }
      });
      callback();
    } else {
      dispatch({
        type: TOAST_MESSAGE,
        payload: {
          alertClass: 'alert-error',
          message: res.data
        }
      });
    }
  } catch (error) {
    dispatch({
      type: TOAST_MESSAGE,
      payload: {
        alertClass: 'alert-error',
        message: `Error! Could not send email: ${error}`
      }
    });
  }
};
