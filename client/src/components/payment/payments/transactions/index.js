import FontAwesome from 'react-fontawesome';
import PropTypes from 'prop-types';
import React from 'react';
import Transaction from './transaction';
import nem from 'nem-sdk';
import styles from './transactions.module.css';

const Transactions = ({ transactions, error }) => {
  const txList = transactions.map((tx, index) => (
    <Transaction
      hash={tx.meta.hash.data}
      index={index}
      key={tx.meta.hash.data}
      amount={tx.transaction.amount / 10 ** 6}
      date={nem.utils.format.nemDate(tx.transaction.timeStamp)}
    />
  ));

  if (error) {
    return (
      <div className="row transactions">
        <div className="col">
          <div className="alert alert-danger text-center" role="alert">
            <FontAwesome name="bomb" className="mr-2" />
            Sorry, we encountered an error while checking for transactions.{' '}
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (transactions.length) {
    return (
      <div className="row transactions">
        <div className="col">
          <div className={styles.wrapper}>
            <h5 className="mb-4">
              <FontAwesome name="list-ol" className="red mr-3" />
              {transactions.length} Confirmed Transaction
              {transactions.length > 1 && 's'}:
            </h5>
            <table className="table table-sm table-striped table-dark">
              <thead>
                <tr>
                  <th scope="col" className="col-item">
                    #
                  </th>
                  <th scope="col" className="col-date">
                    Payment Date
                  </th>
                  <th scope="col" className="col-amount">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>{txList}</tbody>
              <tfoot>
                <tr>
                  <td colSpan="3">
                    Note: Very recent transactions may not yet be visible on the
                    explorer.
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

Transactions.propTypes = {
  transactions: PropTypes.array,
  error: PropTypes.string
};

export default Transactions;
