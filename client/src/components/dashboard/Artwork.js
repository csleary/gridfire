import { CLOUD_URL } from '../../index';
import FontAwesome from 'react-fontawesome';
import { Link } from 'react-router-dom';
import React from 'react';
import placeholder from '../../placeholder.svg';

const Artwork = ({ artistName, artwork, releaseId, releaseTitle }) => {
  if (artwork) {
    return (
      <Link className="artwork" to={`/release/${releaseId}`}>
        <img
          alt={artwork && `'${releaseTitle}' Artwork`}
          className="lazyload img-fluid"
          data-sizes="auto"
          data-src={artwork ? `${CLOUD_URL}/${releaseId}.jpg` : null}
        />
        <img
          alt={`${artistName} - ${releaseTitle}`}
          className="placeholder"
          src={placeholder}
        />
      </Link>
    );
  }

  return (
    <>
      <Link className="artwork" to={`/release/${releaseId}`}>
        <h6 className="position-absolute m-3">
          <FontAwesome name="file-image-o" className="mr-2 red" />
          No artwork uploaded.
        </h6>
        <img
          alt={artwork && `'${releaseTitle}' Artwork`}
          className="img-fluid"
          src={placeholder}
        />
      </Link>
    </>
  );
};

export default Artwork;
