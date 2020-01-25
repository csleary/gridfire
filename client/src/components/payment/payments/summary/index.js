import FontAwesome from 'react-fontawesome';
import PropTypes from 'prop-types';
import React from 'react';
import Underpaid from './underPaid';
import styles from './summary.module.css';

const Summary = ({
  fetch,
  hasPurchased,
  isFetching,
  nemNode,
  paymentData,
  paidToDate,
  price,
  roundUp,
  transactions
}) => {
  const formattedNodeName = nemNode.replace(/\[([^[\]]*)\]/gi, '');

  if (!transactions.length) {
    return (
      <p className={styles.info}>
        No transactions found just yet. Please hit the refresh button to check
        again for confirmed payments (we&rsquo;ll automatically check every
        thirty seconds).
      </p>
    );
  }

  return (
    <button
      className={`${styles.summary}`}
      disabled={isFetching}
      onClick={() => {
        fetch('/api/nem/transactions', 'post', paymentData);
      }}
      title={`Press to check again for recent payments (last used NIS Node: '${formattedNodeName}').`}
    >
      <div className={styles.refresh}>
        <p className={styles.paid}>Paid to date: {paidToDate.toFixed(2)} XEM</p>{' '}
        <FontAwesome name="refresh" className="ml-2" spin={isFetching} />
      </div>
      <Underpaid
        hasPurchased={hasPurchased}
        paidToDate={paidToDate}
        price={price}
        roundUp={roundUp}
      />
      <div className={`${styles.node}`} title="Last used NIS Node">
        <FontAwesome name="server" className="mr-2" />
        Node: {formattedNodeName}
      </div>
    </button>
  );
};

Summary.propTypes = {
  fetch: PropTypes.func,
  hasPurchased: PropTypes.bool,
  isFetching: PropTypes.bool,
  nemNode: PropTypes.string,
  paidToDate: PropTypes.number,
  paymentData: PropTypes.object,
  price: PropTypes.string,
  roundUp: PropTypes.func,
  transactions: PropTypes.array
};

export default Summary;
