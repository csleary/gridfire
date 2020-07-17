import { Redirect, Route } from 'react-router-dom';
import { shallowEqual, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import React from 'react';

const PrivateRoute = ({ component: PrivateComponent, ...rest }) => {
  const { user } = useSelector(state => state, shallowEqual);

  return (
    <Route
      {...rest}
      render={props => {
        if (!user.auth) {
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
};

PrivateRoute.propTypes = {
  component: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  location: PropTypes.object
};

export default PrivateRoute;
