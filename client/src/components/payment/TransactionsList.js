import React, { useEffect, useState } from 'react';
import FontAwesome from 'react-fontawesome';
import { Link } from 'react-router-dom';
import SingleTransaction from './SingleTransaction';
import Spinner from './../Spinner';
import nem from 'nem-sdk';
import styles from '../../style/TransactionsList.module.css';

const TransactionsList = props => {
  const {
    handleFetchIncomingTxs,
    hasPurchased,
    isLoadingTxs,
    isUpdating,
    nemNode,
    paidToDate,
    price,
    release: { artistName, releaseTitle },
    roundUp,
    toastInfo,
    transactions,
    transactionsError
  } = props;
  const releaseId = props.release._id;

  const [isPreparingDownload, setPreparingDownload] = useState(false);
  const [formatExists, setFormatExists] = useState(false);

  useEffect(() => {
    const updateTxs = () => {
      if (!hasPurchased) {
        handleFetchIncomingTxs(true);
      } else {
        window.clearInterval(txInterval);
        clearTimeout(txTimeout);
      }
    };

    const txInterval = window.setInterval(updateTxs, 30000);
    const txTimeout = setTimeout(txInterval, 30000);

    return () => {
      window.clearInterval(txInterval);
      clearTimeout(txTimeout);
    };
  }, [handleFetchIncomingTxs, hasPurchased]);

  const handleDownload = () => {
    setPreparingDownload(true);

    props.fetchDownloadToken(releaseId, downloadToken => {
      if (downloadToken) {
        toastInfo(`Fetching download: ${artistName} - '${releaseTitle}'`);
        props.checkFormatMp3(downloadToken, () => {
          setFormatExists(true);
          setPreparingDownload(false);
          window.location = `/api/download/${downloadToken}`;
        });
      } else {
        setPreparingDownload(false);
      }
    });
  };

  const underpaid = () => {
    const delta = price - paidToDate;

    if (paidToDate > 0 && paidToDate < price && !hasPurchased) {
      return (
        <p className="mb-4">
          Please pay a futher{' '}
          <span className="bold red">{roundUp(delta, 2).toFixed(2)} XEM</span>{' '}
          to activate your download, then tap the refresh button to check for
          confirmed payments.
        </p>
      );
    }
  };

  const downloadButton = hasPurchased && (
    <>
      <h3 className="text-center mt-5">Thank you!</h3>
      <p className="text-center">
        <span className="ibm-type-italic">{releaseTitle}</span> has been added
        to <Link to={'/dashboard/collection'}>your collection</Link>.
      </p>
      <div className="d-flex justify-content-center">
        <button
          className={`${styles.download} btn btn-outline-primary btn-lg`}
          disabled={isPreparingDownload === true}
          download
          onClick={handleDownload}
        >
          {isPreparingDownload ? (
            <>
              <FontAwesome name="cog" spin className="mr-2" />
              Preparing download…
            </>
          ) : (
            <>
              <FontAwesome name="download" className="download mr-2" />
              Download <span className="ibm-type-italic">{releaseTitle}</span>
            </>
          )}
        </button>
      </div>
      {isPreparingDownload && !formatExists ? (
        <>
          <p className="mt-3 mb-2">
            <FontAwesome name="info-circle" className="cyan mr-2" />
            This can take a little while if we don&rsquo;t have your chosen
            format cached, as we&rsquo;ll freshly transcode the release from
            source, before building your archive.
          </p>
          <p>
            A download prompt will pop up when it&rsquo;s ready. You&rsquo;re
            free to continue browsing around the site while you wait.
          </p>
        </>
      ) : null}
    </>
  );

  const txList = transactions.map((tx, index) => (
    <SingleTransaction
      hash={tx.meta.hash.data}
      index={index}
      key={tx.meta.hash.data}
      amount={tx.transaction.amount / 10 ** 6}
      date={nem.utils.format.nemDate(tx.transaction.timeStamp)}
    />
  ));

  const renderError = (
    <div className="alert alert-danger text-center" role="alert">
      <FontAwesome name="bomb" className="mr-2" />
      Sorry, we encountered an error while checking for transactions:{' '}
      {transactionsError}
    </div>
  );

  const confirmedTransactions = transactions.length > 0 && (
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
  );

  if (isLoadingTxs) {
    return (
      <Spinner>
        <h3>
          <FontAwesome name="search" className="red mr-2" />
          Searching for Transactions&hellip;
        </h3>
      </Spinner>
    );
  }

  return (
    <>
      <div className="row">
        <div className="col">
          <h3 className="text-center">Transactions</h3>
        </div>
      </div>
      <div className={`${styles.transactions} row justify-content-center mb-5`}>
        <div className={`${styles.segment} col-md-6 p-4`}>
          {!transactions.length ? (
            <p className="mb-4">
              No transactions found just yet. Please hit the refresh button to
              check again for confirmed payments (we&rsquo;ll automatically
              check every thirty seconds).
            </p>
          ) : (
            <p className="text-center">
              Paid to date:{' '}
              <span className="bold red">{paidToDate.toFixed(2)} XEM</span>
            </p>
          )}
          {underpaid()}
          <div className="d-flex justify-content-center">
            <button
              className={`${styles.refresh} btn btn-outline-primary btn-sm py-2 px-3`}
              disabled={isUpdating}
              onClick={() => handleFetchIncomingTxs(true)}
              title={`Press to check again for recent payments (NIS Node: ${nemNode}).`}
            >
              <FontAwesome name="refresh" className="mr-2" spin={isUpdating} />
              Refresh
            </button>
          </div>
          {downloadButton}
        </div>
      </div>
      <div className="row transactions">
        <div className="col">
          {transactionsError ? renderError : confirmedTransactions}
        </div>
      </div>
    </>
  );
};

export default TransactionsList;
