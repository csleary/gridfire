import React, { Fragment } from 'react';
import { connect } from 'react-redux';
import { Route } from 'react-router-dom';
import Collection from './dashboard/Collection';
import DashNavbar from './dashboard/DashNavbar';
import NemAddress from './dashboard/NemAddress';
import PasswordUpdate from './dashboard/PasswordUpdate';
import UserReleases from './dashboard/UserReleases';
import { addNemAddress, toastSuccess, toastWarning } from '../actions';
import '../style/dashboard.css';

function Dashboard(props) {
  const handleSubmit = values => {
    props.addNemAddress(values).then(res => {
      if (res.error) return;

      if (!values.nemAddress) {
        props.toastWarning('NEM payment address removed.');
      } else {
        props.toastSuccess('NEM payment address saved.');
      }
    });
  };

  return (
    <Fragment>
      <DashNavbar />
      <Route
        exact
        path={`${props.match.path}/collection`}
        component={Collection}
      />
      <Route
        exact
        path={`${props.match.path}/nem-address`}
        render={() => <NemAddress onSubmit={handleSubmit} />}
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

export default connect(
  null,
  { addNemAddress, toastSuccess, toastWarning }
)(Dashboard);
