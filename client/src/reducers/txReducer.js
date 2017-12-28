import {
  FETCH_INCOMING_TRANSACTIONS,
  FETCH_INCOMING_TRANSACTIONS_LOADING,
  UPDATE_TRANSACTIONS,
  UPDATE_TRANSACTIONS_LOADING
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
    case UPDATE_TRANSACTIONS_LOADING:
      return {
        ...state,
        isUpdating: true
      };
    case FETCH_INCOMING_TRANSACTIONS:
      return {
        downloadToken: action.downloadToken,
        isLoading: action.isLoading,
        incomingTxs: action.payload.incomingTxs,
        nemNode: action.payload.nemNode,
        paidToDate: action.payload.paidToDate
      };
    case UPDATE_TRANSACTIONS:
      return {
        downloadToken: action.downloadToken,
        isUpdating: action.isLoading,
        incomingTxs: action.payload.incomingTxs,
        nemNode: action.payload.nemNode,
        paidToDate: action.payload.paidToDate
      };
    default:
      return state;
  }
};
