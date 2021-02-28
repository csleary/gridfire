import PropTypes from 'prop-types';
import React from 'react';
import styles from './underPaid.module.css';

const Underpaid = ({ amountPaid, priceInRawXem }) => {
  if (amountPaid > 0 && amountPaid < priceInRawXem) {
    const remaining = ((priceInRawXem - amountPaid) * 10 ** -6).toFixed(6);

    return (
      <div className={styles.root}>
        <div>Remaining</div>
        <div className={styles.remaining}> {remaining} XEM </div>
      </div>
    );
  }

  return null;
};

Underpaid.propTypes = {
  amountPaid: PropTypes.number,
  priceInRawXem: PropTypes.number
};

export default Underpaid;
