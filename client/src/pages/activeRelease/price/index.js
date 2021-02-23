import PropTypes from 'prop-types';
import React from 'react';
import TextSpinner from 'components/textSpinner';
import styles from './price.module.css';

const Price = ({ price, priceError, xemPriceUsd }) => {
  if (priceError) {
    return <h6 className={styles.price}>{`$${price} USD`}</h6>;
  }

  if (price === 0) {
    return <h6 className={styles.price}>Name Your Price</h6>;
  }

  if (xemPriceUsd) {
    const priceInXem = price / xemPriceUsd;
    return <h6 className={styles.price}>{`$${price} USD (~${priceInXem.toFixed(2)} XEM)`}</h6>;
  }

  return (
    <h6 className={styles.price}>
      ${price} USD (XEM
      <TextSpinner />)
    </h6>
  );
};

Price.propTypes = {
  price: PropTypes.number,
  priceError: PropTypes.string,
  xemPriceUsd: PropTypes.number
};

export default Price;
