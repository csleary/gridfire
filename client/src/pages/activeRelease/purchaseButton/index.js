import Button from 'components/button';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import React from 'react';
import classnames from 'classnames';
import styles from './purchaseButton.module.css';

const PurchaseButton = ({ inCollection, price, priceError, releaseId }) => {
  const buttonClassName = classnames({
    [styles.buy]: !priceError,
    [styles.disabled]: priceError
  });

  return (
    <div className="d-flex justify-content-center">
      <Link to={priceError ? '#' : `/release/${releaseId}/payment`}>
        <Button className={buttonClassName} disabled={priceError} icon={inCollection ? 'check-circle' : 'qrcode'}>
          {priceError ? 'Unavailable' : !price ? 'Name Your Price' : inCollection ? 'Transactions' : 'Purchase'}
        </Button>
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
