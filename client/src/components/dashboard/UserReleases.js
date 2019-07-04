import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import FontAwesome from 'react-fontawesome';
import Spinner from '../Spinner';
import UserRelease from './UserRelease';

import {
  deleteRelease,
  fetchSales,
  fetchUserReleases,
  publishStatus,
  toastSuccess,
  toastWarning
} from '../../actions';

function UserReleases(props) {
  const {
    deleteRelease,
    fetchSales,
    fetchUserReleases,
    history,
    publishStatus,
    toastSuccess,
    toastWarning,
    userReleases
  } = props;

  const [isLoading, setLoading] = useState(false);
  const [salesData, setSalesData] = useState();

  useEffect(
    () => {
      window.scrollTo(0, 0);
      if (!userReleases.length) {
        setLoading(true);
      }
      fetchUserReleases()
        .then(() => {
          fetchSales();
          setLoading(false);
        })
        .then(data => {
          setSalesData(data);
        });
    },
    [fetchUserReleases, fetchSales, userReleases.length]
  );

  const releasesOffline = () => {
    if (!userReleases) return;

    const offline = userReleases.filter(release => release.published === false);
    return offline.length;
  };

  const renderUserReleases = () =>
    userReleases.map(release => {
      const sales =
        salesData &&
        salesData.filter(datum => datum.releaseId === release._id)[0];

      let numSold;
      if (sales) {
        const total = sales.purchases.map(sale => sale.numSold);
        numSold = total.reduce((acc, el) => acc + el);
      }

      return (
        <UserRelease
          deleteRelease={deleteRelease}
          history={history}
          key={release._id}
          publishStatus={publishStatus}
          numSold={numSold}
          release={release}
          toastSuccess={toastSuccess}
          toastWarning={toastWarning}
          userReleases={userReleases}
        />
      );
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
              You don&rsquo;t currently have any releases for sale. Please hit
              the button below to add your first release.
            </p>
            <div className="d-flex justify-content-center">
              <Link
                className="btn btn-outline-primary btn-sm add-release mt-5 mb-4"
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
            {userReleases.length > 1 ? 's' : ''}{' '}
            {releasesOffline() ? ` (${releasesOffline()} offline)` : null}
          </h3>
          <ul className="user-releases">{renderUserReleases()}</ul>
          <Link
            className="btn btn-outline-primary btn-sm add-release"
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

function mapStateToProps(state) {
  return {
    salesData: state.salesData.releaseSales,
    userReleases: state.releases.userReleases
  };
}

export default connect(
  mapStateToProps,
  {
    deleteRelease,
    fetchSales,
    fetchUserReleases,
    publishStatus,
    toastSuccess,
    toastWarning
  }
)(UserReleases);
