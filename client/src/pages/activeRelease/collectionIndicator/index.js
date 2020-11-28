import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import React from 'react';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import styles from './collectionIndicator.module.css';

const CollectionIndicator = ({ inCollection }) => {
  if (!inCollection) return null;

  return (
    <>
      <Link to={'/dashboard/collection'}>
        <div className={styles.collection} />
        <FontAwesomeIcon className={styles.check} icon={faCheck} title="This release is in your collection." />
      </Link>
    </>
  );
};

CollectionIndicator.propTypes = {
  inCollection: PropTypes.bool
};

export default CollectionIndicator;
