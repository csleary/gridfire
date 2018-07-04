import React, { Fragment } from 'react';
import FontAwesome from 'react-fontawesome';
import nem from 'nem-sdk';
import SingleTransaction from './SingleTransaction';
import Spinner from './../Spinner';
import '../../style/transactionsList.css';

const TransactionsList = props => {
  const {
    artistName,
    downloadToken,
    handleFetchIncomingTxs,
    isLoadingTxs,
    isUpdating,
    nemNode,
    paidToDate,
    price,
    releaseTitle,
    roundUp,
    toastMessage,
    transactions
  } = props;

  const downloadButton = downloadToken && (
    <Fragment>
      <h3 className="text-center">Thank you!</h3>
      <div className="d-flex justify-content-center">
        <button
          className="btn btn-outline-primary btn-lg download-button"
          download
          onClick={() => {
            toastMessage({
              alertClass: 'alert-info',
              message: `Fetching download: ${artistName} - '${releaseTitle}'`
            });
            window.location = `/api/download/${downloadToken}`;
          }}
        >
          <FontAwesome name="download" className="icon-left" />
          Download <span className="ibm-type-italic">{releaseTitle}</span>
        </button>
      </div>
    </Fragment>
  );

  const txList = transactions.map(tx => (
    <SingleTransaction
      key={tx.meta.hash.data}
      hash={tx.meta.hash.data}
      amount={tx.transaction.amount / 10 ** 6}
      date={nem.utils.format.nemDate(tx.transaction.timeStamp)}
    />
  ));

  const underpaid = () => {
    const delta = price - paidToDate;

    if (paidToDate > 0 && paidToDate < price && !downloadToken) {
      return (
        <p>
          Please pay a futher{' '}
          <span className="bold red">{roundUp(delta, 2).toFixed(2)} XEM</span>{' '}
          to activate your download, then tap the refresh button below to check
          for confirmed payments.
        </p>
      );
    }
  };

  const transactionsPreamble = !transactions.length ? (
    <p>
      No transactions found just yet. Please hit the refresh button below to
      check again for confirmed payments.
    </p>
  ) : (
    <p>
      Paid to date:{' '}
      <span className="bold red">{paidToDate.toFixed(2)} XEM</span>
    </p>
  );

  const confirmedTransactions = transactions.length > 0 && (
    <div>
      <h5>
        {transactions.length} Confirmed Transaction{transactions.length > 1 &&
          's'}:
      </h5>
      <ol className="list-group tx-list">{txList}</ol>
    </div>
  );

  if (isLoadingTxs) {
    return (
      <Spinner>
        <h3 className="transactions-searching">
          <FontAwesome name="search" className="icon-left" />
          Searching for Transactions&hellip;
        </h3>
      </Spinner>
    );
  }

  return (
    <div className="transactions">
      <h3 className="text-center">Transactions</h3>
      <p>
        <FontAwesome name="server" className="icon-left red" />
        Connected to NIS Node: <strong>{nemNode}</strong>
      </p>
      {transactionsPreamble}
      {underpaid()}
      <button
        className="btn btn-outline-primary btn-sm refresh-txs"
        disabled={isUpdating}
        onClick={() => handleFetchIncomingTxs(true)}
      >
        <FontAwesome name="refresh" className="icon-left" spin={isUpdating} />
        Refresh
      </button>
      {downloadButton}
      {confirmedTransactions}
    </div>
  );
};

export default TransactionsList;
