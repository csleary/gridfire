import FontAwesome from 'react-fontawesome';
import React from 'react';

const PurchaseButtonLabel = ({ inCollection, price }) => {
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

export default PurchaseButtonLabel;
