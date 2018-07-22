import { ADD_NEM_ADDRESS, FETCH_USER } from '../actions/types';

const initialState = {
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
    default:
      return state;
  }
};
