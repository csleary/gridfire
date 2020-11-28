import PropTypes from 'prop-types';
import React from 'react';
import styles from './catNumber.module.css';

const CatNumber = ({ catNumber }) => {
  if (!catNumber) return null;

  return (
    <h6>
      <span className={styles.label} title={'Catalogue number'}>
        Cat.:
      </span>{' '}
      {catNumber}
    </h6>
  );
};

CatNumber.propTypes = {
  catNumber: PropTypes.string
};

export default CatNumber;
