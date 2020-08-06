import FontAwesome from 'react-fontawesome';
import PropTypes from 'prop-types';
import React from 'react';
import ReadOnlyTextarea from './readOnlyTextarea';
import styles from './manualPayment.module.css';

const ManualPayment = props => {
  const { paymentAddress, paymentHash, priceInXem } = props;

  const copyPrice = parseFloat(priceInXem) ? (
    <>
      of <span className="yellow">{priceInXem} XEM</span>
    </>
  ) : (
    '(name your price!)'
  );

  return (
    <>
      <div className={styles.step}>
        <h4 className={styles.heading}>
          <span className="yellow">1.</span> Payment ID
        </h4>
        <p>
          Please remember to include the payment ID below in the &lsquo;message&rsquo; field when making your payment,
          as it&rsquo;s your unique, personalised purchase ID, used to confirm your purchase.
        </p>
        <ReadOnlyTextarea text={paymentHash} placeholder="Please log in to see your payment ID" />
        <p className={styles.note} role="alert">
          <FontAwesome name="exclamation-circle" className="mr-2" />
          Your payment ID is essential to your purchase. Please don&rsquo;t forget to include this.
        </p>
      </div>
      <div className={styles.step}>
        <h4 className={styles.heading}>
          <span className="yellow">2.</span> Address
        </h4>
        <p>Add the payment address below:</p>
        <ReadOnlyTextarea text={paymentAddress} placeholder="Payment Address" />
      </div>
      <div className={styles.step}>
        <h4 className={styles.heading}>
          <span className="yellow">3.</span> Amount
        </h4>
        <p>Fill in the payment amount {copyPrice} and hit send. Done! Wait for confirmation, and grab your download.</p>
        <ReadOnlyTextarea
          text={parseFloat(priceInXem) ? priceInXem : 'Name your price!'}
          placeholder="Payment Amount"
        />
      </div>
    </>
  );
};

ManualPayment.propTypes = {
  paymentAddress: PropTypes.string,
  paymentHash: PropTypes.string,
  priceInXem: PropTypes.string
};

export default ManualPayment;
