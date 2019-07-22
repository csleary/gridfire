import { toastError, toastSuccess } from './index';
import axios from 'axios';

export default (values, callback) => async dispatch => {
  try {
    const res = await axios.post('/api/contact', values);
    toastSuccess(res.data.success)(dispatch);
    callback();
  } catch (e) {
    toastError(e.response.data.error)(dispatch);
  }
};
