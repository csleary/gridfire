import React, { useState } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import FontAwesome from 'react-fontawesome';
import classnames from 'classnames';
import { saveToFavourites } from 'features/user';
import styles from './favButton.module.css';

const FavButton = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const { favourites } = useSelector(state => state.user, shallowEqual);
  const release = useSelector(state => state.releases.activeRelease, shallowEqual);
  const releaseId = release._id;
  const isInFaves = favourites?.some(rel => rel.releaseId === releaseId);
  const iconClassName = classnames(styles.icon, { [styles.saved]: isInFaves && !loading });

  return (
    <button
      className={styles.button}
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        await dispatch(saveToFavourites(releaseId));
        setLoading(false);
      }}
      title="Save to favourites."
    >
      <FontAwesome className={iconClassName} name={loading ? 'cog' : isInFaves ? 'heart' : 'heart-o'} spin={loading} />
      Fave
    </button>
  );
};

export default FavButton;
