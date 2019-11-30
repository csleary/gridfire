import FontAwesome from 'react-fontawesome';
import PropTypes from 'prop-types';
import React from 'react';
import ReadOnlyTextarea from './readOnlyTextarea';
import styles from '../../paymentMethods.module.css';

const ManualPayment = props => {
  const { paymentAddress, paymentHash, priceInXem } = props;

  const copyPrice = parseFloat(priceInXem) ? (
    <>
      of <span className="bold red">{priceInXem} XEM</span>
    </>
  ) : (
    '(name your price!)'
  );

  return (
    <div className="row no-gutters">
      <div className="col-md-8 mx-auto">
        <h4 className="mb-4">
          <span className="red">1.</span> Payment ID
        </h4>
        <p className="mb-4">
          Please remember to include the payment ID below in the
          &lsquo;message&rsquo; field when making your payment, as it&rsquo;s
          your unique, personalised purchase ID. (Used to confirm your
          purchase.)
        </p>
        <p className={`${styles.note} text-center`} role="alert">
          <FontAwesome name="exclamation-circle" className="mr-2" />
          Your payment ID is essential to your purchase. Please don&rsquo;t
          forget to include this.
        </p>
        <ReadOnlyTextarea
          text={paymentHash}
          placeholder="Please log in to see your payment ID"
        />
        <h4 className="mb-4">
          <span className="red">2.</span> Address
        </h4>
        <p className="mb-4">
          Next, with your payment ID safely pasted into the message field, add
          the payment address:
        </p>
        <ReadOnlyTextarea text={paymentAddress} placeholder="Payment Address" />
        <h4 className="mb-4">
          <span className="red">3.</span> Amount
        </h4>
        <p className="mb-4">
          Finally, fill in the payment amount {copyPrice} and hit the send
          button.
        </p>
        <ReadOnlyTextarea
          text={parseFloat(priceInXem) ? priceInXem : 'Name your price!'}
          placeholder="Payment Amount"
        />
        <h4 className="mb-4">Done!</h4>
        <p>
          Once you have paid, and your payments has been confirmed by the NEM
          network, they will be totalled before presenting you with a download
          button (assuming your payments have met the price!).
        </p>
      </div>
    </div>
  );
};

ManualPayment.propTypes = {
  paymentAddress: PropTypes.string,
  paymentHash: PropTypes.string,
  priceInXem: PropTypes.string
};

export default ManualPayment;
