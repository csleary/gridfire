import { faCheckCircle, faQrcode } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import PropTypes from 'prop-types';
import React from 'react';

const PurchaseButtonLabel = ({ inCollection, price, priceError }) => {
  if (priceError)
    return (
      <>
        <FontAwesomeIcon icon={faQrcode} className="mr-2" />
        Unavailable
      </>
    );

  if (!price) {
    return (
      <>
        <FontAwesomeIcon icon={faQrcode} className="mr-2" />
        Name Your Price
      </>
    );
  }

  if (inCollection) {
    return (
      <>
        <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
        Transactions
      </>
    );
  }

  return (
    <>
      <FontAwesomeIcon icon={faQrcode} className="mr-2" />
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
