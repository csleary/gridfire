import React, { useEffect, useState } from 'react';
import ConfirmPayment from './confirmPayment';
import CreditsPayment from './creditsPayment';
import PropTypes from 'prop-types';
import SelectCredits from './selectCredits';
import axios from 'axios';
import classnames from 'classnames';
import styles from './purchaseCredits.module.css';

const PurchaseCredits = ({ setShowPaymentModal }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [sku, setSku] = useState('01NPC');
  const [currentStage, setStage] = useState(1);
  const [paymentData, setPaymentData] = useState({});
  const [productData, setProductData] = useState([]);

  useEffect(() => {
    if (currentStage === 1) {
      setIsLoading(true);
      axios('/api/user/credits/purchase')
        .then(res => setProductData(res.data))
        .finally(() => setIsLoading(false));
    }
  }, [currentStage]);

  return (
    <div className={classnames(styles.container, 'container-lg')}>
      <h2 className={styles.heading}>Buy Credits</h2>
      {currentStage === 1 ? (
        <SelectCredits
          productData={productData}
          isLoading={isLoading}
          sku={sku}
          setSku={setSku}
          setShowPaymentModal={setShowPaymentModal}
          setStage={setStage}
        />
      ) : currentStage === 2 ? (
        <CreditsPayment
          paymentData={paymentData}
          productData={productData}
          sku={sku}
          setShowPaymentModal={setShowPaymentModal}
          setPaymentData={setPaymentData}
          setStage={setStage}
        />
      ) : currentStage === 3 ? (
        <ConfirmPayment
          paymentData={paymentData}
          sku={sku}
          setShowPaymentModal={setShowPaymentModal}
          setStage={setStage}
        />
      ) : null}
    </div>
  );
};

PurchaseCredits.propTypes = {
  setShowPaymentModal: PropTypes.func
};

export default PurchaseCredits;
