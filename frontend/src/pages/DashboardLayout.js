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
                const apiUrl = process.env.REACT_APP_API_URL;
                const res = await fetch(`${apiUrl}/api/dashboard/session`, {
                    headers: { Authorization: 'Bearer ' + JSON.parse(localStorage.getItem('user'))?.token }
                });
                const data = await res.json();
                setCurrentSession(data.currentSession);
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
            const apiUrl = process.env.REACT_APP_API_URL;
            const res = await fetch(`${apiUrl}/api/dashboard/rollover`, {
                method: 'POST',
                headers: { Authorization: 'Bearer ' + JSON.parse(localStorage.getItem('user'))?.token }
            });
            const data = await res.json();
            if (!res.ok) {
                // Show backend error message
                setMessage(data.error || data.message || 'Failed to start new session.');
                setShowPopup(true);
            } else {
                setMessage('New session started successfully!');
                setShowPopup(true);
                // Refetch session after rollover
                const sessionRes = await fetch(`${apiUrl}/api/dashboard/session`, {
                    headers: { Authorization: 'Bearer ' + JSON.parse(localStorage.getItem('user'))?.token }
                });
                const sessionData = await sessionRes.json();
                setCurrentSession(sessionData.currentSession);
            }
        } catch (err) {
            setMessage('Failed to start new session.');
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
        <div className="dashboard-container">
            <aside className="sidebar">
                <Link to="/" className="sidebar-logo">Billora</Link>
                <nav className="sidebar-nav">
                    <Link to="classes">Classes</Link>
                    <Link to="amount">Dashboard</Link>
                    <Link to="register">Register</Link>
                    <Link to="payfee">Pay Fee</Link>
                    <Link to="viewfeehistory">View Fee History</Link>
                </nav>
            </aside>
            <main className="main-content">
                <header className="main-header">
                    <div>
                        <h2 className="school-title">{user?.schoolName}</h2>
                        <div className="session-label">Current Session : {currentSession || 'Loading...'}</div>
                    </div>
                    <div className="main-menu" onClick={() => setMenuOpen((v) => !v)}>
                        <span className="vertical-dots">&#8942;</span>
                        {menuOpen && (
                            <div className="menu-popup" ref={menuRef}>
                                {role === 'principal' && (
                                    <button onClick={() => { setShowConfirm(true); setMenuOpen(false); }}>Start New Session</button>
                                )}
                                <button onClick={handleLogout}>Log Out</button>
                            </div>
                        )}
                    </div>
                </header>
                <div className="main-body">
                    <Outlet />
                </div>
            </main>
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
                        {message.includes('success') ? (
                            <div className="popup-success">
                                <span className="icon">✔️</span>
                                {message}
                            </div>
                        ) : (
                            <div className="popup-error">
                                <span className="icon">❌</span>
                                {message}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardLayout; 