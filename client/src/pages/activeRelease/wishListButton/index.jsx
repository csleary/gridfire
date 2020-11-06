import React, { useState } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import FontAwesome from 'react-fontawesome';
import classnames from 'classnames';
import { saveToWishList } from 'features/user';
import styles from './wishListButton.module.css';
import { toastInfo } from 'features/toast';

const WishListButton = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const { auth, wishList } = useSelector(state => state.user, shallowEqual);
  const release = useSelector(state => state.releases.activeRelease, shallowEqual);
  const releaseId = release._id;
  const isInWishList = wishList?.some(rel => rel.releaseId === releaseId);
  const iconClassName = classnames(styles.icon, { [styles.saved]: isInWishList && !loading });

  return (
    <button
      className={styles.button}
      disabled={loading}
      onClick={async () => {
        if (!auth) return dispatch(toastInfo('Please log in to save this track to your wish list.'));
        setLoading(true);
        await dispatch(saveToWishList(releaseId));
        setLoading(false);
      }}
      title="Save to wish list."
    >
      <FontAwesome className={iconClassName} name={loading ? 'cog' : 'magic'} spin={loading} />
      List
    </button>
  );
};

export default WishListButton;
