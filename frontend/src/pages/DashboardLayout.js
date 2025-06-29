import React, { useContext } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const DashboardLayout = () => {
    const { user, logout, role } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div>
            <header>
                <h2>{user?.schoolName}</h2>
                <nav>
                    <Link to="classes">Classes</Link>
                    <Link to="amount">Amount</Link>
                    <Link to="register">Register</Link>
                    <Link to="payfee">Pay Fee</Link>
                </nav>
                <button onClick={handleLogout}>Log Out</button>
            </header>
            <hr />
            <main>
                <Outlet /> {/* Nested dashboard content will be rendered here */}
            </main>
        </div>
    );
};

export default DashboardLayout; 