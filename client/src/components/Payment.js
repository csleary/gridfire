import React, { useCallback, useEffect, useState } from 'react';
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

const Payment = props => {
  const { releaseId } = props.match.params;
  const {
    isLoadingTxs,
    isUpdating,
    fetchIncomingTxs,
    hasPurchased,
    nemNode,
    paidToDate,
    paymentAddress,
    paymentHash,
    purchaseRelease,
    release: { artist, artistName, releaseTitle },
    transactions,
    transactionsError
  } = props;

  const [isLoading, setLoading] = useState(true);
  const [showPaymentInfo, setShowPaymentInfo] = useState(false);

  const handleFetchIncomingTxs = useCallback(
    (isUpdating = false) => {
      fetchIncomingTxs({ releaseId, paymentHash }, isUpdating);
    },
    [fetchIncomingTxs, paymentHash, releaseId]
  );

  useEffect(() => {
    purchaseRelease(releaseId).then(() => {
      setLoading(false);
      if (!paymentAddress) return null;
      handleFetchIncomingTxs();
    });
  }, [handleFetchIncomingTxs, paymentAddress, purchaseRelease, releaseId]);

  const handleShowPaymentInfo = () => {
    setShowPaymentInfo(!showPaymentInfo);
  };

  const roundUp = (value, precision) => {
    const factor = 10 ** precision;
    return Math.ceil(value * factor) / factor;
  };

  const priceInXem = roundUp(props.priceInXem, 2).toFixed(2);

  const paymentButtonQR = classNames(
    styles.select,
    'btn',
    'btn-outline-primary',
    {
      [styles.selected]: !showPaymentInfo
    }
  );

  const paymentButtonManual = classNames(
    styles.select,
    'btn',
    'btn-outline-primary',
    {
      [styles.selected]: showPaymentInfo
    }
  );

  const paymentMethods = classNames(styles.methods, 'mb-5', {
    [styles.manual]: showPaymentInfo
  });

  if (isLoading) {
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
              Unfortunately, <Link to={`/artist/${artist}`}>{artistName}</Link>{' '}
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
              className={`${styles.method} btn-group d-flex justify-content-center`}
              role="group"
              aria-label="Payment Method"
            >
              <button
                type="button"
                className={paymentButtonQR}
                onClick={handleShowPaymentInfo}
              >
                QR Scan
              </button>
              <button
                type="button"
                className={paymentButtonManual}
                onClick={handleShowPaymentInfo}
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
        artistName={artistName}
        checkFormatMp3={props.checkFormatMp3}
        fetchDownloadToken={props.fetchDownloadToken}
        handleFetchIncomingTxs={handleFetchIncomingTxs}
        hasPurchased={hasPurchased}
        isLoadingTxs={isLoadingTxs}
        isUpdating={isUpdating}
        nemNode={nemNode}
        paidToDate={paidToDate}
        price={priceInXem}
        releaseId={releaseId}
        releaseTitle={releaseTitle}
        roundUp={roundUp}
        toastInfo={props.toastInfo}
        transactions={transactions}
        transactionsError={transactionsError}
      />
    </main>
  );
};

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
