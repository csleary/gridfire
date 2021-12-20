import { shallowEqual, useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import React from 'react';

const PrivateRoute = ({ children }) => {
  const { user } = useSelector(state => state, shallowEqual);

  if (!user.auth) {
    return <Navigate to={'/login'} />;
  }

  return children;
};

PrivateRoute.propTypes = {
  children: PropTypes.element,
  redirectTo: PropTypes.string
};

export default PrivateRoute;
