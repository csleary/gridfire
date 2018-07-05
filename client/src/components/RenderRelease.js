import React from 'react';
import { Link } from 'react-router-dom';
import FontAwesome from 'react-fontawesome';

const RenderRelease = props => {
  const { release, variation } = props;

  return (
    <div className="cover-artwork" key={release._id} onTouchStart={() => {}}>
      <img
        alt={`${release.artistName} - ${release.releaseTitle}`}
        className="lazyload artwork"
        data-src={release.artwork ? release.artwork : null}
      />
      <div
        className="cover-artwork-overlay"
        title={`${release.artistName} - ${release.releaseTitle}`}
      >
        <div className="artist-name">
          <Link to={`/artist/${release._user}`}>{release.artistName}</Link>
        </div>
        <div className="buttons">
          <FontAwesome
            className="play"
            name="play"
            onClick={() => {
              props.playTrack(
                release._id,
                release.trackList[0]._id,
                release.artistName,
                release.trackList[0].trackTitle
              );
              props.fetchRelease(release._id);
              props.toastMessage({
                alertClass: 'alert-info',
                message: `Loading ${release.artistName} - '${
                  release.trackList[0].trackTitle
                }'`
              });
            }}
            title={`Play '${release.releaseTitle}', by ${release.artistName}`}
          />
          <Link to={`/release/${release._id}`}>
            <FontAwesome
              className="info"
              name="info-circle"
              title={`More information on '${release.releaseTitle}', by ${
                release.artistName
              }`}
            />
          </Link>
        </div>
        {variation === 'collection' && (
          <div className="buttons">
            <FontAwesome
              className="download"
              name="download"
              onClick={() => {
                props.fetchDownloadToken(release._id, downloadToken => {
                  if (downloadToken) {
                    props.toastMessage({
                      alertClass: 'alert-info',
                      message: `Fetching download: ${release.artistName} - '${
                        release.releaseTitle
                      }'`
                    });
                    window.location = `/api/download/${downloadToken}`;
                  }
                });
              }}
              title={`Download '${release.releaseTitle}', by ${
                release.artistName
              }`}
            />
          </div>
        )}
        <div className="release-title">
          <Link to={`/release/${release._id}`}>{release.releaseTitle}</Link>
        </div>
      </div>
    </div>
  );
};

export default RenderRelease;
