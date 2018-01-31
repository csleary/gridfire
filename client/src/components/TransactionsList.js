import React from 'react';
import FontAwesome from 'react-fontawesome';
import nem from 'nem-sdk';
import SingleTransaction from './SingleTransaction';
import Spinner from './Spinner';
import '../style/transactionsList.css';

const TransactionsList = props => {
  const downloadButton = props.downloadToken && (
    <div>
      <h3 className="text-center">Thank you!</h3>
      <div className="d-flex justify-content-center">
        <button
          className="btn btn-outline-success btn-lg download-button"
          download
          onClick={() => {
            window.location = `/api/download/${props.downloadToken}`;
          }}
        >
          <FontAwesome name="download" className="icon-left" />
          Download{' '}
          <span className="ibm-type-italic">{props.release.releaseTitle}</span>
        </button>
      </div>
    </div>
  );

  const txList = props.transactions.map(tx => (
    <SingleTransaction
      key={tx.meta.hash.data}
      hash={tx.meta.hash.data}
      amount={tx.transaction.amount * 10 ** -6}
      date={nem.utils.format.nemDate(tx.transaction.timeStamp)}
    />
  ));

  const underpaid = () => {
    const delta = props.release.price - props.paidToDate;
    const roundUp = precision => {
      const factor = 10 ** precision;
      return Math.ceil(delta * factor) / factor;
    };

    return (
      <p>
        Please pay a futher <span className="bold-red">{roundUp(2)} XEM</span>{' '}
        to activate your download, then tap the refresh button below to check
        for confirmed payments.
      </p>
    );
  };

  const transactionsPreamble = !props.transactions.length ? (
    <p>
      No transactions found just yet. Please hit the refresh button below to
      check again for confirmed payments.
    </p>
  ) : (
    <p>
      Paid to date: <span className="bold-red">{props.paidToDate} XEM</span>
    </p>
  );

  const confirmedTransactions = props.transactions.length > 0 && (
    <div>
      <h5>
        {props.transactions.length} Confirmed Transaction{props.transactions
          .length > 1 && 's'}:
      </h5>
      <ol className="list-group tx-list">{txList}</ol>
    </div>
  );

  if (props.isLoadingTxs) {
    return (
      <Spinner
        message={
          <h3 className="transactions-searching">
            <FontAwesome name="search" className="icon-left" />
            Searching for Transactions&hellip;
          </h3>
        }
      />
    );
  }
  return (
    <div className="transactions">
      <h3 className="text-center">Transactions</h3>
      <p>
        <FontAwesome name="server" className="icon-left" />
        Connected to NIS Node: <strong>{props.nemNode}</strong>
      </p>
      {transactionsPreamble}
      {props.paidToDate > 0 &&
        !props.downloadToken &&
        props.paidToDate < props.price &&
        underpaid()}
      <button
        className="btn btn-outline-primary btn-sm refresh-txs"
        disabled={props.isUpdating}
        onClick={() => props.updateIncomingTxs(props.paymentParams)}
      >
        <FontAwesome
          name="refresh"
          className="icon-left"
          spin={props.isUpdating}
        />
        Refresh
      </button>
      {downloadButton}
      {confirmedTransactions}
    </div>
  );
};

export default TransactionsList;
