import React, { Fragment, useState } from 'react';
import FontAwesome from 'react-fontawesome';
import moment from 'moment';
import Artwork from './Artwork';
import StatusIcon from './StatusIcon';
import Title from './Title';

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

  const pleaseConfirm = (title, callback) => {
    const confirmation = window.confirm(
      `Are you sure you want to delete ${(title && `'${title}'`) ||
        'this release'}?`
    );
    if (confirmation) callback();
    else setDeletingRelease(false);
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

  return (
    <li className="no-gutters d-flex flex-column release" key={releaseId}>
      <Artwork
        artwork={artwork}
        releaseId={releaseId}
        releaseTitle={releaseTitle}
      />
      <StatusIcon published={published} releaseTitle={releaseTitle} />
      <div className="d-flex flex-column flex-grow-1 p-3">
        <div className="release-details mb-3">
          <Title
            artist={artist}
            artistName={artistName}
            releaseId={releaseId}
            releaseTitle={releaseTitle}
          />
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
            className={`btn btn-outline-danger btn-sm${
              isDeletingRelease ? ' deleting' : ''
            }`}
            disabled={isDeletingRelease}
            onClick={handleDeleteRelease}
          >
            {isDeletingRelease ? (
              <>
                <FontAwesome name="cog" spin className="mr-2" />
                Deleting…
              </>
            ) : (
              <>
                <FontAwesome name="trash" className="mr-2" />
                Delete
              </>
            )}
          </button>
        </div>
      </div>
    </li>
  );
}

export default UserRelease;
