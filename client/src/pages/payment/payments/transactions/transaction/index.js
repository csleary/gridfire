import PropTypes from 'prop-types';
import React from 'react';

const explorer = process.env.REACT_APP_NEM_NETWORK === 'testnet' ? 'bob.nem.ninja:8765' : 'chain.nem.ninja';

const Transaction = props => (
  <>
    <div className="yellow">{props.index + 1}</div>
    <div>{props.date}</div>
    <div>
      <a href={`http://${explorer}/#/transfer/${props.hash}`} title={props.date}>
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
