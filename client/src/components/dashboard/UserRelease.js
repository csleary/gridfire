import React, { Fragment, useState } from 'react';
import { Link } from 'react-router-dom';
import FontAwesome from 'react-fontawesome';
import moment from 'moment';
import { CLOUD_URL } from '../../index';
import placeholder from '../../placeholder.svg';

function UserRelease(props) {
  const {
    deleteRelease,
    history,
    publishStatus,
    release: {
      _id,
      artist,
      artistName,
      artwork,
      price,
      published,
      releaseDate,
      releaseTitle,
      trackList
    },
    toastSuccess,
    toastWarning
  } = props;
  const releaseId = _id;

  const [isDeletingRelease, setDeletingRelease] = useState(false);
  const [isPublishingRelease, setPublishingRelease] = useState(false);

  const handleDeleteRelease = () => {
    setDeletingRelease(true);

    pleaseConfirm(releaseTitle, () => {
      const releaseName =
        (releaseTitle && `'${releaseTitle}'`) || 'untitled release';

      toastWarning(`Deleting ${releaseName}…`);

      deleteRelease(releaseId, () => {
        toastSuccess(`Successfully deleted ${releaseName}.`);
      });
    });
  };

  const handlePublishStatus = () => {
    setPublishingRelease(true);
    publishStatus(releaseId).then(success => {
      if (success) {
        published
          ? toastWarning(`'${releaseTitle}' has been taken offline.`)
          : toastSuccess(`'${releaseTitle}' is now live and on sale.`);
      }
      setPublishingRelease(false);
    });
  };

  const pleaseConfirm = (title, callback) => {
    const confirmation = window.confirm(
      `Are you sure you want to delete ${(title && `'${title}'`) ||
        'this release'}?`
    );
    if (confirmation) callback();
    else this.setState({ isDeletingRelease: false });
  };

  const renderTitle = () => {
    if (artistName) {
      return (
        <Fragment>
          <Link to={`/artist/${artist}`}>{artistName}</Link> &bull;{' '}
          <Link to={`/release/${_id}`}>
            <span className="ibm-type-italic">{releaseTitle}</span>
          </Link>
        </Fragment>
      );
    }
    return <Fragment>Untitled Release</Fragment>;
  };

  const numSold = props.numSold && (
    <h6>
      <FontAwesome
        name="line-chart"
        className="mr-2 red"
        title="Number of copies sold."
      />
      {props.numSold}
    </h6>
  );

  const statusIcon = published ? (
    <FontAwesome
      name="check-circle"
      className="cyan status-icon"
      title={`'${releaseTitle}' is live and available for purchase.`}
    />
  ) : (
    <FontAwesome
      name="exclamation-circle"
      className="yellow status-icon"
      title={`'${releaseTitle}' is currently offline.`}
    />
  );

  return (
    <li className="no-gutters d-flex flex-column release" key={releaseId}>
      {artwork ? (
        <div className="artwork">
          <Link to={`/release/${releaseId}`}>
            <img
              alt={artwork && `'${releaseTitle}' Artwork`}
              className="lazyload img-fluid"
              data-sizes="auto"
              data-src={artwork ? `${CLOUD_URL}/${releaseId}.jpg` : null}
            />
          </Link>
        </div>
      ) : (
        <Link to={`/release/${releaseId}`}>
          <h6 className="position-absolute m-3">
            <FontAwesome name="file-image-o" className="mr-2 red" />
            No artwork uploaded.
          </h6>
          <img
            alt={artwork && `'${releaseTitle}' Artwork`}
            className="img-fluid"
            src={placeholder}
          />
        </Link>
      )}
      <div className="status-icon-bg d-flex align-items-center justify-content-center">
        {statusIcon}
      </div>
      <div className="d-flex flex-column flex-grow-1 p-3">
        <div className="release-details mb-3">
          <h6>{renderTitle()}</h6>
          <h6>
            <FontAwesome name="tag" className="mr-2 red" />${price} USD
          </h6>
          <h6>
            <FontAwesome name="calendar-o" className="mr-2 red" />
            {moment(new Date(releaseDate)).format('Do of MMM, YYYY')}
          </h6>
          <h6>
            <FontAwesome name="file-audio-o" className="mr-2 red" />
            {trackList.length} Tracks
          </h6>
          {numSold}
        </div>
        <div className="release-button-group d-flex mt-auto">
          <button
            onClick={() => history.push(`/release/edit/${releaseId}`)}
            className="btn btn-outline-primary btn-sm"
          >
            <FontAwesome name="pencil" className="mr-2" />
            Edit
          </button>
          <button
            disabled={isPublishingRelease}
            onClick={handlePublishStatus}
            className="btn btn-outline-warning btn-sm"
          >
            {published ? (
              <Fragment>
                <FontAwesome name="eye-slash" className="mr-2" />
                Unpublish
              </Fragment>
            ) : (
              <Fragment>
                <FontAwesome name="eye" className="mr-2" />
                Publish
              </Fragment>
            )}
          </button>
          <button
            className="btn btn-outline-danger btn-sm"
            disabled={isDeletingRelease}
            onClick={handleDeleteRelease}
          >
            <FontAwesome name="trash" className="mr-2" />
            Delete
          </button>
        </div>
      </div>
    </li>
  );
}

export default UserRelease;
