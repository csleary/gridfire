import FontAwesome from 'react-fontawesome';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import React from 'react';
import styles from './collectionIndicator.module.css';

const CollectionIndicator = ({ inCollection }) => {
  if (!inCollection) return null;

  return (
    <>
      <Link to={'/dashboard/collection'}>
        <div className={styles.collection} />
        <FontAwesome className={styles.check} name="check" title="This release is in your collection." />
      </Link>
    </>
  );
};

CollectionIndicator.propTypes = {
  inCollection: PropTypes.bool
};

export default CollectionIndicator;
