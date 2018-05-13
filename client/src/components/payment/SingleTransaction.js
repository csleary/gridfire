import React from 'react';

const explorer =
  process.env.NODE_ENV !== 'production' ||
  process.env.REACT_APP_NEM_NETWORK === 'testnet'
    ? 'http://bob.nem.ninja:8765/#/transfer/'
    : 'http://chain.nem.ninja/#/transfer/';

const SingleTransaction = props => (
  <li className="list-item">
    {props.date.substring(0, 16)} &bull;{' '}
    <a href={`${explorer}${props.hash}`} title={props.date}>
      {`${props.amount} XEM`}
    </a>
  </li>
);

export default SingleTransaction;
