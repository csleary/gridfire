import { useLocation, useNavigate } from "react-router-dom";
import { ReactElement } from "react";
import { useSelector } from "hooks";

const PrivateRoute = ({ children }: { children: ReactElement }) => {
  const navigate = useNavigate();
  const account = useSelector(state => state.user.account);
  const isLoading = useSelector(state => state.user.isLoading);
  const location = useLocation();

  if (!isLoading && !account) {
    navigate("/login", { state: location });
    return null;
  }

  if (isLoading) return null;

  return children;
};

export default PrivateRoute;
