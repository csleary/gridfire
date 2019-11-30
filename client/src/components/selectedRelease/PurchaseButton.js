import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import PurchaseButtonLabel from './PurchaseButtonLabel';
import React from 'react';
import styles from 'style/SelectedRelease.module.css';

const PurchaseButton = ({ inCollection, price, releaseId }) => (
  <div className="d-flex justify-content-center">
    <Link
      to={`/payment/${releaseId}`}
      className={`${styles.buy} btn btn-outline-primary`}
    >
      <PurchaseButtonLabel inCollection={inCollection} price={price} />
    </Link>
  </div>
);

PurchaseButton.propTypes = {
  inCollection: PropTypes.bool,
  price: PropTypes.number,
  releaseId: PropTypes.string
};

export default PurchaseButton;
