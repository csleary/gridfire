import React, { useState } from 'react';
import PaymentMethod from './paymentMethod';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import styles from './paymentMethods.module.css';

const PaymentMethods = ({ paymentAddress, paymentHash, priceInXem }) => {
  const [showManualPayment, setshowManualPayment] = useState(false);

  const handleshowManualPayment = () =>
    setshowManualPayment(!showManualPayment);

  const paymentMethods = classNames(styles.methods, {
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
        className={`${styles.method} btn-group`}
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
          Manual
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

PaymentMethods.propTypes = {
  paymentAddress: PropTypes.string,
  paymentHash: PropTypes.string,
  priceInXem: PropTypes.string
};

export default PaymentMethods;
