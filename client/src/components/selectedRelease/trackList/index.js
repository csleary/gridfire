import FontAwesome from 'react-fontawesome';
import PropTypes from 'prop-types';
import React from 'react';
import styles from 'components/selectedRelease/selectedRelease.module.css';

const TrackList = props => {
  const {
    release,
    release: { _id, artistName },
    player
  } = props;
  const releaseId = _id;
  const { isPlaying, isPaused } = player;

  return release.trackList.map(track => {
    const { trackTitle } = track;
    const trackId = track._id;
    const playerTrackId = player.trackId;

    const nowPlaying = () => {
      if (trackId !== playerTrackId) return;

      if (isPlaying) {
        return <FontAwesome className={styles.nowPlaying} name="play" />;
      }

      if (isPaused) {
        return <FontAwesome className={styles.nowPlaying} name="pause" />;
      }
    };

    return (
      <li key={trackId}>
        <button
          className="btn btn-link"
          onClick={() => {
            if (trackId !== playerTrackId) {
              props.playTrack(releaseId, trackId, artistName, trackTitle);
              props.nowPlayingToast(trackTitle);
            } else if (!isPlaying) {
              const audioPlayer = document.getElementById('player');
              audioPlayer.play();
              props.playerPlay();
              return;
            } else return;
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
