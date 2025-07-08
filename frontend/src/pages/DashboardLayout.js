import axios from 'axios';
import React, { useContext } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './DashboardLayout.css';

const DashboardLayout = () => {
    const { user, logout, role } = useContext(AuthContext);
    const navigate = useNavigate();
    const [showConfirm, setShowConfirm] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [message, setMessage] = React.useState('');
    const [showPopup, setShowPopup] = React.useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleStartSession = async () => {
        setLoading(true);
        setMessage('');
        try {
            await axios.post('http://localhost:5050/api/dashboard/rollover', {}, {
                headers: { Authorization: 'Bearer ' + JSON.parse(localStorage.getItem('user'))?.token }
            });
            setMessage('New session started successfully!');
            setShowPopup(true);
        } catch (err) {
            setMessage('Failed to start new session.');
        }
        setLoading(false);
        setShowConfirm(false);
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
                    <Link to="viewfeehistory">View Fee History</Link>
                </nav>
                {role === 'principal' && (
                    <button style={{ marginRight: '1rem', background: '#e67e22', color: 'white' }}
                        onClick={() => setShowConfirm(true)}
                        disabled={loading}
                    >
                        Start New Session
                    </button>
                )}
                <button onClick={handleLogout}>Log Out</button>
            </header>
            {showConfirm && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: 8, minWidth: 320 }}>
                        <h3>Are you sure you want to start a new session?</h3>
                        <p>This will archive all current data and clear classes for the new year.</p>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button onClick={handleStartSession} disabled={loading} style={{ background: '#27ae60', color: 'white' }}>Yes</button>
                            <button onClick={() => setShowConfirm(false)} disabled={loading}>No</button>
                        </div>
                    </div>
                </div>
            )}
            {showPopup && (
                <div className="popup-overlay">
                    <div className="popup-content">
                        <button className="popup-close" onClick={() => { setShowPopup(false); setMessage(''); }}>×</button>
                        <div className={message.includes('success') ? 'popup-success' : 'popup-error'}>
                            {message}
                        </div>
                    </div>
                </div>
            )}
            <hr />
            <main>
                <Outlet /> {/* Nested dashboard content will be rendered here */}
            </main>
        </div>
    );
};

export default DashboardLayout; 