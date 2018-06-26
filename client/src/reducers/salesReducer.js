import { FETCH_SALES } from '../actions/types';

const initialState = {
  releaseSales: null
};

export default (state = initialState, action) => {
  const { type, payload } = action;
  switch (type) {
    case FETCH_SALES:
      return {
        ...state,
        releaseSales: payload
      };
    default:
      return state;
  }
};
