import { shallowEqual, useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import React from 'react';

const PrivateRoute = ({ children }) => {
  const { user } = useSelector(state => state, shallowEqual);
  const { auth, isLoading } = user;

  if (!isLoading && !auth) {
    return <Navigate to={'/login'} />;
  }

  if (isLoading) return null;

  return children;
};

PrivateRoute.propTypes = {
  children: PropTypes.element
};

export default PrivateRoute;
