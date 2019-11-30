import { Redirect, Route } from 'react-router-dom';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

const PrivateRoute = ({ component: PrivateComponent, user, ...rest }) => (
  <Route
    {...rest}
    render={props => {
      if (user.auth === undefined) {
        return (
          <Redirect
            to={{
              pathname: '/login',
              state: { from: props.location }
            }}
          />
        );
      }
      return <PrivateComponent {...props} />;
    }}
  />
);

function mapStateToProps(state) {
  return {
    user: state.user
  };
}

PrivateRoute.propTypes = {
  component: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  user: PropTypes.object,
  auth: PropTypes.object,
  location: PropTypes.object
};

export default connect(mapStateToProps)(PrivateRoute);
