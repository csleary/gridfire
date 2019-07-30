import React, { useCallback, useEffect, useReducer } from 'react';
import { Link } from 'react-router-dom';
import PaymentMethods from './payment/PaymentMethods';
import Payments from './payment/Payments';
import Spinner from './Spinner';
import axios from 'axios';
import { connect } from 'react-redux';
import { toastError } from '../actions';

const initialState = {
  artist: '',
  artistName: '',
  error: false,
  fetchedRelease: false,
  hasPurchased: false,
  isLoading: true,
  isLoadingTxs: false,
  isUpdating: false,
  nemNode: '',
  paidToDate: null,
  paymentAddress: '',
  paymentHash: '',
  priceInXem: '',
  releaseTitle: '',
  transactions: []
};

const reducer = (state, action) => {
  const { payload } = action;
  switch (action.type) {
  case 'setLoading':
    return { ...state, isLoading: action.value };
  case 'purchaseRelease':
    return {
      ...state,
      artist: payload.release.artist,
      artistName: payload.release.artistName,
      isLoading: false,
      fetchedRelease: true,
      paymentAddress: payload.paymentInfo.paymentAddress,
      paymentHash: payload.paymentInfo.paymentHash,
      priceInXem: payload.price,
      releaseTitle: payload.release.releaseTitle
    };
  case 'transactions':
    return {
      ...state,
      isLoadingTxs: false,
      isUpdating: false,
      error: false,
      hasPurchased: payload.hasPurchased,
      transactions: payload.transactions,
      nemNode: payload.nemNode,
      paidToDate: payload.paidToDate
    };
  case 'transactionsError':
    return {
      ...state,
      isLoadingTxs: false,
      isUpdating: false,
      error: action.error
    };
  case 'transactionsLoading':
    return { ...state, isLoadingTxs: true };
  case 'updating':
    return { ...state, isUpdating: true };
  default:
    return state;
  }
};

const Payment = props => {
  const { releaseId } = props.match.params;
  const [state, dispatch] = useReducer(reducer, initialState);

  const {
    artist,
    artistName,
    fetchedRelease,
    transactions,
    isLoading,
    isLoadingTxs,
    isUpdating,
    hasPurchased,
    nemNode,
    paidToDate,
    paymentAddress,
    paymentHash,
    releaseTitle,
    transactionsError
  } = state;

  const fetchTransactions = async (paymentParams, isUpdating) => {
    try {
      if (isUpdating) {
        dispatch({ type: 'updating' });
      } else {
        dispatch({ type: 'transactionsLoading', value: true });
      }
      const res = await axios.post('/api/nem/transactions', paymentParams);
      dispatch({ type: 'transactions', payload: res.data });
    } catch (e) {
      dispatch({ type: 'transactionsError', error: e.response.data.error });
      toastError(e.response.data.error);
    }
  };

  const handleFetchIncomingTxs = useCallback(
    (isUpdating = false) => {
      fetchTransactions({ releaseId, paymentHash }, isUpdating);
    },
    [paymentHash, releaseId]
  );

  useEffect(() => {
    dispatch({ type: 'setLoading', value: true });
    axios
      .get(`/api/purchase/${releaseId}`)
      .then(res => {
        dispatch({ type: 'purchaseRelease', payload: res.data });
      })
      .catch(e => {
        dispatch({ type: 'setLoading', value: false });
        toastError(e.response.data.error);
      });
  }, [releaseId]);

  useEffect(() => {
    if (fetchedRelease) {
      if (!paymentAddress) return;
      handleFetchIncomingTxs();
    }
  }, [fetchedRelease, handleFetchIncomingTxs, paymentAddress]);

  const roundUp = (value, precision) => {
    const factor = 10 ** precision;
    return Math.ceil(value * factor) / factor;
  };

  const priceInXem = roundUp(state.priceInXem, 2).toFixed(2);

  if (isLoading) {
    return (
      <Spinner>
        <h2 className="mt-4">Loading Payment Info&hellip;</h2>
      </Spinner>
    );
  }

  if (!paymentAddress) {
    return (
      <main className="container">
        <div className="row">
          <div className="col">
            <h2 className="text-center">Payment</h2>
            <h3 className="text-center red">
              {artistName} &bull;{' '}
              <span className="ibm-type-italic">{releaseTitle}</span>
            </h3>
            <p className="text-center">
              Unfortunately, <Link to={`/artist/${artist}`}>{artistName}</Link>{' '}
              doesn&rsquo;t have a NEM payment address in their account, so we
              are unable to process payments for them at the moment.
            </p>
            <p className="text-center">
              Hopefully they&rsquo;ll have an address in place soon!
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container">
      <div className="row">
        <div className="col p-3">
          <h2 className="text-center mt-4">Payment</h2>
          <h3 className="text-center red">
            {artistName} &bull;{' '}
            <span className="ibm-type-italic">{releaseTitle}</span>
          </h3>
          <PaymentMethods
            paymentAddress={paymentAddress}
            paymentHash={paymentHash}
            priceInXem={priceInXem}
          />
        </div>
      </div>
      <Payments
        artistName={artistName}
        handleFetchIncomingTxs={handleFetchIncomingTxs}
        hasPurchased={hasPurchased}
        isLoadingTxs={isLoadingTxs}
        isUpdating={isUpdating}
        nemNode={nemNode}
        paidToDate={paidToDate}
        price={priceInXem}
        releaseId={releaseId}
        releaseTitle={releaseTitle}
        roundUp={roundUp}
        transactions={transactions}
        transactionsError={transactionsError}
      />
    </main>
  );
};

export default connect(
  null,
  { toastError }
)(Payment);
