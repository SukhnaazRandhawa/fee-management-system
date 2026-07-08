import React, { useEffect, useState } from 'react';
import dashboardService from '../../services/dashboardService';

const LoginHistoryView = () => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                setLoading(true);
                const res = await dashboardService.getLoginHistory();
                setRecords(res.data);
                setError('');
            } catch (err) {
                setError(err.response?.data?.error || 'Failed to fetch login history.');
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div style={{ padding: '2rem' }}>
            <h2>Login History</h2>
            {records.length === 0 ? (
                <p>No login records yet.</p>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                        <thead>
                            <tr>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Date</th>
                                <th>First Login Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.map((r, i) => (
                                <tr key={i}>
                                    <td>{r.email}</td>
                                    <td>{r.role}</td>
                                    <td>{new Date(r.login_date).toLocaleDateString()}</td>
                                    <td>{new Date(r.first_login_at).toLocaleTimeString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default LoginHistoryView;
