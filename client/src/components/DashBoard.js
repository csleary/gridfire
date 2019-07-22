import Collection from './dashboard/Collection';
import NemAddress from './dashboard/NemAddress';
import PasswordUpdate from './dashboard/PasswordUpdate';
import React from 'react';
import { Route } from 'react-router-dom';
import UserReleases from './dashboard/UserReleases';

function Dashboard(props) {
  return (
    <>
      <Route
        exact
        path={`${props.match.path}/collection`}
        component={Collection}
      />
      <Route
        exact
        path={`${props.match.path}/nem-address`}
        component={NemAddress}
      />
      <Route
        exact
        path={`${props.match.path}/password-update`}
        component={PasswordUpdate}
      />
      <Route exact path={props.match.path} component={UserReleases} />
    </>
  );
}

export default Dashboard;
