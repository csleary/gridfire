import { faBomb, faListOl } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import PropTypes from 'prop-types';
import React from 'react';
import Transaction from './transaction';
import nem from 'nem-sdk';
import styles from './transactions.module.css';

const Transactions = ({ transactions, error }) => {
  if (error) {
    return (
      <div className={styles.transactions}>
        <div className="alert alert-danger text-center" role="alert">
          <FontAwesomeIcon icon={faBomb} className="mr-2" />
          Sorry, we encountered an error while checking for transactions. {error}
        </div>
      </div>
    );
  }

  if (transactions.length) {
    return (
      <div className={styles.transactions}>
        <h5 className={styles.heading}>
          <FontAwesomeIcon icon={faListOl} className="yellow mr-3" />
          {transactions.length} confirmed transaction
          {transactions.length > 1 ? 's' : null}:
        </h5>
        <div className={styles.grid}>
          <div className={styles.index}>#</div>
          <div>Payment Date</div>
          <div>Amount</div>
          {transactions.map((tx, index) => (
            <Transaction
              hash={tx.meta.hash.data}
              index={String(index + 1)}
              key={tx.meta.hash.data}
              amount={(tx.transaction.amount / 10 ** 6).toFixed(6)}
              date={nem.utils.format.nemDate(tx.transaction.timeStamp)}
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
  transactions: PropTypes.array,
  error: PropTypes.string
};

export default Transactions;
