import {
  FETCH_INCOMING_TRANSACTIONS,
  FETCH_INCOMING_TRANSACTIONS_ERROR,
  FETCH_INCOMING_TRANSACTIONS_LOADING,
  FETCH_INCOMING_TRANSACTIONS_UPDATING
} from '../actions/types';

const initialState = {
  error: '',
  isLoading: false,
  isUpdating: false,
  incomingTxs: [],
  nemNode: '',
  paidToDate: null,
  downloadToken: null
};

export default (state = initialState, action) => {
  const { type } = action;
  switch (type) {
    case FETCH_INCOMING_TRANSACTIONS_ERROR:
      return {
        ...state,
        isLoading: action.isLoading,
        isUpdating: false,
        error: action.error
      };
    case FETCH_INCOMING_TRANSACTIONS_LOADING:
      return {
        ...state,
        isLoading: action.isLoading,
        error: action.error
      };
    case FETCH_INCOMING_TRANSACTIONS:
      return {
        ...state,
        isLoading: false,
        isUpdating: false,
        error: false,
        downloadToken: action.downloadToken,
        incomingTxs: action.payload.incomingTxs,
        nemNode: action.payload.nemNode,
        paidToDate: action.payload.paidToDate
      };
    case FETCH_INCOMING_TRANSACTIONS_UPDATING:
      return {
        ...state,
        isUpdating: action.isUpdating
      };
    default:
      return state;
  }
};
