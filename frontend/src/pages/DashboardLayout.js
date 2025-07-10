import axios from 'axios';
import React, { useContext, useEffect, useRef, useState } from 'react';
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
    const [currentSession, setCurrentSession] = useState('');
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef();

    useEffect(() => {
        const fetchSession = async () => {
            try {
                const res = await axios.get('http://localhost:5050/api/dashboard/session', {
                    headers: { Authorization: 'Bearer ' + JSON.parse(localStorage.getItem('user'))?.token }
                });
                setCurrentSession(res.data.currentSession);
            } catch {
                setCurrentSession('');
            }
        };
        fetchSession();
    }, []);

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
            // Refetch session after rollover
            const res = await axios.get('http://localhost:5050/api/dashboard/session', {
                headers: { Authorization: 'Bearer ' + JSON.parse(localStorage.getItem('user'))?.token }
            });
            setCurrentSession(res.data.currentSession);
        } catch (err) {
            setMessage(err.response?.data?.error || 'Failed to start new session.');
            setShowPopup(true);
        }
        setLoading(false);
        setShowConfirm(false);
    };

    // Close menu if clicked outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div>
            <header className="dashboard-header">
                <div className="dashboard-header-content">
                    <div className="dashboard-header-left"></div>
                    <div className="dashboard-header-center">
                        <span className="school-name">{user?.schoolName}</span>
                    </div>
                    <nav className="dashboard-header-nav">
                        <Link to="classes">Classes</Link>
                        <Link to="amount">Amount</Link>
                        <Link to="register">Register</Link>
                        <Link to="payfee">Pay Fee</Link>
                        <Link to="viewfeehistory">View Fee History</Link>
                        <div className="menu-trigger" onClick={() => setMenuOpen((v) => !v)}>
                            <span className="vertical-dots">&#8942;</span>
                        </div>
                        {menuOpen && (
                            <div className="menu-popup" ref={menuRef}>
                                {role === 'principal' && (
                                    <button onClick={() => { setShowConfirm(true); setMenuOpen(false); }}>Start New Session</button>
                                )}
                                <button onClick={handleLogout}>Log Out</button>
                            </div>
                        )}
                    </nav>
                </div>
                <div className="dashboard-header-session">
                    Current Session: {currentSession || 'Loading...'}
                </div>
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