import { shallowEqual, useSelector } from 'react-redux';
import FontAwesome from 'react-fontawesome';
import PropTypes from 'prop-types';
import React from 'react';
import styles from './playButton.module.css';

const PlayButton = ({ isReady, playAudio }) => {
  const { isPlaying } = useSelector(state => state.player, shallowEqual);

  if (!isReady) {
    return <FontAwesome name="cog" spin className={`${styles.playerButton} ${styles.waiting}`} />;
  }

  if (isPlaying) {
    return <FontAwesome name="pause" className={styles.playerButton} onClick={playAudio} />;
  }

  return <FontAwesome name="play" className={styles.playerButton} onClick={playAudio} />;
};

PlayButton.propTypes = {
  isReady: PropTypes.bool,
  playAudio: PropTypes.func
};

export default PlayButton;
