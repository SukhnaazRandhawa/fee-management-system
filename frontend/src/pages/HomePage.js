import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div>
      <h1>Welcome to Fee Management</h1>
      <nav>
        <Link to="/signup">
          <button>Sign Up</button>
        </Link>
        <Link to="/login">
          <button>Already have an account? Log In</button>
        </Link>
      </nav>
    </div>
  );
};

export default HomePage; 