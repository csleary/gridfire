import PropTypes from 'prop-types';
import React from 'react';
import styles from './price.module.css';

const Price = ({ price }) => {
  return <h6 className={styles.price}>${price} USD</h6>;
};

Price.propTypes = {
  price: PropTypes.number
};

export default Price;
