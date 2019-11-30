import PropTypes from 'prop-types';
import React from 'react';

const Summary = ({ transactions, paidToDate }) => {
  if (!transactions.length) {
    return (
      <p className="mb-4">
        No transactions found just yet. Please hit the refresh button to check
        again for confirmed payments (we&rsquo;ll automatically check every
        thirty seconds).
      </p>
    );
  }

  return (
    <p className="text-center">
      Paid to date:{' '}
      <span className="bold red">{paidToDate.toFixed(2)} XEM</span>
    </p>
  );
};

Summary.propTypes = {
  paidToDate: PropTypes.number,
  transactions: PropTypes.array
};

export default Summary;
