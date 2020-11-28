import { faCog, faPause, faPlay } from '@fortawesome/free-solid-svg-icons';
import { shallowEqual, useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import PropTypes from 'prop-types';
import React from 'react';
import styles from './playButton.module.css';

const PlayButton = ({ isReady, playAudio }) => {
  const { isPlaying } = useSelector(state => state.player, shallowEqual);

  if (!isReady) {
    return <FontAwesomeIcon icon={faCog} spin className={`${styles.playerButton} ${styles.waiting}`} />;
  }

  if (isPlaying) {
    return <FontAwesomeIcon icon={faPause} className={styles.playerButton} onClick={playAudio} />;
  }

  return <FontAwesomeIcon icon={faPlay} className={styles.playerButton} onClick={playAudio} />;
};

PlayButton.propTypes = {
  isReady: PropTypes.bool,
  playAudio: PropTypes.func
};

export default PlayButton;
