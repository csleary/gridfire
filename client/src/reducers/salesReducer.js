import { FETCH_SALES } from '../actions/types';

const initialState = {
  releaseSales: []
};

export default (state = initialState, action) => {
  const { type, payload } = action;
  switch (type) {
  case FETCH_SALES:
    return {
      ...state,
      releaseSales: [
        ...state.releaseSales,
        ...payload.filter(fetched => {
          if (
            state.releaseSales.some(release => release._id === fetched._id)
          ) {
            return false;
          }
          return true;
        })
      ]
    };
  default:
    return state;
  }
};
