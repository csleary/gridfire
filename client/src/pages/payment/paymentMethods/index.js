import React, { useState } from 'react';
import Button from 'components/button';
import PaymentMethod from './paymentMethod';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import styles from './paymentMethods.module.css';

const PaymentMethods = ({ paymentAddress, paymentHash, priceInXem }) => {
  const [showManualPayment, setshowManualPayment] = useState(false);
  const handleshowManualPayment = () => setshowManualPayment(!showManualPayment);
  const qrButton = classNames(styles.select, { [styles.selected]: !showManualPayment });
  const manualButton = classNames(styles.select, { [styles.selected]: showManualPayment });

  return (
    <>
      <div className={styles.buttons} role="group" aria-label="Payment Method">
        <Button type="button" className={qrButton} onClick={handleshowManualPayment}>
          QR Scan
        </Button>
        <Button type="button" className={manualButton} onClick={handleshowManualPayment}>
          Manual
        </Button>
      </div>
      <div className={styles.methods}>
        <PaymentMethod
          paymentAddress={paymentAddress}
          paymentHash={paymentHash}
          priceInXem={priceInXem}
          showManualPayment={showManualPayment}
        />
      </div>
    </>
  );
};

PaymentMethods.propTypes = {
  paymentAddress: PropTypes.string,
  paymentHash: PropTypes.string,
  priceInXem: PropTypes.string
};

export default PaymentMethods;
