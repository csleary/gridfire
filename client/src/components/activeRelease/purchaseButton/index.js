import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import PurchaseButtonLabel from './purchaseButtonLabel';
import React from 'react';
import classnames from 'classnames';
import styles from './purchaseButton.module.css';

const PurchaseButton = ({ inCollection, price, priceError, releaseId }) => {
  const buttonClassName = classnames('btn', 'btn-outline-primary', {
    [styles.buy]: !priceError,
    [styles.disabled]: priceError
  });

  return (
    <div className="d-flex justify-content-center">
      <Link
        to={priceError ? '#' : `/release/${releaseId}/payment`}
        className={buttonClassName}
      >
        <PurchaseButtonLabel
          inCollection={inCollection}
          price={price}
          priceError={priceError}
        />
      </Link>
    </div>
  );
};

PurchaseButton.propTypes = {
  inCollection: PropTypes.bool,
  price: PropTypes.number,
  priceError: PropTypes.object,
  releaseId: PropTypes.string
};

export default PurchaseButton;
