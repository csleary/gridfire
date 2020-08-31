import PropTypes from 'prop-types';
import React from 'react';

const explorer =
  process.env.REACT_APP_NEM_NETWORK === 'testnet' ? 'testnet-explorer.nemtool.com' : 'explorer.nemtool.com';

const Transaction = props => (
  <>
    <div className="yellow">{props.index}</div>
    <div>{props.date}</div>
    <div>
      <a href={`https://${explorer}/#/s_tx?hash=${props.hash}`} title={props.date}>
        {`${props.amount} XEM`}
      </a>
    </div>
  </>
);

Transaction.propTypes = {
  amount: PropTypes.string,
  date: PropTypes.string,
  hash: PropTypes.string,
  index: PropTypes.string
};

export default Transaction;
