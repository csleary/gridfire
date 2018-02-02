import { TOAST_MESSAGE } from '../actions/types';

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
    default:
      return state;
  }
};

// for now just have one message. In future add to message/alert class array once we've sorted fades.
