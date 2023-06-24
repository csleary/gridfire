import { useLocation, useNavigate } from "react-router-dom";
import { ReactElement } from "react";
import { shallowEqual } from "react-redux";
import { useSelector } from "hooks";

const PrivateRoute = ({ children }: { children: ReactElement }) => {
  const navigate = useNavigate();
  const { user } = useSelector(state => state, shallowEqual);
  const location = useLocation();
  const { account, isLoading } = user;

  if (!isLoading && !account) {
    navigate("/login", { state: location });
    return null;
  }

  if (isLoading) return null;

  return children;
};

export default PrivateRoute;
