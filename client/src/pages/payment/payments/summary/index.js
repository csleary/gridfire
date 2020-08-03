import FontAwesome from 'react-fontawesome';
import PropTypes from 'prop-types';
import React from 'react';
import Underpaid from './underPaid';
import classnames from 'classnames';
import styles from './summary.module.css';

const Summary = ({ fetch, isFetching, paymentData, payments, price }) => {
  const { hasPurchased, nemNode, paidToDate, transactions } = payments;
  const formattedNodeName = nemNode.replace(/\[([^[\]]*)\]/gi, '');

  if (hasPurchased) return null;

  const iconClassNames = classnames(styles.icon, { [styles.active]: isFetching });

  return (
    <button
      className={styles.summary}
      disabled={isFetching}
      onClick={() => {
        fetch('/api/user/transactions', 'post', paymentData);
      }}
      title={`Press to check again for recent payments (last used NIS Node: '${formattedNodeName}').`}
    >
      {!transactions.length ? (
        <div>No transactions found. Check again?</div>
      ) : (
        <div className={styles.info}>
          <div>Paid</div>
          <div className={styles.paid}>{paidToDate} XEM</div>
        </div>
      )}
      <Underpaid payments={payments} price={price} />
      <div className={styles.refresh}>
        <div className={styles.button}>
          <FontAwesome name="circle" className={iconClassNames} />
          {isFetching ? 'Scanning…' : 'Scan'}
        </div>
        <div className={styles.node} title="Last used NIS Node">
          <FontAwesome name="server" className="mr-2" /> {formattedNodeName}
        </div>
      </div>
    </button>
  );
};

Summary.propTypes = {
  fetch: PropTypes.func,
  isFetching: PropTypes.bool,
  paymentData: PropTypes.object,
  payments: PropTypes.object,
  price: PropTypes.string
};

export default Summary;
