import React, { useState } from 'react';
import { deleteRelease, publishStatus } from 'features/releases';
import { faCircle, faCog, faHeart, faPencilAlt, faPlay } from '@fortawesome/free-solid-svg-icons';
import { faEye, faEyeSlash, faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import { toastSuccess, toastWarning } from 'features/toast';
import Artwork from './artwork';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import PropTypes from 'prop-types';
import StatusIcon from './statusIcon';
import Title from './title';
import classnames from 'classnames';
import moment from 'moment';
import styles from './userRelease.module.css';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';

function UserRelease({ favs, numSold, plays, release }) {
  const {
    _id: releaseId,
    artist,
    artistName,
    artwork,
    price,
    published,
    releaseDate,
    releaseTitle,
    trackList
  } = release;

  const dispatch = useDispatch();
  const history = useHistory();
  const [isDeletingRelease, setDeletingRelease] = useState(false);
  const [isPublishingRelease, setPublishingRelease] = useState(false);

  const handleDeleteRelease = async () => {
    setDeletingRelease(true);
    const confirmation = await pleaseConfirm(releaseTitle);
    if (!confirmation) return setDeletingRelease(false);
    const releaseName = releaseTitle ? `\u2018${releaseTitle}\u2019` : 'untitled release';
    dispatch(toastWarning(`Deleting ${releaseName}…`));
    dispatch(deleteRelease(releaseId, releaseName));
  };

  const pleaseConfirm = title =>
    new Promise(resolve => {
      const confirmation = window.confirm(
        `Are you sure you want to delete ${title ? `\u2018${title}\u2019` : 'this release'}?`
      );
      resolve(confirmation);
    });

  const handlePublishStatus = async () => {
    setPublishingRelease(true);
    const success = await dispatch(publishStatus(releaseId));
    if (success && published) dispatch(toastWarning(`\u2018${releaseTitle}\u2019 has been taken offline.`));
    else if (success) dispatch(toastSuccess(`\u2018${releaseTitle}\u2019 is now live and on sale.`));
    setPublishingRelease(false);
  };

  const hasAudio = !trackList.length || trackList.some(el => el.status !== 'stored') ? false : true;

  return (
    <li className={`${styles.release} no-gutters d-flex flex-column`} key={releaseId}>
      <Artwork artistName={artistName} artwork={artwork} releaseId={releaseId} releaseTitle={releaseTitle} />
      <StatusIcon published={published} releaseTitle={releaseTitle} />
      <div className="d-flex flex-column flex-grow-1 p-3">
        <Title artist={artist} artistName={artistName} favs={favs} releaseId={releaseId} releaseTitle={releaseTitle} />
        <div className={styles.columns}>
          <div className={styles.details}>
            <h6>
              <FontAwesomeIcon icon={faCircle} className={classnames(styles.price, { [styles.green]: price > 0 })} />
              {price > 0 ? `$${price} USD` : 'Name your price'}
            </h6>
            <h6>
              <FontAwesomeIcon
                icon={faCircle}
                className={classnames(styles.releaseDate, { [styles.yellow]: new Date(releaseDate) - Date.now() > 0 })}
              />
              {moment(new Date(releaseDate)).format('Do of MMM, YYYY')}
            </h6>
            <h6>
              <FontAwesomeIcon icon={faCircle} className={classnames(styles.audio, { [styles.green]: hasAudio })} />
              {trackList.length} Track{trackList.length === 1 ? '' : 's'}
              {trackList.length && !hasAudio ? ' (incomplete)' : null}
            </h6>
            <h6>
              <FontAwesomeIcon
                icon={faCircle}
                className={classnames(styles.sales, { [styles.green]: numSold })}
                title="Number of copies sold."
              />
              {`${numSold} Sold`}
            </h6>
          </div>
          <div className={styles.stats}>
            <h6 title="Total plays for this release.">
              {plays}
              <FontAwesomeIcon
                fixedWidth
                icon={faPlay}
                className={classnames(styles.plays, { [styles.green]: plays > 0 })}
              />
            </h6>
            <h6 title="Total favourites for this release.">
              {favs}
              <FontAwesomeIcon
                fixedWidth
                icon={faHeart}
                className={classnames(styles.favs, { [styles.red]: favs > 0 })}
              />
            </h6>
          </div>
        </div>
        <div className={styles.buttons}>
          <button onClick={() => history.push(`/release/${releaseId}/edit`)} className={styles.button}>
            <FontAwesomeIcon icon={faPencilAlt} className="mr-2" />
            Edit
          </button>
          <button
            disabled={isPublishingRelease}
            onClick={handlePublishStatus}
            className={classnames(styles.publishButton, { [styles.unpublished]: !published })}
          >
            {published ? (
              <>
                <FontAwesomeIcon icon={faEyeSlash} className="mr-2" />
                Unpublish
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faEye} className="mr-2" />
                Publish
              </>
            )}
          </button>
          <button
            className={classnames(styles.deleteButton, { [styles.deleting]: isDeletingRelease })}
            disabled={isDeletingRelease}
            onClick={handleDeleteRelease}
          >
            <FontAwesomeIcon icon={isDeletingRelease ? faCog : faTrashAlt} spin={isDeletingRelease} className="mr-2" />
            {isDeletingRelease ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </li>
  );
}

UserRelease.propTypes = {
  favs: PropTypes.number,
  numSold: PropTypes.number,
  plays: PropTypes.number,
  release: PropTypes.object
};

export default UserRelease;
