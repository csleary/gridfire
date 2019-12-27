import React, { useEffect, useMemo } from 'react';
import DownloadButton from './downloadButton';
import FontAwesome from 'react-fontawesome';
import PropTypes from 'prop-types';
import Spinner from 'components/spinner';
import Summary from './summary';
import Transactions from './transactions';
import Underpaid from './underPaid';
import { connect } from 'react-redux';
import styles from './payments.module.css';
import { toastError } from 'actions';
import { useApi } from 'hooks/useApi';
import withDownload from './withDownload';

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

  const { data, error, fetch, isFetching, isLoading } = useApi(
    '/api/nem/transactions',
    'post',
    paymentData
  );

  if (error) {
    props.toastError(error);
  }

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
  }, [data, fetch, paymentData]);

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

  const formattedNodeName = nemNode.replace(/\[([^[\]]*)\]/gi, '');

  return (
    <>
      <div className="row">
        <div className="col">
          <h3 className="text-center">Payments</h3>
        </div>
      </div>
      <div className={`${styles.transactions} row`}>
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
              title={`Press to check again for recent payments (last used NIS Node: '${formattedNodeName}').`}
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
  hasPurchased: PropTypes.bool,
  nemNode: PropTypes.string,
  paidToDate: PropTypes.number,
  paymentHash: PropTypes.string,
  price: PropTypes.string,
  releaseId: PropTypes.string,
  releaseTitle: PropTypes.string,
  roundUp: PropTypes.func,
  toastError: PropTypes.func,
  transactions: PropTypes.array,
  transactionsError: PropTypes.object
};

export default connect(null, { toastError })(Payments);
