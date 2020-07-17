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

  return (
    <button
      className={`${styles.summary}`}
      disabled={isFetching}
      onClick={() => {
        fetch('/api/user/transactions', 'post', paymentData);
      }}
      title={`Press to check again for recent payments (last used NIS Node: '${formattedNodeName}').`}
    >
      <div className={styles.refresh}>
        {!transactions.length ? (
          <>No transactions found. Check again?</>
        ) : (
          <>Paid to date: {paidToDate.toFixed(2)} XEM</>
        )}
        <FontAwesome name="refresh" className="ml-2" spin={isFetching} />
      </div>
      <Underpaid hasPurchased={hasPurchased} paidToDate={paidToDate} price={price} roundUp={roundUp} />
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
