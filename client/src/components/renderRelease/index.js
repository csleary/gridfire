import { fetchRelease, playTrack, toastInfo } from 'actions';
import { useDispatch, useSelector } from 'react-redux';
import { CLOUD_URL } from 'index';
import FontAwesome from 'react-fontawesome';
import { Link } from 'react-router-dom';
import OverlayDownloadButton from './overlayDownloadButton';
import PropTypes from 'prop-types';
import React from 'react';
import placeholder from 'placeholder.svg';
import styles from './renderRelease.module.css';
import withDownload from 'components/payment/payments/withDownload';

const DownloadButton = withDownload(OverlayDownloadButton);

const RenderRelease = props => {
  const { release, variation } = props;
  const { player } = useSelector(state => state);
  const dispatch = useDispatch();
  const { _id, artist, artistName, artwork, releaseTitle, trackList } = release;
  const releaseId = _id;

  const handlePlayTrack = () => {
    if (player.trackId === trackList[0]._id) return;

    dispatch(
      playTrack(
        releaseId,
        trackList[0]._id,
        artistName,
        trackList[0].trackTitle
      )
    );

    dispatch(fetchRelease(releaseId));
    dispatch(toastInfo(`Loading ${artistName} - '${trackList[0].trackTitle}'`));
  };

  const showCollectionDownload = () => {
    if (variation === 'collection') {
      return (
        <>
          <DownloadButton
            artistName={artistName}
            format="mp3"
            releaseId={releaseId}
            releaseTitle={releaseTitle}
          />
          <DownloadButton
            artistName={artistName}
            format="flac"
            releaseId={releaseId}
            releaseTitle={releaseTitle}
          />
        </>
      );
    }
  };

  return (
    <div className={styles.art} key={releaseId} onTouchStart={() => {}}>
      <img
        alt={`${artistName} - ${releaseTitle}`}
        className={`${styles.image} lazyload`}
        data-sizes="auto"
        data-src={artwork ? `${CLOUD_URL}/${releaseId}.jpg` : null}
      />
      <img
        alt={`${artistName} - ${releaseTitle}`}
        className={styles.placeholder}
        src={placeholder}
      />
      <div className={styles.overlay} title={`${artistName} - ${releaseTitle}`}>
        <Link
          className={styles.artistName}
          title={`Visit the artist page for ${artistName}`}
          to={`/artist/${artist}`}
        >
          {artistName}
        </Link>
        <div className={styles.buttons}>
          <button
            className={styles.button}
            onClick={handlePlayTrack}
            title={`Play '${releaseTitle}', by ${artistName}`}
          >
            <FontAwesome className={styles.icon} name="play" />
          </button>
          <Link
            className={`${styles.button} d-flex`}
            title={`More information on '${releaseTitle}', by ${artistName}`}
            to={`/release/${releaseId}`}
          >
            <FontAwesome
              className={`${styles.icon} info m-auto`}
              name="info-circle"
            />
          </Link>
          {showCollectionDownload()}
        </div>
        <Link
          className={styles.releaseTitle}
          title={`More information on '${releaseTitle}', by ${artistName}`}
          to={`/release/${releaseId}`}
        >
          {releaseTitle}
        </Link>
      </div>
    </div>
  );
};

RenderRelease.propTypes = {
  release: PropTypes.object,
  variation: PropTypes.string
};

export default RenderRelease;
