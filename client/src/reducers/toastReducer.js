import { TOAST_MESSAGE, TOAST_ERROR } from '../actions/types';

const initialState = {
  alertClass: '',
  message: ''
};

export default (state = initialState, action) => {
  const { type } = action;
  switch (type) {
    case TOAST_MESSAGE:
      return {
        ...state,
        alertClass: action.payload.alertClass,
        message: action.payload.message
      };
    case TOAST_ERROR:
      return {
        ...state,
        alertClass: 'alert-danger',
        message: action.payload.error
      };
    default:
      return state;
  }
};
