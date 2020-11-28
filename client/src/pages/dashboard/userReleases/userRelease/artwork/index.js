import { CLOUD_URL } from 'index';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import React from 'react';
import { faFile } from '@fortawesome/free-regular-svg-icons';
import placeholder from 'placeholder.svg';
import styles from './artwork.module.css';

const Artwork = ({ artistName, artwork, releaseId, releaseTitle }) => {
  if (artwork.status === 'stored') {
    return (
      <Link className={styles.art} to={`/release/${releaseId}`}>
        <img
          alt={`\u2018${releaseTitle}\u2019 Artwork`}
          className={`${styles.image} lazyload`}
          data-sizes="auto"
          data-src={`${CLOUD_URL}/${releaseId}.jpg`}
        />
        <img alt={`${artistName} - ${releaseTitle}`} className={styles.placeholder} src={placeholder} />
      </Link>
    );
  }

  return (
    <>
      <Link className={styles.art} to={`/release/${releaseId}`}>
        <h6 className="position-absolute m-3">
          <FontAwesomeIcon icon={faFile} className="mr-2 red" />
          No artwork uploaded.
        </h6>
        <img alt={artwork && `'${releaseTitle}' Artwork`} className={styles.image} src={placeholder} />
      </Link>
    </>
  );
};

Artwork.propTypes = {
  artistName: PropTypes.string,
  artwork: PropTypes.object,
  releaseId: PropTypes.string,
  releaseTitle: PropTypes.string
};

export default Artwork;
