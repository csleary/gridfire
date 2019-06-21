import React, { Component, Fragment } from 'react';
import { Link, withRouter } from 'react-router-dom';
import FontAwesome from 'react-fontawesome';
import nem from 'nem-sdk';
import SingleTransaction from './SingleTransaction';
import Spinner from './../Spinner';
import '../../style/transactionsList.css';

class TransactionsList extends Component {
  state = {
    isPreparingDownload: false,
    formatExists: false
  };

  handleDownload = () => {
    this.setState({ isPreparingDownload: true });
    const {
      release: { artistName, releaseTitle },
      toastInfo
    } = this.props;
    const releaseId = this.props.release._id;

    this.props.fetchDownloadToken(releaseId, downloadToken => {
      if (downloadToken) {
        toastInfo(`Fetching download: ${artistName} - '${releaseTitle}'`);
        this.props.checkFormatMp3(downloadToken, () => {
          this.setState({ formatExists: true, isPreparingDownload: false });
          window.location = `/api/download/${downloadToken}`;
        });
      } else {
        this.setState({ isPreparingDownload: false });
      }
    });
  };

  underpaid = () => {
    const { hasPurchased, paidToDate, price, roundUp } = this.props;

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

  render() {
    const {
      handleFetchIncomingTxs,
      hasPurchased,
      isLoadingTxs,
      isUpdating,
      nemNode,
      paidToDate,
      release: { releaseTitle },
      transactions,
      transactionsError
    } = this.props;

    const downloadButton = hasPurchased && (
      <Fragment>
        <h3 className="text-center mt-5">Thank you!</h3>
        <p className="text-center">
          <span className="ibm-type-italic">{releaseTitle}</span> has been added
          to <Link to={'/dashboard/collection'}>your collection</Link>.
        </p>
        <div className="d-flex justify-content-center">
          <button
            className="btn btn-outline-primary btn-lg download-button"
            disabled={this.state.isPreparingDownload === true}
            download
            onClick={this.handleDownload}
          >
            {this.state.isPreparingDownload ? (
              <Fragment>
                <FontAwesome name="cog" spin className="mr-2" />
                Preparing download…
              </Fragment>
            ) : (
              <Fragment>
                <FontAwesome name="download" className="download mr-2" />
                Download <span className="ibm-type-italic">{releaseTitle}</span>
              </Fragment>
            )}
          </button>
        </div>
        {this.state.isPreparingDownload && !this.state.formatExists ? (
          <Fragment>
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
          </Fragment>
        ) : null}
      </Fragment>
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
        Oh no! We encountered an error while checking for transactions:{' '}
        {transactionsError}
      </div>
    );

    const confirmedTransactions = transactions.length > 0 && (
      <div className="tx-list mt-3">
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
          <h3 className="transactions-searching">
            <FontAwesome name="search" className="red mr-2" />
            Searching for Transactions&hellip;
          </h3>
        </Spinner>
      );
    }

    return (
      <Fragment>
        <div className="row">
          <div className="col">
            <h3 className="text-center">Transactions</h3>
          </div>
        </div>
        <div className="row transactions justify-content-center mb-5">
          <div className="segment col-md-6 p-4">
            {!transactions.length ? (
              <p className="mb-4">
                No transactions found just yet. Please hit the refresh button to
                check again for confirmed payments.
              </p>
            ) : (
              <p className="text-center">
                Paid to date:{' '}
                <span className="bold red">{paidToDate.toFixed(2)} XEM</span>
              </p>
            )}
            {this.underpaid()}
            <div className="d-flex justify-content-center">
              <button
                className="btn btn-outline-primary btn-sm refresh-txs py-2 px-3"
                disabled={isUpdating}
                onClick={() => handleFetchIncomingTxs(true)}
                title={`Press to check again for recent payments (NIS Node: ${nemNode}).`}
              >
                <FontAwesome
                  name="refresh"
                  className="mr-2"
                  spin={isUpdating}
                />
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
      </Fragment>
    );
  }
}

export default withRouter(TransactionsList);
