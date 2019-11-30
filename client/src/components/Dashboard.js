import Collection from './dashboard/Collection';
import NemAddress from './dashboard/NemAddress';
import PasswordUpdate from './dashboard/PasswordUpdate';
import PropTypes from 'prop-types';
import React from 'react';
import { Route } from 'react-router-dom';
import UserReleases from './dashboard/UserReleases';

function Dashboard({ match }) {
  return (
    <>
      <Route exact path={`${match.path}/collection`} component={Collection} />
      <Route exact path={`${match.path}/nem-address`} component={NemAddress} />
      <Route
        exact
        path={`${match.path}/password-update`}
        component={PasswordUpdate}
      />
      <Route exact path={match.path} component={UserReleases} />
    </>
  );
}

Dashboard.propTypes = {
  match: PropTypes.object
};

export default Dashboard;
