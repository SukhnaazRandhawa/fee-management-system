import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const DashboardPage = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <div>
      <h1>Welcome to your Dashboard, {user?.schoolName}!</h1>
      <button onClick={logout}>Log Out</button>
      {/* Dashboard content will go here */}
    </div>
  );
};

export default DashboardPage; 