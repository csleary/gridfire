import React from 'react';
import { Link } from 'react-router-dom';
import FontAwesome from 'react-fontawesome';
import { CLOUD_URL } from '../../index';
import placeholder from '../../placeholder.svg';

const Artwork = ({ artwork, releaseId, releaseTitle }) => {
  if (artwork) {
    return (
      <div className="artwork">
        <Link to={`/release/${releaseId}`}>
          <img
            alt={artwork && `'${releaseTitle}' Artwork`}
            className="lazyload img-fluid"
            data-sizes="auto"
            data-src={artwork ? `${CLOUD_URL}/${releaseId}.jpg` : null}
          />
        </Link>
      </div>
    );
  }

  return (
    <div className="artwork">
      <h6 className="position-absolute m-3">
        <FontAwesome name="file-image-o" className="mr-2 red" />
        No artwork uploaded.
      </h6>
      <Link to={`/release/${releaseId}`}>
        <img
          alt={artwork && `'${releaseTitle}' Artwork`}
          className="img-fluid"
          src={placeholder}
        />
      </Link>
    </div>
  );
};

export default Artwork;
