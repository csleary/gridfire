import { Link, useLocation } from 'react-router-dom';
import { shallowEqual, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import React from 'react';
import styles from './trackInfo.module.css';

const TrackInfo = ({ isReady }) => {
  const location = useLocation();
  const { releaseId, artistName, trackTitle } = useSelector(state => state.player, shallowEqual);
  if (!isReady) return <span>Loading&hellip;</span>;

  if (location.pathname !== `/release/${releaseId}`) {
    return (
      <Link to={`/release/${releaseId}`}>
        {artistName} &bull; <em>{trackTitle}</em>
      </Link>
    );
  }

  return (
    <span className={styles.noLink}>
      {artistName} &bull; <em>{trackTitle}</em>
    </span>
  );
};

TrackInfo.propTypes = {
  isReady: PropTypes.bool
};

export default TrackInfo;
