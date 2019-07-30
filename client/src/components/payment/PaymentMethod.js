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
    </>
  );
};

export default PaymentMethod;
