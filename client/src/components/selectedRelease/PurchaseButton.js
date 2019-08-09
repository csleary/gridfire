import { Link } from 'react-router-dom';
import PurchaseButtonLabel from './PurchaseButtonLabel';
import React from 'react';
import styles from '../../style/SelectedRelease.module.css';

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

export default PurchaseButton;
