import React, { Fragment } from 'react';
import FontAwesome from 'react-fontawesome';
import ReadOnlyTextarea from './ReadOnlyTextarea';

const ManualPayment = props => {
  const { paymentAddress, paymentHash, priceInXem } = props;
  return (
    <Fragment>
      <h4 className="text-center">
        <span className="red">1.</span> Enter Your Payment ID as a Message
      </h4>
      <p>
        Please remember to include the payment ID below in the message field
        when making your payment, as it&rsquo;s your unique, personalised
        purchase ID. This will be used to confirm your purchase has successfully
        been made.
      </p>
      <p className="text-center please-note" role="alert">
        <FontAwesome name="exclamation-circle" className="icon-left" />
        Your payment ID is essential to your purchase. Please don&rsquo;t forget
        to include this.
      </p>
      <ReadOnlyTextarea
        className="payment-info"
        text={paymentHash}
        placeholder="Please log in to see your payment ID"
      />
      <h4 className="text-center">
        <span className="red">2.</span> Enter the Address and Payment Amount
      </h4>
      <p>
        With your payment ID safely pasted into the message field, all
        that&rsquo;s left is to enter the payment amount of{' '}
        <span className="bold red">{priceInXem} XEM</span>, and copy-paste the
        payment address:
      </p>
      <ReadOnlyTextarea
        className="payment-info"
        text={paymentAddress}
        placeholder="Payment Address"
      />
      <h4 className="text-center">
        <span className="red">3.</span> Send It!
      </h4>
      <p>
        Once you have paid, and your payments has been confirmed by the NEM
        network, they will be totalled before presenting you with a download
        button (assuming your payments have met the price!).
      </p>
    </Fragment>
  );
};

export default ManualPayment;
