import React, { useState } from 'react';
import { deleteRelease, publishStatus } from 'features/releases';
import { toastSuccess, toastWarning } from 'features/toast';
import Artwork from './artwork';
import FontAwesome from 'react-fontawesome';
import PropTypes from 'prop-types';
import StatusIcon from './statusIcon';
import Title from './title';
import classnames from 'classnames';
import moment from 'moment';
import styles from './userRelease.module.css';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';

function UserRelease({ favs, numSold, release }) {
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

  const hasAudio = () => {
    if (!trackList.length) return false;
    if (trackList.filter(el => el.status !== 'stored').length) return false;
    return true;
  };

  const publishButtonClassName = classnames(styles.publishButton, { [styles.unpublished]: !published });
  const deleteButtonClassName = classnames(styles.deleteButton, { [styles.deleting]: isDeletingRelease });

  return (
    <li className={`${styles.release} no-gutters d-flex flex-column`} key={releaseId}>
      <Artwork artistName={artistName} artwork={artwork} releaseId={releaseId} releaseTitle={releaseTitle} />
      <StatusIcon published={published} releaseTitle={releaseTitle} />
      <div className="d-flex flex-column flex-grow-1 p-3">
        <Title artist={artist} artistName={artistName} favs={favs} releaseId={releaseId} releaseTitle={releaseTitle} />
        <div className={styles.columns}>
          <div className={styles.details}>
            <h6>
              <FontAwesome name="circle" className={`mr-2 ${price ? 'cyan' : 'yellow'}`} />
              {price ? `$${price} USD` : 'Name your price'}
            </h6>
            <h6>
              <FontAwesome
                name="circle"
                className={`mr-2 ${Date.now() - new Date(releaseDate) > 0 ? 'green' : 'yellow'}`}
              />
              {moment(new Date(releaseDate)).format('Do of MMM, YYYY')}
            </h6>
            <h6>
              <FontAwesome name="circle" className={`mr-2 ${hasAudio ? 'green' : 'red'}`} />
              {trackList.length} Track{trackList.length === 1 ? '' : 's'}
              {trackList.length && !hasAudio ? ' (incomplete)' : null}
            </h6>
            <h6>
              <FontAwesome
                name="circle"
                className={`mr-2 ${numSold ? 'green' : 'red'}`}
                title="Number of copies sold."
              />
              {numSold} {numSold ? `cop${numSold > 1 ? 'ies' : 'y'} sold` : 'No sales yet'}
            </h6>
          </div>
          <div className={styles.stats}>
            <h6>
              <FontAwesome
                name="heart"
                className={styles.favs}
                title="Number of users who have favourited this release."
              />
              {favs ?? 0}
            </h6>
          </div>
        </div>
        <div className={styles.buttons}>
          <button onClick={() => history.push(`/release/${releaseId}/edit`)} className={styles.button}>
            <FontAwesome name="pencil" className="mr-2" />
            Edit
          </button>
          <button disabled={isPublishingRelease} onClick={handlePublishStatus} className={publishButtonClassName}>
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
          <button className={deleteButtonClassName} disabled={isDeletingRelease} onClick={handleDeleteRelease}>
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

UserRelease.propTypes = {
  favs: PropTypes.number,
  numSold: PropTypes.number,
  release: PropTypes.object
};

export default UserRelease;
