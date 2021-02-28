import React, { useState } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import Button from 'components/button';
import PaymentMethod from './paymentMethod';
import classNames from 'classnames';
import styles from './paymentMethods.module.css';

const PaymentMethods = () => {
  const { isLoading } = useSelector(state => state.payment, shallowEqual);
  const [showManualPayment, setshowManualPayment] = useState(false);
  const handleshowManualPayment = () => setshowManualPayment(!showManualPayment);
  const qrButton = classNames(styles.select, { [styles.selected]: !showManualPayment });
  const manualButton = classNames(styles.select, { [styles.selected]: showManualPayment });

  return (
    <>
      {isLoading ? (
        <div className={styles.buttons} role="group" aria-label="Payment Method">
          <div className={styles.loader} />
        </div>
      ) : (
        <div className={styles.buttons} role="group" aria-label="Payment Method">
          <Button type="button" className={qrButton} onClick={handleshowManualPayment}>
            QR Scan
          </Button>
          <Button type="button" className={manualButton} onClick={handleshowManualPayment}>
            Manual
          </Button>
        </div>
      )}
      <div className={styles.methods}>
        <PaymentMethod showManualPayment={showManualPayment} />
      </div>
    </>
  );
};

export default PaymentMethods;
