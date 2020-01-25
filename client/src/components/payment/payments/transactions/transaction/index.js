import PropTypes from 'prop-types';
import React from 'react';

const explorer =
  process.env.REACT_APP_NEM_NETWORK === 'testnet'
    ? 'http://bob.nem.ninja:8765/#/transfer/'
    : 'http://chain.nem.ninja/#/transfer/';

const Transaction = props => (
  <>
    <div className="bold yellow">{props.index + 1}</div>
    <div>{props.date}</div>
    <div>
      <a href={`${explorer}${props.hash}`} title={props.date}>
        {`${props.amount} XEM`}
      </a>
    </div>
  </>
);

Transaction.propTypes = {
  amount: PropTypes.number,
  date: PropTypes.string,
  hash: PropTypes.string,
  index: PropTypes.number
};

export default Transaction;
