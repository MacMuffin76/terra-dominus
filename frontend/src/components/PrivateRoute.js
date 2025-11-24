import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  const { token, isAuthenticated } = useSelector((state) => state.auth);
  const storedToken = localStorage.getItem('jwtToken');
  const location = useLocation();

  if (!token && !storedToken && !isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};

export default PrivateRoute;