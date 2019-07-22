import { Link } from 'react-router-dom';
import React from 'react';

const StatusIcon = ({ artist, artistName, releaseId, releaseTitle }) => {
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

export default StatusIcon;
