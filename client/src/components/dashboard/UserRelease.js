import React, { useState } from 'react';
import Artwork from './Artwork';
import FontAwesome from 'react-fontawesome';
import StatusIcon from './StatusIcon';
import Title from './Title';
import moment from 'moment';
import styles from '../../style/UserRelease.module.css';

function UserRelease(props) {
  const {
    deleteRelease,
    history,
    numSold,
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
        (releaseTitle && `\u2018${releaseTitle}\u2019`) || 'untitled release';

      toastWarning(`Deleting ${releaseName}…`);

      deleteRelease(releaseId, () => {
        toastSuccess(`Successfully deleted ${releaseName}.`);
      });
    });
  };

  const pleaseConfirm = (title, callback) => {
    const confirmation = window.confirm(
      `Are you sure you want to delete ${(title && `\u2018${title}\u2019`) ||
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
          ? toastWarning(`\u2018${releaseTitle}\u2019 has been taken offline.`)
          : toastSuccess(
            `\u2018${releaseTitle}\u2019 is now live and on sale.`
          );
      }
      setPublishingRelease(false);
    });
  };

  const audioCheck = () => {
    if (!trackList.length) return false;
    if (trackList.filter(el => el.hasAudio === false).length) return false;
    return true;
  };
  const hasAudio = audioCheck();

  return (
    <li
      className={`${styles.release} no-gutters d-flex flex-column`}
      key={releaseId}
    >
      <Artwork
        artistName={artistName}
        artwork={artwork}
        releaseId={releaseId}
        releaseTitle={releaseTitle}
      />
      <StatusIcon published={published} releaseTitle={releaseTitle} />
      <div className="d-flex flex-column flex-grow-1 p-3">
        <div className={`${styles.details} mb-3`}>
          <Title
            artist={artist}
            artistName={artistName}
            releaseId={releaseId}
            releaseTitle={releaseTitle}
          />
          <h6>
            <FontAwesome
              name="tag"
              className={`mr-2 ${price ? 'cyan' : 'yellow'}`}
            />
            {price ? `$${price} USD` : 'Name your price'}
          </h6>
          <h6>
            <FontAwesome name="calendar-o" className="mr-2 cyan" />
            {moment(new Date(releaseDate)).format('Do of MMM, YYYY')}
          </h6>
          <h6>
            <FontAwesome
              name="file-audio-o"
              className={`mr-2 ${hasAudio ? 'cyan' : 'red'}`}
            />
            {trackList.length} Track{trackList.length === 1 ? '' : 's'}
            {trackList.length && !hasAudio ? ' (incomplete)' : null}
          </h6>
          <h6>
            <FontAwesome
              name="line-chart"
              className={`mr-2 ${numSold ? 'cyan' : 'red'}`}
              title="Number of copies sold."
            />
            {numSold}{' '}
            {numSold
              ? `cop${numSold > 1 ? 'ies' : 'y'} sold`
              : 'None sold just yet'}
          </h6>
        </div>
        <div className={`${styles.buttons} d-flex mt-auto`}>
          <button
            onClick={() => history.push(`/release/edit/${releaseId}`)}
            className={`${styles.button} btn btn-outline-primary btn-sm`}
          >
            <FontAwesome name="pencil" className="mr-2" />
            Edit
          </button>
          <button
            disabled={isPublishingRelease}
            onClick={handlePublishStatus}
            className={`${styles.button} btn btn-outline-warning btn-sm${
              published ? '' : ` ${styles.unpublished}`
            }`}
          >
            {published ? (
              <>
                <FontAwesome name="eye-slash" className="mr-2" />
                Unpublish
              </>
            ) : (
              <>
                <FontAwesome name="eye" className="mr-2" />
                Publish
              </>
            )}
          </button>
          <button
            className={`${styles.button} btn btn-outline-danger btn-sm${
              isDeletingRelease ? ` ${styles.deleting}` : ''
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
