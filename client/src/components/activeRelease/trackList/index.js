import { playTrack, playerPlay } from 'features/player';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import FontAwesome from 'react-fontawesome';
import PropTypes from 'prop-types';
import React from 'react';
import styles from 'components/activeRelease/activeRelease.module.css';
import { toastInfo } from 'features/toast';

const TrackList = () => {
  const dispatch = useDispatch();
  const release = useSelector(state => state.releases.activeRelease, shallowEqual);
  const { isPlaying, isPaused, trackId: playerTrackId } = useSelector(state => state.player, shallowEqual);
  const { _id: releaseId, artistName, trackList } = release;

  return trackList.map(({ _id: trackId, trackTitle }) => {
    const nowPlaying = () => {
      if (trackId === playerTrackId && isPlaying) return <FontAwesome className={styles.nowPlaying} name="play" />;
      if (trackId === playerTrackId && isPaused) return <FontAwesome className={styles.nowPlaying} name="pause" />;
    };

    return (
      <li key={trackId}>
        <button
          className="btn btn-link"
          onClick={() => {
            if (trackId !== playerTrackId) {
              dispatch(playTrack({ releaseId, trackId, artistName, trackTitle }));
              dispatch(toastInfo(`Loading '${trackTitle}'`));
            } else if (!isPlaying) {
              const audioPlayer = document.getElementById('player');
              audioPlayer.play();
              dispatch(playerPlay());
              return;
            }
          }}
        >
          {trackTitle}
        </button>
        {nowPlaying()}
      </li>
    );
  });
};

TrackList.propTypes = {
  _id: PropTypes.string,
  artistName: PropTypes.string,
  player: PropTypes.object,
  release: PropTypes.object
};

export default TrackList;
