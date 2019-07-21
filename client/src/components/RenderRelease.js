import React from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import FontAwesome from 'react-fontawesome';
import { CLOUD_URL } from '../index';
import placeholder from '../placeholder.svg';

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
          <button
            onClick={() => {
              props.fetchDownloadToken(releaseId, downloadToken => {
                if (downloadToken) {
                  props.toastInfo(
                    `Fetching download: ${artistName} - '${releaseTitle}'`
                  );
                  window.location = `/api/download/${downloadToken}`;
                }
              });
            }}
            title={`Download ${artistName} - '${releaseTitle}' (MP3)`}
          >
            <FontAwesome name="download" />
            <div className="label text-center">MP3</div>
          </button>
          <button
            onClick={() => {
              props.fetchDownloadToken(releaseId, downloadToken => {
                if (downloadToken) {
                  props.toastInfo(
                    `Fetching download: ${artistName} - '${releaseTitle}'`
                  );
                  window.location = `/api/download/${downloadToken}/flac`;
                }
              });
            }}
            title={`Download ${artistName} - '${releaseTitle}' (FLAC)`}
          >
            <FontAwesome name="download" />
            <div className="label text-center">FLAC</div>
          </button>
        </>
      );
    }
  };

  return (
    <div className="cover-artwork" key={releaseId} onTouchStart={() => {}}>
      <img
        alt={`${artistName} - ${releaseTitle}`}
        className="lazyload artwork"
        data-sizes="auto"
        data-src={artwork ? `${CLOUD_URL}/${releaseId}.jpg` : null}
      />
      <img
        alt={`${artistName} - ${releaseTitle}`}
        className="placeholder"
        src={placeholder}
      />
      <div
        className="artwork-overlay"
        title={`${artistName} - ${releaseTitle}`}
      >
        <Link
          className="artist-name"
          title={`Visit the artist page for ${artistName}`}
          to={`/artist/${artist}`}
        >
          {artistName}
        </Link>
        <div className="buttons">
          <button
            onClick={handlePlayTrack}
            title={`Play '${releaseTitle}', by ${artistName}`}
          >
            <FontAwesome name="play" />
          </button>
          <Link
            className="d-flex"
            title={`More information on '${releaseTitle}', by ${artistName}`}
            to={`/release/${releaseId}`}
          >
            <FontAwesome className="info m-auto" name="info-circle" />
          </Link>
          {showCollectionDownload()}
        </div>
        <Link
          className="release-title"
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
