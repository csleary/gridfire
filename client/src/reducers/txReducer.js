import {
  FETCH_INCOMING_TRANSACTIONS,
  FETCH_INCOMING_TRANSACTIONS_LOADING,
  FETCH_INCOMING_TRANSACTIONS_UPDATING
} from '../actions/types';

const initialState = {
  isLoading: false,
  isUpdating: false,
  incomingTxs: [],
  nemNode: '',
  paidToDate: 0,
  downloadToken: null
};

export default (state = initialState, action) => {
  switch (action.type) {
    case FETCH_INCOMING_TRANSACTIONS_LOADING:
      return {
        ...state,
        isLoading: true
      };
    case FETCH_INCOMING_TRANSACTIONS_UPDATING:
      return {
        ...state,
        isUpdating: true
      };
    case FETCH_INCOMING_TRANSACTIONS:
      return {
        ...state,
        isLoading: false,
        isUpdating: false,
        downloadToken: action.downloadToken,
        incomingTxs: action.payload.incomingTxs,
        nemNode: action.payload.nemNode,
        paidToDate: action.payload.paidToDate
      };
    default:
      return state;
  }
};
