import React from 'react';

const SingleTransaction = props => (
  <li className="list-item">
    {props.date.substring(0, 16)} &bull;{' '}
    <a
      href={`http://bob.nem.ninja:8765/#/transfer/${props.hash}`}
      title={props.date}
    >
      {props.hash}
    </a>
  </li>
);

export default SingleTransaction;
