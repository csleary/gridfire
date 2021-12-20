import React, { useState } from 'react';
import { deleteRelease, publishStatus } from 'features/releases';
import { faCircle, faCog, faHeart, faPencilAlt, faPlay } from '@fortawesome/free-solid-svg-icons';
import { faEye, faEyeSlash, faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { toastSuccess, toastWarning } from 'features/toast';
import Artwork from './artwork';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import PropTypes from 'prop-types';
import StatusIcon from './statusIcon';
import Title from './title';
import classnames from 'classnames';
import moment from 'moment';
import { setReleaseIdsForDeletion } from 'features/releases';
import styles from './userRelease.module.css';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
  const { releaseIdsForDeletion } = useSelector(state => state.releases, shallowEqual);
  const [isPublishingRelease, setPublishingRelease] = useState(false);

  const cancelDeleteTrack = id => {
    dispatch(setReleaseIdsForDeletion({ releaseId: id, isDeleting: false }));
  };

  const handleDeleteRelease = () => {
    const releaseName = releaseTitle ? `\u2018${releaseTitle}\u2019` : 'release';
    dispatch(deleteRelease(releaseId, releaseName));
  };

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
              <FontAwesomeIcon className={classnames(styles.price, { [styles.green]: price > 0 })} icon={faCircle} />
              {price > 0 ? `$${price} USD` : 'Name your price'}
            </h6>
            <h6>
              <FontAwesomeIcon
                className={classnames(styles.releaseDate, { [styles.yellow]: new Date(releaseDate) - Date.now() > 0 })}
                icon={faCircle}
              />
              {moment(new Date(releaseDate)).format('Do of MMM, YYYY')}
            </h6>
            <h6>
              <FontAwesomeIcon className={classnames(styles.audio, { [styles.green]: hasAudio })} icon={faCircle} />
              {trackList.length} Track{trackList.length === 1 ? '' : 's'}
              {trackList.length && !hasAudio ? ' (incomplete)' : null}
            </h6>
            <h6>
              <FontAwesomeIcon
                className={classnames(styles.sales, { [styles.green]: numSold })}
                icon={faCircle}
                title="Number of copies sold."
              />
              {numSold} Sold
            </h6>
          </div>
          <div className={styles.stats}>
            <h6 title="Total plays for this release.">
              {plays}
              <FontAwesomeIcon
                className={classnames(styles.plays, { [styles.green]: plays > 0 })}
                fixedWidth
                icon={faPlay}
              />
            </h6>
            <h6 title="Total favourites for this release.">
              {favs}
              <FontAwesomeIcon
                className={classnames(styles.favs, { [styles.red]: favs > 0 })}
                fixedWidth
                icon={faHeart}
              />
            </h6>
          </div>
        </div>
        <div className={styles.buttons}>
          <button onClick={() => navigate(`/release/${releaseId}/edit`)} className={styles.button}>
            <FontAwesomeIcon className="mr-2" icon={faPencilAlt} />
            Edit
          </button>
          <button
            className={classnames(styles.publishButton, { [styles.unpublished]: !published })}
            disabled={isPublishingRelease}
            onClick={handlePublishStatus}
          >
            <FontAwesomeIcon
              className="mr-2"
              icon={isPublishingRelease ? faCog : published ? faEyeSlash : faEye}
              spin={isPublishingRelease}
            />
            {published ? 'Unpublish' : 'Publish'}
          </button>
          <button
            className={classnames(styles.deleteButton, { [styles.deleting]: releaseIdsForDeletion[releaseId] })}
            onBlur={() => cancelDeleteTrack(releaseId)}
            onClick={handleDeleteRelease}
            onKeyUp={({ key }) => (key === 'Escape') & cancelDeleteTrack(releaseId)}
          >
            <FontAwesomeIcon icon={faTrashAlt} className="mr-2" />
            {releaseIdsForDeletion[releaseId] ? 'Confirm!' : 'Delete'}
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
