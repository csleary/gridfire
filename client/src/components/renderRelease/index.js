import { batch, shallowEqual, useDispatch, useSelector } from 'react-redux';
import { faInfoCircle, faPause, faPlay } from '@fortawesome/free-solid-svg-icons';
import { playTrack, playerPause, playerPlay } from 'features/player';
import { CLOUD_URL } from 'index';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from 'react-router-dom';
import OverlayDownloadButton from './overlayDownloadButton';
import PropTypes from 'prop-types';
import React from 'react';
import classnames from 'classnames';
import { fetchRelease } from 'features/releases';
import placeholder from 'placeholder.svg';
import styles from './renderRelease.module.css';
import { toastInfo } from 'features/toast';
import withDownload from 'pages/payment/payments/withDownload';

const DownloadButton = withDownload(OverlayDownloadButton);

const RenderRelease = ({ className, release, showArtist = true, showTitle = true, type }) => {
  const dispatch = useDispatch();
  const { isPlaying, releaseId: playerReleaseId } = useSelector(state => state.player, shallowEqual);

  if (!release) {
    return (
      <div className={classnames(styles.art, { [className]: Boolean(className) })}>
        <img alt={'Release unavailable.'} className={styles.image} src={placeholder} />
        <div className={styles.unavailable}>Release not available</div>
      </div>
    );
  }

  const { _id: releaseId, artist, artistName, artwork = {}, releaseTitle, trackList } = release;

  const handlePlayTrack = () => {
    const audioPlayer = document.getElementById('player');

    if (isPlaying && playerReleaseId === releaseId) {
      audioPlayer.pause();
      dispatch(playerPause());
    } else if (playerReleaseId === releaseId) {
      audioPlayer.play();
      dispatch(playerPlay());
    } else {
      const [{ _id: trackId, trackTitle }] = trackList;

      batch(() => {
        dispatch(playTrack({ releaseId, trackId, artistName, trackTitle }));
        dispatch(fetchRelease(releaseId));
        dispatch(toastInfo(`Loading ${artistName} - '${trackTitle}'`));
      });
    }
  };

  return (
    <div
      className={classnames(styles.art, { [className]: Boolean(className) })}
      key={releaseId}
      onTouchStart={() => {}}
    >
      <img
        alt={`${artistName} - ${releaseTitle}`}
        className={`${styles.image} lazyload`}
        data-sizes="auto"
        data-src={artwork.status === 'stored' ? `${CLOUD_URL}/${releaseId}.jpg` : placeholder}
      />
      <img alt={`${artistName} - ${releaseTitle}`} className={styles.placeholder} src={placeholder} />
      <div className={styles.overlay} title={`${artistName} - ${releaseTitle}`}>
        {showArtist ? (
          <Link
            className={styles.artistName}
            title={`Visit the artist page for ${artistName}`}
            to={`/artist/${artist}`}
          >
            {artistName}
          </Link>
        ) : null}
        <div className={styles.buttons}>
          <button
            className={styles.button}
            onClick={handlePlayTrack}
            title={`Play '${releaseTitle}', by ${artistName}`}
          >
            <FontAwesomeIcon
              className={styles.icon}
              icon={isPlaying && releaseId === playerReleaseId ? faPause : faPlay}
            />
          </button>
          <Link
            className={styles.button}
            title={`More information on '${releaseTitle}', by ${artistName}`}
            to={`/release/${releaseId}`}
          >
            <FontAwesomeIcon className={`${styles.icon} info m-auto`} icon={faInfoCircle} />
          </Link>
          {type === 'collection' ? (
            <>
              <DownloadButton artistName={artistName} format="mp3" releaseId={releaseId} releaseTitle={releaseTitle} />
              <DownloadButton artistName={artistName} format="flac" releaseId={releaseId} releaseTitle={releaseTitle} />
            </>
          ) : null}
        </div>
        {showTitle ? (
          <Link
            className={styles.releaseTitle}
            title={`More information on '${releaseTitle}', by ${artistName}`}
            to={`/release/${releaseId}`}
          >
            {releaseTitle}
          </Link>
        ) : null}
      </div>
    </div>
  );
};

RenderRelease.propTypes = {
  className: PropTypes.string,
  release: PropTypes.object,
  showArtist: PropTypes.bool,
  showTitle: PropTypes.bool,
  type: PropTypes.string
};

export default RenderRelease;
