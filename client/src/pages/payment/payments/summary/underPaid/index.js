import PropTypes from 'prop-types';
import React from 'react';
import styles from './underPaid.module.css';

const Underpaid = ({ payments, price }) => {
  const { remaining, hasPurchased, paidToDate } = payments;
  if (parseFloat(paidToDate) > 0 && parseFloat(paidToDate) < parseFloat(price) && !hasPurchased) {
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
