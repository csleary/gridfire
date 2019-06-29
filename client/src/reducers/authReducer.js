import {
  ADD_NEM_ADDRESS,
  FETCH_USER,
  FETCH_USER_CREDIT
} from '../actions/types';

const initialState = {
  credit: 0,
  isLoading: true,
  nemAddress: ''
};

export default (state = initialState, action) => {
  const { type, payload } = action;
  switch (type) {
    case ADD_NEM_ADDRESS:
      return { ...state, ...payload };
    case FETCH_USER:
      return {
        ...state,
        isLoading: action.isLoading,
        ...payload
      };
    case FETCH_USER_CREDIT:
      return { ...state, credit: payload };
    default:
      return state;
  }
};
