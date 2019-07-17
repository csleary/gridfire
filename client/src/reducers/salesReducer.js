import { FETCH_SALES } from '../actions/types';

const initialState = [];

export default (state = initialState, action) => {
  const { type, payload } = action;
  switch (type) {
  case FETCH_SALES:
    return [
      ...state,
      ...payload.filter(fetched =>
        state.some(release => release._id !== fetched._id)
      )
    ];
  default:
    return state;
  }
};
