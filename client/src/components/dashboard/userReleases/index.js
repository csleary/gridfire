import React, { useEffect, useState } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import FontAwesome from 'react-fontawesome';
import { Link } from 'react-router-dom';
import Spinner from 'components/spinner';
import UserRelease from './userRelease';
import axios from 'axios';
import { fetchUserReleases } from 'features/releases';
import styles from './userReleases.module.css';

function UserReleases() {
  const dispatch = useDispatch();
  const { userReleases } = useSelector(state => state.releases, shallowEqual);
  const [isLoading, setLoading] = useState(false);
  const [salesData, setSalesData] = useState();

  useEffect(() => {
    if (!userReleases.length) setLoading(true);
    dispatch(fetchUserReleases()).then(() => setLoading(false));
  }, [dispatch, userReleases.length]);

  useEffect(() => {
    const handleFetch = async () => {
      const res = await axios.get('/api/sales');
      setSalesData(res.data);
    };

    handleFetch();
  }, []);

  const releasesOffline = () => {
    if (!userReleases) return;
    const offline = userReleases.filter(release => release.published === false);
    return offline.length;
  };

  const renderUserReleases = () =>
    userReleases.map(release => {
      const sales = salesData?.find(sale => sale.releaseId === release._id);
      return <UserRelease key={release._id} numSold={sales?.purchases.length} release={release} />;
    });

  if (isLoading) {
    return (
      <Spinner>
        <h2>Loading releases&hellip;</h2>
      </Spinner>
    );
  }

  if (!userReleases.length) {
    return (
      <main className="container">
        <div className="row">
          <div className="col p-3">
            <h3 className="text-center mt-4">Add your first release</h3>
            <p className="text-center">
              You don&rsquo;t currently have any releases for sale. Please hit the button below to add your first
              release.
            </p>
            <div className="d-flex justify-content-center">
              <Link
                className={`${styles.addRelease} btn btn-outline-primary btn-sm mt-5 mb-4`}
                title="Add Release"
                role="button"
                to={'/release/add/'}
              >
                <FontAwesome name="plus-circle" className="mr-2" />
                Add Release
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container-fluid">
      <div className="row">
        <div className="col py-3">
          <h3 className="text-center">
            You have {userReleases.length} release
            {userReleases.length > 1 ? 's' : ''} {releasesOffline() ? ` (${releasesOffline()} offline)` : null}
          </h3>
          <ul className={styles.releases}>{renderUserReleases()}</ul>
          <Link
            className={`${styles.addRelease} btn btn-outline-primary btn-sm`}
            title="Add Release"
            role="button"
            to={'/release/add/'}
          >
            <FontAwesome name="plus-circle" className="mr-2" />
            Add Release
          </Link>
        </div>
      </div>
    </main>
  );
}

export default UserReleases;
