import { FETCH_XEM_PRICE } from '../actions/types';

export default (state = 0, action) => {
  switch (action.type) {
    case FETCH_XEM_PRICE:
      return { ...state, xemPriceUsd: action.payload };
    default:
      return state;
  }
};
