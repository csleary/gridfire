import { faBomb, faListOl } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import PropTypes from 'prop-types';
import React from 'react';
import Transaction from './transaction';
// import nem from 'nem-sdk';
import styles from './transactions.module.css';

const Transactions = ({ error, transactions }) => {
  if (error) {
    return (
      <div className={styles.root}>
        <div className="alert alert-danger text-center" role="alert">
          <FontAwesomeIcon icon={faBomb} className="mr-2" />
          We encountered an error processing your payment. {error}
        </div>
      </div>
    );
  }

  if (transactions.length) {
    return (
      <div className={styles.root}>
        <h5 className={styles.heading}>
          <FontAwesomeIcon icon={faListOl} className="yellow mr-3" />
          {transactions.length} transaction{transactions.length > 1 ? 's' : null}:
        </h5>
        <div className={styles.grid}>
          <div className={styles.index}>#</div>
          <div>Payment Date</div>
          <div className={styles.amount}>Amount</div>
          {transactions.map(({ meta, transaction }, index) => (
            <Transaction
              amount={(transaction.amount / 10 ** 6).toFixed(6)}
              // date={nem.utils.format.nemDate(transaction.timeStamp)}
              date=""
              index={String(index + 1)}
              key={meta.hash.data}
              meta={meta}
            />
          ))}
        </div>
        <p>Note: Very recent transactions may not yet be visible on the explorer.</p>
      </div>
    );
  }

  return null;
};

Transactions.propTypes = {
  error: PropTypes.string,
  transactions: PropTypes.array
};

export default Transactions;
