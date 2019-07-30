import React from 'react';

const explorer =
  process.env.NODE_ENV !== 'production' ||
  process.env.REACT_APP_NEM_NETWORK === 'testnet'
    ? 'http://bob.nem.ninja:8765/#/transfer/'
    : 'http://chain.nem.ninja/#/transfer/';

const Transaction = props => (
  <tr>
    <th scope="row">{props.index + 1}</th>
    <td>{props.date}</td>
    <td>
      <a href={`${explorer}${props.hash}`} title={props.date}>
        {`${props.amount} XEM`}
      </a>
    </td>
  </tr>
);

export default Transaction;
