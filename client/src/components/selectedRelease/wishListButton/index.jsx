import React, { useState } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import FontAwesome from 'react-fontawesome';
import classnames from 'classnames';
import { saveToWishList } from 'features/user';
import styles from './wishListButton.module.css';

const WishListButton = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const { wishList } = useSelector(state => state.user, shallowEqual);
  const release = useSelector(state => state.releases.selectedRelease, shallowEqual);
  const releaseId = release._id;
  const isInWishList = wishList?.some(id => id === releaseId);
  const iconClassName = classnames(styles.icon, { [styles.saved]: isInWishList && !loading });

  return (
    <button
      className={styles.button}
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        await dispatch(saveToWishList(releaseId));
        setLoading(false);
      }}
      title="Save to wish list."
    >
      <FontAwesome className={iconClassName} name={loading ? 'cog' : 'magic'} spin={loading} />
      {isInWishList ? 'Saved' : 'Add'}
    </button>
  );
};

export default WishListButton;
