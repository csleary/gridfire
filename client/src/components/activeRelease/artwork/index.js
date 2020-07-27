import { playTrack, playerPause, playerPlay } from 'features/player';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { CLOUD_URL } from 'index';
import FontAwesome from 'react-fontawesome';
import React from 'react';
import placeholder from 'placeholder.svg';
import styles from 'components/activeRelease/activeRelease.module.css';
import { toastInfo } from 'features/toast';

const Artwork = () => {
  const dispatch = useDispatch();
  const release = useSelector(state => state.releases.activeRelease, shallowEqual);
  const { isPlaying, releaseId: playerReleaseId } = useSelector(state => state.player, shallowEqual);
  const { _id: releaseId, artistName, artwork, releaseTitle, trackList } = release;

  const handlePlayRelease = () => {
    const audioPlayer = document.getElementById('player');

    if (isPlaying && playerReleaseId === releaseId) {
      audioPlayer.pause();
      dispatch(playerPause());
    } else if (playerReleaseId === releaseId) {
      audioPlayer.play();
      dispatch(playerPlay());
    } else {
      const [{ _id: trackId, trackTitle }] = trackList;
      dispatch(playTrack({ releaseId, trackId, artistName, trackTitle }));
      dispatch(toastInfo(`Loading '${trackTitle}'`));
    }
  };

  return (
    <div className={styles.artwork} onTouchStart={() => {}}>
      <img
        alt={releaseTitle}
        className={`${styles.image} lazyload img-fluid`}
        data-src={
          artwork.status === 'stored'
            ? `${CLOUD_URL}/${releaseId}.jpg`
            : 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
        }
      />
      <img alt={`${artistName} - ${releaseTitle}`} className={styles.placeholder} src={placeholder} />
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
