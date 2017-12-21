import React from 'react';
import FontAwesome from 'react-fontawesome';
import nem from 'nem-sdk';
import SingleTransaction from './SingleTransaction';
import Spinner from './Spinner';
import '../style/transactionsList.css';

const TransactionsList = (props) => {
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
          Download Release{' '}
          <FontAwesome name="download" className="button-icon" />
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

  const transactionsPreamble = !props.transactions.length ? (
    <p>No transactions found just yet&hellip;</p>
  ) : (
    <div>
      <p>
        Paid to date: <strong>{props.paidToDate} XEM</strong>.
      </p>
    </div>
  );

  // const UnconfirmedtxList = props.unconfirmed.map(tx => (
  //   <SingleTransaction
  //     key={tx.meta.hash.data}
  //     hash={tx.meta.hash.data}
  //     amount={tx.transaction.amount * (10 ** -6)}
  //     date={nem.utils.format.nemDate(tx.transaction.timeStamp)}
  //   />
  // ));

  // const unconfirmedTransactions = props.unconfirmed.length !== 0 && (
  //   <div>
  //     <h5>
  //       Unconfirmed Transactions:
  //     </h5>
  //     <ol className="list-group tx-list">
  //       {UnconfirmedtxList}
  //     </ol>
  //   </div>
  // );

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
      <h3 className="text-center">
        <FontAwesome name="cog" spin className="icon-left" />
        Listening for Transactions
      </h3>
      <p>
        <FontAwesome name="server" className="icon-left" />
        Connected to node: <strong>{props.nemNode}</strong>
      </p>
      {transactionsPreamble}
      {downloadButton}
      {/* {unconfirmedTransactions} */}
      {confirmedTransactions}
    </div>
  );
};

export default TransactionsList;
