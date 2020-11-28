import React, { useState } from 'react';
import { addToWishList, removeFromWishList } from 'features/user';
import { faCog, faMagic } from '@fortawesome/free-solid-svg-icons';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classnames from 'classnames';
import styles from './wishListButton.module.css';
import { toastInfo } from 'features/toast';

const WishListButton = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const { auth, wishList } = useSelector(state => state.user, shallowEqual);
  const release = useSelector(state => state.releases.activeRelease, shallowEqual);
  const releaseId = release._id;
  const isInWishList = wishList?.some(item => item.release === releaseId);
  const iconClassName = classnames(styles.icon, { [styles.saved]: isInWishList && !loading });

  return (
    <button
      className={styles.button}
      disabled={loading}
      onClick={async () => {
        if (!auth) return dispatch(toastInfo('Please log in to save this track to your wish list.'));
        if (isInWishList) dispatch(removeFromWishList(releaseId));
        else {
          setLoading(true);
          await dispatch(addToWishList(releaseId));
          setLoading(false);
        }
      }}
      title="Save to wish list."
    >
      <FontAwesomeIcon className={iconClassName} icon={loading ? faCog : faMagic} spin={loading} />
      List
    </button>
  );
};

export default WishListButton;
