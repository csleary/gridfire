import React, { Component } from 'react';
import { connect } from 'react-redux';
import FontAwesome from 'react-fontawesome';
import * as actions from '../actions';
import QRCode from './QRCode';
import ReadOnlyTextarea from './ReadOnlyTextarea';
import Spinner from './Spinner';
import TransactionsList from './TransactionsList';
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
    this.props.fetchXemPrice();
    this.props.purchaseRelease(releaseId).then(() => {
      this.setState({ isLoading: false });
      const { paymentHash } = this.props;
      this.props.fetchIncomingTxs({
        releaseId,
        paymentHash
      });
    });
  }

  render() {
    const { releaseId } = this.props.match.params;
    const { paymentHash } = this.props;
    const paymentParams = {
      releaseId,
      paymentHash
    };
    const paymentInfo = this.state.showPaymentInfo ? (
      <div>
        <h3 className="text-center">Manual Payment</h3>
        <p>
          If you can&rsquo;t scan a QR code, you can still make a payment
          manually as follows:
        </p>
        <h4>1. Enter Your Payment ID as Message</h4>
        <p>
          Please remember to include the payment ID below in the message field
          when making your payment, as it&rsquo;s your unique, personalised
          purchase ID. This will be used to confirm your purchase has
          successfully been made.
        </p>
        <p className="text-center please-note" role="alert">
          <FontAwesome name="exclamation-circle" className="icon-left" />
          Your payment ID is essential to your purchase. Please don&rsquo;t
          forget to include this.
        </p>
        <ReadOnlyTextarea
          className="payment-info"
          text={this.props.paymentHash}
          placeholder="Please log in to see your payment ID"
        />
        <h4>2. Enter the Address and Payment Amount</h4>
        <p>
          With your payment ID safely pasted into the message field, all
          that&rsquo;s left is to enter the payment amount ({
            this.props.release.price
          }{' '}
          XEM, ~${(this.props.release.price * this.props.xemPriceUsd).toFixed(
            2
          )}{' '}
          USD) and copy-paste the payment address:
        </p>
        <ReadOnlyTextarea
          className="payment-info"
          text={this.props.paymentAddress}
          placeholder="Payment Address"
        />
        <h4>3. Send It!</h4>
        <p>
          Once you have paid it will be listed below. Once confirmed, your
          payments will be totalled and you will be presented with a download
          button (assuming your payments have met the price!).
        </p>
      </div>
    ) : (
      <div className="d-flex justify-content-center">
        <button
          className="btn btn-outline-primary btn-sm show-payment-info"
          onClick={() => this.setState({ showPaymentInfo: true })}
        >
          Manual Payment Info
        </button>
      </div>
    );

    if (this.state.isLoading) {
      return <Spinner message={<h2>Loading Payment Info&hellip;</h2>} />;
    }
    return (
      <main className="container">
        <div className="row">
          <div className="col">
            <h2 className="text-center">Payment</h2>
            <h3 className="text-center">
              {this.props.release.artistName} -{' '}
              <span className="ibm-type-italic">
                {this.props.release.releaseTitle}
              </span>
            </h3>
            <p>
              Please scan the QR code below with the NEM Wallet app to make your
              payment. If you&rsquo;re on a mobile device, or cannot scan the QR
              code, you can also{' '}
              <a
                onClick={() =>
                  this.setState({
                    showPaymentInfo: !this.state.showPaymentInfo
                  })
                }
                role="button"
                style={{ cursor: 'pointer' }}
                tabIndex="-1"
              >
                pay manually
              </a>.
            </p>
            {!this.state.showPaymentInfo && (
              <QRCode
                paymentAddress={this.props.paymentAddress.replace(/-/g, '')}
                price={this.props.release.price}
                idHash={this.props.paymentHash}
              />
            )}
            {paymentInfo}
            <TransactionsList
              downloadToken={this.props.downloadToken}
              isLoadingTxs={this.props.isLoadingTxs}
              isUpdating={this.props.isUpdating}
              nemNode={this.props.nemNode}
              paidToDate={this.props.paidToDate}
              paymentParams={paymentParams}
              release={this.props.release}
              toastMessage={this.props.toastMessage}
              transactions={this.props.transactions}
              updateIncomingTxs={this.props.updateIncomingTxs}
            />
          </div>
        </div>
      </main>
    );
  }
}

function mapStateToProps(state) {
  return {
    downloadToken: state.transactions.downloadToken,
    hasPaid: state.transactions.hasPaid,
    isLoading: state.releases.isLoading,
    isLoadingTxs: state.transactions.isLoading,
    isUpdating: state.transactions.isUpdating,
    nemNode: state.transactions.nemNode,
    paidToDate: state.transactions.paidToDate,
    paymentAddress: state.releases.paymentAddress,
    paymentHash: state.releases.paymentHash,
    release: state.releases.selectedRelease,
    transactions: state.transactions.incomingTxs,
    xemPriceUsd: state.nem.xemPriceUsd
  };
}

export default connect(mapStateToProps, actions)(Payment);
