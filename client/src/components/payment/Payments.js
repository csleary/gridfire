import React, { useEffect } from 'react';
import Download from './payments/Download';
import FontAwesome from 'react-fontawesome';
import Spinner from './../Spinner';
import Summary from './payments/Summary';
import Transactions from './payments/Transactions';
import Underpaid from './payments/Underpaid';
import styles from '../../style/Payments.module.css';

const Payments = props => {
  const {
    artistName,
    handleFetchIncomingTxs,
    hasPurchased,
    isLoadingTxs,
    isUpdating,
    nemNode,
    paidToDate,
    price,
    releaseId,
    releaseTitle,
    roundUp,
    transactions,
    transactionsError
  } = props;

  useEffect(() => {
    const updateTxs = () => {
      if (!hasPurchased) {
        handleFetchIncomingTxs(true);
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
  }, [handleFetchIncomingTxs, hasPurchased]);

  if (isLoadingTxs) {
    return (
      <Spinner>
        <h3>
          <FontAwesome name="search" className="red mr-2" />
          Searching for Payments&hellip;
        </h3>
      </Spinner>
    );
  }

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
              disabled={isUpdating}
              onClick={() => handleFetchIncomingTxs(true)}
              title={`Press to check again for recent payments (using NIS Node: ${nemNode}).`}
            >
              <FontAwesome name="refresh" className="mr-2" spin={isUpdating} />
              Refresh
            </button>
          </div>
          <Download
            artistName={artistName}
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

export default Payments;
