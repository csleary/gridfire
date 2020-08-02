import React, { useEffect, useState } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import RenderRelease from 'components/renderRelease';
import Spinner from 'components/spinner';
import { fetchUserWishList } from 'features/releases';
import { grid } from './wishList.module.css';

const WishList = () => {
  const dispatch = useDispatch();
  const { userWishList } = useSelector(state => state.releases, shallowEqual);
  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    if (!userWishList.length) setLoading(true);
    dispatch(fetchUserWishList()).then(() => setLoading(false));
  }, [userWishList.length, dispatch]);

  const renderReleases = userWishList.map(release => <RenderRelease key={release._id} release={release} />);

  if (isLoading) {
    return (
      <Spinner>
        <h2>Loading wish list&hellip;</h2>
      </Spinner>
    );
  }

  if (!userWishList.length) {
    return (
      <main className="container">
        <div className="row">
          <div className="col">
            <h3 className="text-center mt-4">Wish list empty</h3>
            <p className="text-center">Something caught your ear? Save it here for later.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container-fluid">
      <div className="row">
        <div className="col py-3">
          <h3 className="text-center">Wish List</h3>
          <div className={grid}>{renderReleases}</div>
        </div>
      </div>
    </main>
  );
};

export default WishList;
