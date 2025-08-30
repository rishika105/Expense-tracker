import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const OpenRoute = ({ children }) => {
  const { token, isVerified } = useSelector((state) => state.auth);

  if (token !== null) {
    // if profile not set up → go to profile setup
    if (!isVerified) {
      return <Navigate to="/profile-setup" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default OpenRoute;
