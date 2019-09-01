import FontAwesome from 'react-fontawesome';
import ManualPayment from './ManualPayment';
import QRCode from './QRCode';
import React from 'react';
import styles from '../../style/Payment.module.css';

const PaymentMethod = ({
  paymentAddress,
  paymentHash,
  priceInXem,
  showManualPayment
}) => {
  if (showManualPayment) {
    return (
      <ManualPayment
        paymentAddress={paymentAddress}
        paymentHash={paymentHash}
        priceInXem={priceInXem}
      />
    );
  }

  return (
    <>
      <div className={`${styles.qrcode} text-center`}>
        <QRCode
          paymentAddress={paymentAddress.replace(/-/g, '')}
          price={priceInXem}
          idHash={paymentHash}
        />
      </div>
      <p className="text-center">
        Please scan the QR code with a NEM mobile wallet app to make your
        payment.
      </p>
      <p className="text-center">
        Download a wallet:{' '}
        <a href="https://itunes.apple.com/us/app/nem-wallet/id1227112677">
          <FontAwesome name="apple" className="mr-1" />
          iOS
        </a>{' '}
        and{' '}
        <a href="https://play.google.com/store/apps/details?id=org.nem.nac.mainnet&hl=en">
          <FontAwesome name="android" className="mr-1" />
          Android
        </a>
        .
      </p>
    </>
  );
};

export default PaymentMethod;
