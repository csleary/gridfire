import { CLOUD_URL } from '../../index';
import FontAwesome from 'react-fontawesome';
import React from 'react';
import placeholder from '../../placeholder.svg';
import styles from '../../style/SelectedRelease.module.css';

const Artwork = props => {
  const {
    isPlaying,
    nowPlayingToast,
    playerReleaseId,
    release,
    release: { artistName, artwork, releaseTitle, trackList }
  } = props;

  const releaseId = release._id;

  const handlePlayRelease = () => {
    const audioPlayer = document.getElementById('player');

    if (isPlaying && playerReleaseId === releaseId) {
      audioPlayer.pause();
      props.playerPause();
    } else if (playerReleaseId === releaseId) {
      audioPlayer.play();
      props.playerPlay();
    } else {
      props.playTrack(
        releaseId,
        trackList[0]._id,
        artistName,
        trackList[0].trackTitle
      );
      nowPlayingToast(trackList[0].trackTitle);
    }
  };

  return (
    <div className={styles.artwork} onTouchStart={() => {}}>
      <img
        alt={releaseTitle}
        className={`${styles.image} lazyload img-fluid`}
        data-src={artwork ? `${CLOUD_URL}/${releaseId}.jpg` : null}
      />
      <img
        alt={`${artistName} - ${releaseTitle}`}
        className={styles.placeholder}
        src={placeholder}
      />
      <div
        className={styles.overlay}
        onClick={handlePlayRelease}
        role="button"
        tabIndex="-1"
        title={`${artistName} - ${releaseTitle}`}
      >
        {isPlaying && releaseId === playerReleaseId ? (
          <FontAwesome className="" name="pause" />
        ) : (
          <FontAwesome className={styles.play} name="play" />
        )}
      </div>
    </div>
  );
};

export default Artwork;
