import React, { useEffect, useMemo } from 'react';
import DownloadButton from './payments/DownloadButton';
import FontAwesome from 'react-fontawesome';
import PropTypes from 'prop-types';
import Spinner from 'components/Spinner';
import Summary from './payments/Summary';
import Transactions from './payments/Transactions';
import Underpaid from './payments/Underpaid';
import styles from 'style/Payments.module.css';
import { useApi } from 'hooks/useApi';
import withDownload from './payments/withDownload';

const Download = withDownload(DownloadButton);

const Payments = props => {
  const {
    artistName,
    paymentHash,
    price,
    releaseId,
    releaseTitle,
    roundUp
  } = props;

  const paymentData = useMemo(
    () => ({
      releaseId,
      paymentHash
    }),
    [releaseId, paymentHash]
  );

  const { data, fetch, isFetching, isLoading } = useApi(
    '/api/nem/transactions',
    'post',
    paymentData
  );

  useEffect(() => {
    const updateTxs = () => {
      if (data && !data.hasPurchased) {
        fetch('/api/nem/transactions', 'post', paymentData);
      } else {
        window.clearInterval(txInterval);
        clearTimeout(txTimeout);
      }
    };

    const txInterval = window.setInterval(updateTxs, 30000);
    const txTimeout = setTimeout(txInterval, 30000);

    return () => {
      window.clearInterval(txInterval);
      clearTimeout(txTimeout);
    };
  }, [data, fetch]);

  if (isLoading) {
    return (
      <Spinner>
        <h3>
          <FontAwesome name="search" className="red mr-2" />
          Searching for Payments&hellip;
        </h3>
      </Spinner>
    );
  }

  const {
    hasPurchased,
    nemNode,
    paidToDate,
    transactions,
    transactionsError
  } = data;

  return (
    <>
      <div className="row">
        <div className="col">
          <h3 className="text-center">Payments</h3>
        </div>
      </div>
      <div className={`${styles.transactions} row justify-content-center mb-5`}>
        <div className={`${styles.segment} col-md-6 p-4`}>
          <Summary paidToDate={paidToDate} transactions={transactions} />
          <Underpaid
            hasPurchased={hasPurchased}
            paidToDate={paidToDate}
            price={price}
            roundUp={roundUp}
          />
          <div className="d-flex justify-content-center">
            <button
              className={`${styles.refresh} btn btn-outline-primary btn-sm py-2 px-3`}
              disabled={isFetching}
              onClick={() => {
                fetch('/api/nem/transactions', 'post', paymentData);
              }}
              title={`Press to check again for recent payments (using NIS Node: ${nemNode}).`}
            >
              {' '}
              <FontAwesome name="refresh" className="mr-2" spin={isFetching} />
              Refresh
            </button>
          </div>
          <Download
            artistName={artistName}
            format="mp3"
            hasPurchased={hasPurchased}
            releaseId={releaseId}
            releaseTitle={releaseTitle}
          />
        </div>
      </div>
      <Transactions
        transactions={transactions}
        transactionsError={transactionsError}
      />
    </>
  );
};

Payments.propTypes = {
  artistName: PropTypes.string,
  handleFetchUpdate: PropTypes.func,
  hasPurchased: PropTypes.bool,
  isLoadingTxs: PropTypes.bool,
  isUpdating: PropTypes.bool,
  nemNode: PropTypes.string,
  paidToDate: PropTypes.number,
  paymentHash: PropTypes.string,
  price: PropTypes.string,
  releaseId: PropTypes.string,
  releaseTitle: PropTypes.string,
  roundUp: PropTypes.func,
  source: PropTypes.object,
  transactions: PropTypes.array,
  transactionsError: PropTypes.object
};

export default Payments;
