import { FETCH_XEM_PRICE } from 'actions/types';

export default (state = 0, action) => {
  const { type, payload } = action;
  switch (type) {
  case FETCH_XEM_PRICE:
    return { ...state, xemPriceUsd: payload.xemPriceUsd };
  default:
    return state;
  }
};
