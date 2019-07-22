import React, { Component } from 'react';
import {
  checkFormatMp3,
  fetchDownloadToken,
  fetchIncomingTxs,
  purchaseRelease,
  toastInfo
} from '../actions';
import { Link } from 'react-router-dom';
import ManualPayment from './payment/ManualPayment';
import QRCode from './payment/QRCode';
import Spinner from './Spinner';
import TransactionsList from './payment/TransactionsList';
import classNames from 'classnames';
import { connect } from 'react-redux';
import styles from '../style/Payment.module.css';

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
      isLoadingTxs,
      isUpdating,
      hasPurchased,
      nemNode,
      paidToDate,
      paymentAddress,
      paymentHash,
      release,
      transactions,
      transactionsError
    } = this.props;

    const { artist, artistName, releaseTitle } = release;
    const { showPaymentInfo } = this.state;
    const priceInXem = this.roundUp(this.props.priceInXem, 2).toFixed(2);

    const paymentButtonQR = classNames('btn', 'btn-outline-primary', {
      [styles.active]: !showPaymentInfo
    });

    const paymentButtonManual = classNames('btn', 'btn-outline-primary', {
      [styles.active]: showPaymentInfo
    });

    const paymentMethods = classNames(styles.methods, 'mb-5', {
      [styles.manual]: showPaymentInfo
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
                Unfortunately,{' '}
                <Link to={`/artist/${artist}`}>{artistName}</Link> doesn&rsquo;t
                have a NEM payment address in their account, so we are unable to
                process payments for them at the moment.
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
                className={`${styles.method} btn-group d-flex justify-content-center`}
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
                <>
                  <div className={`${styles.qrcode} text-center`}>
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
                </>
              )}
            </div>
          </div>
        </div>
        <TransactionsList
          checkFormatMp3={this.props.checkFormatMp3}
          fetchDownloadToken={this.props.fetchDownloadToken}
          handleFetchIncomingTxs={this.handleFetchIncomingTxs}
          hasPurchased={hasPurchased}
          isLoadingTxs={isLoadingTxs}
          isUpdating={isUpdating}
          nemNode={nemNode}
          paidToDate={paidToDate}
          price={priceInXem}
          release={release}
          roundUp={this.roundUp}
          toastInfo={this.props.toastInfo}
          transactions={transactions}
          transactionsError={transactionsError}
        />
      </main>
    );
  }
}

function mapStateToProps(state) {
  return {
    hasPurchased: state.transactions.hasPurchased,
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
  {
    checkFormatMp3,
    fetchDownloadToken,
    fetchIncomingTxs,
    purchaseRelease,
    toastInfo
  }
)(Payment);
