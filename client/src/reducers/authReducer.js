import { ADD_NEM_ADDRESS, FETCH_USER } from '../actions/types';

const initialState = {
  isLoading: true,
  isLoggedIn: false,
  nemAddress: ''
};

export default (state = initialState, action) => {
  switch (action.type) {
    case ADD_NEM_ADDRESS:
      return { ...state, ...action.payload.nemAddress };
    case FETCH_USER:
      return {
        ...state,
        isLoading: action.isLoading,
        isLoggedIn: state.isLoggedIn || action.isLoggedIn,
        ...action.payload
      };
    default:
      return state;
  }
};
