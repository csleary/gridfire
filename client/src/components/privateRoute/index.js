import { Redirect, Route } from 'react-router-dom';
import PropTypes from 'prop-types';
import React from 'react';
import { useSelector } from 'react-redux';

const PrivateRoute = ({ component: PrivateComponent, ...rest }) => {
  const { user } = useSelector(state => state);

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
