import React from 'react';
import { Link } from 'react-router-dom';
import FontAwesome from 'react-fontawesome';

const RenderRelease = props => {
  const { release, variation } = props;
  const { artist, artistName, _id, releaseTitle, artwork, trackList } = release;

  return (
    <div className="cover-artwork" key={release._id} onTouchStart={() => {}}>
      <img
        alt={`${artistName} - ${releaseTitle}`}
        className="lazyload artwork"
        data-sizes="auto"
        data-src={artwork || null}
        src="data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="
      />
      <div
        className="cover-artwork-overlay"
        title={`${artistName} - ${releaseTitle}`}
      >
        <div className="artist-name">
          <Link to={`/artist/${artist}`}>{artistName}</Link>
        </div>
        <div className="buttons">
          <FontAwesome
            className="play"
            name="play"
            onClick={() => {
              props.playTrack(
                _id,
                trackList[0]._id,
                artistName,
                trackList[0].trackTitle
              );
              props.fetchRelease(_id);
              props.toastInfo(
                `Loading ${artistName} - '${trackList[0].trackTitle}'`
              );
            }}
            title={`Play '${releaseTitle}', by ${artistName}`}
          />
          <Link to={`/release/${_id}`}>
            <FontAwesome
              className="info"
              name="info-circle"
              title={`More information on '${releaseTitle}', by ${artistName}`}
            />
          </Link>
        </div>
        {variation === 'collection' && (
          <div className="buttons">
            <FontAwesome
              className="download"
              name="download"
              onClick={() => {
                props.fetchDownloadToken(_id, downloadToken => {
                  if (downloadToken) {
                    props.toastInfo(
                      `Fetching download: ${artistName} - '${releaseTitle}'`
                    );
                    window.location = `/api/download/${downloadToken}`;
                  }
                });
              }}
              title={`Download '${releaseTitle}', by ${artistName}`}
            />
          </div>
        )}
        <div className="release-title">
          <Link to={`/release/${_id}`}>{releaseTitle}</Link>
        </div>
      </div>
    </div>
  );
};

export default RenderRelease;
