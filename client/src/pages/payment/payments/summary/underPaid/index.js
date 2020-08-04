import PropTypes from 'prop-types';
import React from 'react';
import styles from './underPaid.module.css';

const Underpaid = ({ payments, price }) => {
  const { remaining, hasPurchased, amountPaid } = payments;
  if (parseFloat(amountPaid) > 0 && parseFloat(amountPaid) < parseFloat(price) && !hasPurchased) {
    return (
      <div className={styles.info}>
        <div>Remaining</div>
        <div className={styles.remaining}> {remaining} XEM </div>
      </div>
    );
  }

  return null;
};

Underpaid.propTypes = {
  payments: PropTypes.object,
  price: PropTypes.string
};

export default Underpaid;
