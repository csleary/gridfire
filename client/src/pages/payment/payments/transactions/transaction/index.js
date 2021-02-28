import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import PropTypes from 'prop-types';
import React from 'react';
import { faClock } from '@fortawesome/free-regular-svg-icons';
import styles from './transaction.module.css';

const explorer =
  process.env.REACT_APP_NEM_NETWORK === 'testnet' ? 'testnet-explorer.nemtool.com' : 'explorer.nemtool.com';

const Transaction = ({ amount, date, index, meta }) => {
  const { height, hash } = meta;
  return (
    <>
      <div className={styles.index}>{index}</div>
      <div>{date}</div>
      <div className={styles.amount}>
        {height === 9007199254740991 ? (
          <FontAwesomeIcon className={styles.unconfirmed} icon={faClock} title="Unconfirmed transaction" />
        ) : null}
        <a href={`https://${explorer}/#/s_tx?hash=${hash}`} title={date}>
          {`${amount} XEM`}
        </a>
      </div>
    </>
  );
};

Transaction.propTypes = {
  amount: PropTypes.string,
  date: PropTypes.string,
  meta: PropTypes.object,
  index: PropTypes.string
};

export default Transaction;
