import React, { useState } from 'react';
import { addToFavourites, removeFromFavourites } from 'features/user';
import { faCog, faHeart } from '@fortawesome/free-solid-svg-icons';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classnames from 'classnames';
import { faHeart as heartOutline } from '@fortawesome/free-regular-svg-icons';
import styles from './favButton.module.css';
import { toastInfo } from 'features/toast';

const FavButton = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const { auth, favourites } = useSelector(state => state.user, shallowEqual);
  const release = useSelector(state => state.releases.activeRelease, shallowEqual);
  const releaseId = release._id;
  const isInFaves = favourites?.some(item => item.release === releaseId);
  const iconClassName = classnames(styles.icon, { [styles.saved]: isInFaves && !loading });

  return (
    <button
      className={styles.button}
      disabled={loading}
      onClick={async () => {
        if (!auth) return dispatch(toastInfo('Please log in to save this track to your favourites.'));
        if (isInFaves) dispatch(removeFromFavourites(releaseId));
        else {
          setLoading(true);
          await dispatch(addToFavourites(releaseId));
          setLoading(false);
        }
      }}
      title="Save to favourites."
    >
      <FontAwesomeIcon
        className={iconClassName}
        icon={loading ? faCog : isInFaves ? faHeart : heartOutline}
        spin={loading}
      />
      Fave
    </button>
  );
};

export default FavButton;
