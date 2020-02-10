import FontAwesome from 'react-fontawesome';
import PropTypes from 'prop-types';
import React from 'react';

const PurchaseButtonLabel = ({ inCollection, price, priceError }) => {
  if (priceError)
    return (
      <>
        <FontAwesome name="qrcode" className="mr-2" />
        Unavailable
      </>
    );

  if (!price) {
    return (
      <>
        <FontAwesome name="qrcode" className="mr-2" />
        Name Your Price
      </>
    );
  }

  if (inCollection) {
    return (
      <>
        <FontAwesome name="check-circle" className="mr-2" />
        Transactions
      </>
    );
  }

  return (
    <>
      <FontAwesome name="qrcode" className="mr-2" />
      Purchase
    </>
  );
};

PurchaseButtonLabel.propTypes = {
  inCollection: PropTypes.bool,
  price: PropTypes.number,
  priceError: PropTypes.object
};

export default PurchaseButtonLabel;
