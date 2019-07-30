import React, { useState } from 'react';
import PaymentMethod from './PaymentMethod';
import classNames from 'classnames';
import styles from '../../style/Payment.module.css';

const PaymentMethods = ({ paymentAddress, paymentHash, priceInXem }) => {
  const [showManualPayment, setshowManualPayment] = useState(false);

  const handleshowManualPayment = () =>
    setshowManualPayment(!showManualPayment);

  const paymentMethods = classNames(styles.methods, 'mb-5', {
    [styles.manual]: showManualPayment
  });

  const paymentButtonQR = classNames(
    styles.select,
    'btn',
    'btn-outline-primary',
    {
      [styles.selected]: !showManualPayment
    }
  );

  const paymentButtonManual = classNames(
    styles.select,
    'btn',
    'btn-outline-primary',
    {
      [styles.selected]: showManualPayment
    }
  );

  return (
    <div className={paymentMethods}>
      <div
        className={`${styles.method} btn-group d-flex justify-content-center`}
        role="group"
        aria-label="Payment Method"
      >
        <button
          type="button"
          className={paymentButtonQR}
          onClick={handleshowManualPayment}
        >
          QR Scan
        </button>
        <button
          type="button"
          className={paymentButtonManual}
          onClick={handleshowManualPayment}
        >
          Manual Payment
        </button>
      </div>
      <PaymentMethod
        paymentAddress={paymentAddress}
        paymentHash={paymentHash}
        priceInXem={priceInXem}
        showManualPayment={showManualPayment}
      />
    </div>
  );
};

export default PaymentMethods;
