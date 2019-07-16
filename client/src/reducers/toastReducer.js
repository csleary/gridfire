import {
  TOAST_ERROR,
  TOAST_HIDE,
  TOAST_INFO,
  TOAST_SUCCESS,
  TOAST_WARNING
} from '../actions/types';

const initialState = [];

export default (state = initialState, action) => {
  switch (action.type) {
  case TOAST_HIDE:
    return state.map(toast => {
      if (toast.key !== action.key) return toast;
      return { ...toast, visible: false };
    });
  case TOAST_ERROR:
    return [...state, { ...action, type: 'error', visible: true }];
  case TOAST_INFO:
    return [...state, { ...action, type: 'info', visible: true }];
  case TOAST_SUCCESS:
    return [...state, { ...action, type: 'success', visible: true }];
  case TOAST_WARNING:
    return [...state, { ...action, type: 'warning', visible: true }];
  default:
    return state;
  }
};
