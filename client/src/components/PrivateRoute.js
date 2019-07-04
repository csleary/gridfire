import React from 'react';
import { connect } from 'react-redux';
import { Redirect, Route } from 'react-router-dom';

const PrivateRoute = ({ component: PrivateComponent, user, ...rest }) => (
  <Route
    {...rest}
    render={props => {
      if (user.auth !== undefined) {
        return <PrivateComponent {...props} />;
      }

      return (
        <Redirect
          to={{
            pathname: '/login',
            state: { from: props.location }
          }}
        />
      );
    }}
  />
);

function mapStateToProps(state) {
  return {
    user: state.user
  };
}

export default connect(mapStateToProps)(PrivateRoute);
