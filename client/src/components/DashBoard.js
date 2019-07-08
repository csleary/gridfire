import React, { Fragment } from 'react';
import { Route } from 'react-router-dom';
import Collection from './dashboard/Collection';
import NemAddress from './dashboard/NemAddress';
import PasswordUpdate from './dashboard/PasswordUpdate';
import UserReleases from './dashboard/UserReleases';
import '../style/dashboard.css';

function Dashboard(props) {
  return (
    <Fragment>
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
    </Fragment>
  );
}

export default Dashboard;
