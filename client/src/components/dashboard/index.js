import Collection from './collection';
import NemAddress from './nemAddress';
import PasswordUpdate from './passwordUpdate';
import PropTypes from 'prop-types';
import React from 'react';
import { Route } from 'react-router-dom';
import UserReleases from './userReleases';

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
