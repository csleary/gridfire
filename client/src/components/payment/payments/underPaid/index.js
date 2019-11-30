import PropTypes from 'prop-types';
import React from 'react';

const Underpaid = ({ hasPurchased, paidToDate, price, roundUp }) => {
  const delta = price - paidToDate;

  if (paidToDate > 0 && paidToDate < price && !hasPurchased) {
    return (
      <p className="mb-4">
        Please pay a futher{' '}
        <span className="bold red">{roundUp(delta, 2).toFixed(2)} XEM</span> to
        activate your download, then tap the refresh button to check for
        confirmed payments.
      </p>
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
