import {
  TOAST_ERROR,
  TOAST_INFO,
  TOAST_SUCCESS,
  TOAST_WARNING
} from '../actions/types';

const initialState = [{ key: '', message: '', type: '' }];

export default (state = initialState, action) => {
  const { key, message, type } = action;
  switch (type) {
  case TOAST_ERROR:
    return [{ key, message, type: 'error' }, ...state];
  case TOAST_INFO:
    return [{ key, message, type: 'info' }, ...state];
  case TOAST_SUCCESS:
    return [{ key, message, type: 'success' }, ...state];
  case TOAST_WARNING:
    return [{ key, message, type: 'warning' }, ...state];
  default:
    return state;
  }
};
