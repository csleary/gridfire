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
          as it&rsquo;s your unique, personalised purchase ID. (Used to confirm your purchase.)
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
        <p>Next, with your payment ID safely pasted into the message field, add the payment address:</p>
        <ReadOnlyTextarea text={paymentAddress} placeholder="Payment Address" />
      </div>
      <div className={styles.step}>
        <h4 className={styles.heading}>
          <span className="yellow">3.</span> Amount
        </h4>
        <p>Finally, fill in the payment amount {copyPrice} and hit the send button.</p>
        <ReadOnlyTextarea
          text={parseFloat(priceInXem) ? priceInXem : 'Name your price!'}
          placeholder="Payment Amount"
        />
      </div>
      <div className={styles.step}>
        <h4 className={`${styles.heading} yellow`}>Done!</h4>
        <p>
          Once you have paid, and your payments has been confirmed by the NEM network, they will be totalled before
          presenting you with a download button (assuming your payments have met the price!).
        </p>
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
