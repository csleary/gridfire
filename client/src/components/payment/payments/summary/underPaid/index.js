import PropTypes from 'prop-types';
import React from 'react';
import styles from './underPaid.module.css';

const Underpaid = ({ hasPurchased, paidToDate, price, roundUp }) => {
  const delta = price - paidToDate;

  if (paidToDate > 0 && paidToDate < price && !hasPurchased) {
    return (
      <div className={styles.info}>
        <p>
          Please pay a futher{' '}
          <span className="bold yellow">
            {' '}
            {roundUp(delta, 2).toFixed(2)} XEM{' '}
          </span>{' '}
          and click to confirm.
        </p>
      </div>
    );
  }

  return null;
};

Underpaid.propTypes = {
  hasPurchased: PropTypes.bool,
  roundUp: PropTypes.func,
  paidToDate: PropTypes.number,
  price: PropTypes.string
};

export default Underpaid;
