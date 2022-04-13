import { shallowEqual, useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import PropTypes from "prop-types";

const PrivateRoute = ({ children }) => {
  const { user } = useSelector(state => state, shallowEqual);
  const location = useLocation();
  const { account, isLoading } = user;

  if (!isLoading && !account) {
    return <Navigate to={"/login"} state={location} />;
  }

  if (isLoading) return null;

  return children;
};

PrivateRoute.propTypes = {
  children: PropTypes.element
};

export default PrivateRoute;
