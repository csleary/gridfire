import FontAwesome from 'react-fontawesome';
import React from 'react';
import Transaction from './Transaction';
import nem from 'nem-sdk';

const Transactions = ({ transactions, transactionsError }) => {
  const txList = transactions.map((tx, index) => (
    <Transaction
      hash={tx.meta.hash.data}
      index={index}
      key={tx.meta.hash.data}
      amount={tx.transaction.amount / 10 ** 6}
      date={nem.utils.format.nemDate(tx.transaction.timeStamp)}
    />
  ));

  if (transactionsError) {
    return (
      <div className="row transactions">
        <div className="col">
          <div className="alert alert-danger text-center" role="alert">
            <FontAwesome name="bomb" className="mr-2" />
            Sorry, we encountered an error while checking for transactions:{' '}
            {transactionsError}
          </div>
        </div>
      </div>
    );
  }

  if (transactions.length) {
    return (
      <div className="row transactions">
        <div className="col">
          <div className="mt-3">
            <h5 className="mb-4">
              <FontAwesome name="list-ol" className="red mr-3" />
              {transactions.length} Confirmed Transaction
              {transactions.length > 1 && 's'}:
            </h5>
            <table className="table table-sm table-striped table-dark mb-5">
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

export default Transactions;
