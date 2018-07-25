import {
  TOAST_ERROR,
  TOAST_INFO,
  TOAST_SUCCESS,
  TOAST_WARNING
} from '../actions/types';

const initialState = {
  text: '',
  type: ''
};

export default (state = initialState, action) => {
  const { type, text } = action;
  switch (type) {
    case TOAST_ERROR:
      return {
        ...state,
        type: 'error',
        text
      };
    case TOAST_INFO:
      return {
        ...state,
        type: 'info',
        text
      };
    case TOAST_SUCCESS:
      return {
        ...state,
        type: 'success',
        text
      };
    case TOAST_WARNING:
      return {
        ...state,
        type: 'warning',
        text
      };
    default:
      return state;
  }
};
