import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import classNames from 'classnames';
import * as actions from '../actions';
import ManualPayment from './payment/ManualPayment';
import QRCode from './payment/QRCode';
import Spinner from './Spinner';
import TransactionsList from './payment/TransactionsList';
import '../style/payment.css';

class Payment extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: true,
      showPaymentInfo: false
    };
  }

  componentDidMount() {
    const { releaseId } = this.props.match.params;
    this.props.purchaseRelease(releaseId).then(() => {
      this.setState({ isLoading: false });
      if (!this.props.paymentAddress) return null;
      this.handleFetchIncomingTxs();
    });
  }

  handleFetchIncomingTxs = (isUpdating = false) => {
    const { releaseId } = this.props.match.params;
    const { paymentHash } = this.props;
    this.props.fetchIncomingTxs({ releaseId, paymentHash }, isUpdating);
  };

  handleShowPaymentInfo = () => {
    this.setState({
      showPaymentInfo: !this.state.showPaymentInfo
    });
  };

  roundUp(value, precision) {
    const factor = 10 ** precision;
    return Math.ceil(value * factor) / factor;
  }

  render() {
    const {
      downloadToken,
      isLoadingTxs,
      isUpdating,
      nemNode,
      paidToDate,
      paymentAddress,
      paymentHash,
      release,
      toastInfo,
      transactions,
      transactionsError
    } = this.props;

    const { artist, artistName, releaseTitle } = release;
    const { showPaymentInfo } = this.state;
    const priceInXem = this.roundUp(this.props.priceInXem, 2).toFixed(2);

    const paymentButtonQR = classNames('btn', 'btn-outline-primary', {
      'method-active': !showPaymentInfo
    });

    const paymentButtonManual = classNames('btn', 'btn-outline-primary', {
      'method-active': showPaymentInfo
    });

    const paymentMethods = classNames('payment-methods', 'mb-5', {
      manual: showPaymentInfo
    });

    if (this.state.isLoading) {
      return (
        <Spinner>
          <h2 className="mt-4">Loading Payment Info&hellip;</h2>
        </Spinner>
      );
    }

    if (!paymentAddress) {
      return (
        <main className="container">
          <div className="row">
            <div className="col">
              <h2 className="text-center">Payment</h2>
              <h3 className="text-center red">
                {artistName} &bull;{' '}
                <span className="ibm-type-italic">{releaseTitle}</span>
              </h3>
              <p className="text-center">
                Oh no! <Link to={`/artist/${artist}`}>{artistName}</Link>{' '}
                doesn&rsquo;t have a NEM payment address in their account, so we
                are unable to process payments for them at the moment.
              </p>
              <p className="text-center">
                Hopefully they&rsquo;ll have an address in place soon!
              </p>
            </div>
          </div>
        </main>
      );
    }

    return (
      <main className="container">
        <div className="row">
          <div className="col p-3">
            <h2 className="text-center mt-4">Payment</h2>
            <h3 className="text-center red">
              {artistName} &bull;{' '}
              <span className="ibm-type-italic">{releaseTitle}</span>
            </h3>
            <div className={paymentMethods}>
              <div
                className="btn-group payment-method d-flex justify-content-center"
                role="group"
                aria-label="Payment Method"
              >
                <button
                  type="button"
                  className={paymentButtonQR}
                  onClick={this.handleShowPaymentInfo}
                >
                  QR Scan
                </button>
                <button
                  type="button"
                  className={paymentButtonManual}
                  onClick={this.handleShowPaymentInfo}
                >
                  Manual Payment
                </button>
              </div>
              {showPaymentInfo ? (
                <ManualPayment
                  paymentAddress={paymentAddress}
                  paymentHash={paymentHash}
                  priceInXem={priceInXem}
                />
              ) : (
                <Fragment>
                  <div className="qrcode text-center">
                    <QRCode
                      paymentAddress={paymentAddress.replace(/-/g, '')}
                      price={priceInXem}
                      idHash={paymentHash}
                    />
                  </div>
                  <p className="text-center">
                    Please scan the QR code with a NEM mobile wallet app to make
                    your payment.
                  </p>
                </Fragment>
              )}
            </div>
          </div>
        </div>
        <TransactionsList
          artistName={release.artistName}
          downloadToken={downloadToken}
          handleFetchIncomingTxs={this.handleFetchIncomingTxs}
          isLoadingTxs={isLoadingTxs}
          isUpdating={isUpdating}
          nemNode={nemNode}
          paidToDate={paidToDate}
          price={priceInXem}
          releaseTitle={release.releaseTitle}
          roundUp={this.roundUp}
          toastInfo={toastInfo}
          transactions={transactions}
          transactionsError={transactionsError}
        />
      </main>
    );
  }
}

function mapStateToProps(state) {
  return {
    downloadToken: state.transactions.downloadToken,
    isLoading: state.releases.isLoading,
    isLoadingTxs: state.transactions.isLoading,
    isUpdating: state.transactions.isUpdating,
    nemNode: state.transactions.nemNode,
    paidToDate: state.transactions.paidToDate,
    paymentAddress: state.releases.paymentAddress,
    paymentHash: state.releases.paymentHash,
    priceInXem: state.releases.priceInXem,
    release: state.releases.selectedRelease,
    transactions: state.transactions.incomingTxs,
    transactionsError: state.transactions.error
  };
}

export default connect(
  mapStateToProps,
  actions
)(Payment);
