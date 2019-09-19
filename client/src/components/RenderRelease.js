import { CLOUD_URL } from '../index';
import FontAwesome from 'react-fontawesome';
import { Link } from 'react-router-dom';
import OverlayDownloadButton from './OverlayDownloadButton';
import React from 'react';
import { connect } from 'react-redux';
import placeholder from '../placeholder.svg';
import styles from '../style/RenderRelease.module.css';
import withDownload from './payment/payments/withDownload';

const DownloadButton = withDownload(OverlayDownloadButton);

const RenderRelease = props => {
  const { player, release, variation } = props;
  const { _id, artist, artistName, artwork, releaseTitle, trackList } = release;
  const releaseId = _id;

  const handlePlayTrack = () => {
    if (player.trackId === trackList[0]._id) return;

    props.playTrack(
      releaseId,
      trackList[0]._id,
      artistName,
      trackList[0].trackTitle
    );
    props.fetchRelease(releaseId);
    props.toastInfo(`Loading ${artistName} - '${trackList[0].trackTitle}'`);
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

function mapStateToProps(state) {
  return {
    player: state.player
  };
}

export default connect(mapStateToProps)(RenderRelease);
