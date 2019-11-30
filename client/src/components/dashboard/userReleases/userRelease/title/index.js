import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import React from 'react';

const Title = ({ artist, artistName, releaseId, releaseTitle }) => {
  if (artistName) {
    return (
      <h6>
        <Link to={`/artist/${artist}`}>{artistName}</Link> &bull;{' '}
        <Link to={`/release/${releaseId}`}>
          <span className="ibm-type-italic">{releaseTitle}</span>
        </Link>
      </h6>
    );
  }
  return <h6>Untitled Release</h6>;
};

Title.propTypes = {
  artist: PropTypes.string,
  artistName: PropTypes.string,
  releaseId: PropTypes.string,
  releaseTitle: PropTypes.string
};

export default Title;
