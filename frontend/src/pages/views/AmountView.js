import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import dashboardService from '../../services/dashboardService';
import './AmountView.css';

const AmountView = () => {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { role } = useContext(AuthContext);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                setLoading(true);
                const response = await dashboardService.getSummary();
                setSummary(response.data);
                setError(null);
            } catch (err) {
                setError('Failed to fetch summary data.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchSummary();
    }, []);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div className="amount-view">
            <h2>Dashboard</h2>
            <div className="summary-cards">
                <div className="summary-card">
                    <h3>Total Students</h3>
                    <p>{summary?.totalStudents}</p>
                </div>
                <div className="summary-card">
                    <h3>Total Amount Collected Today</h3>
                    <p>${summary?.totalCollectedToday}</p>
                    {summary?.todayCollectionByMethod && (
                        <div style={{ fontSize: '1rem', marginTop: '0.5rem' }}>
                            <div>Cash: <strong>${summary.todayCollectionByMethod.Cash}</strong></div>
                            <div>Online: <strong>${summary.todayCollectionByMethod.Online}</strong></div>
                            <div>Cheque: <strong>${summary.todayCollectionByMethod.Cheque}</strong></div>
                        </div>
                    )}
                </div>
                {role === 'principal' && summary?.currentMonthCollection !== undefined && (
                    <div className="summary-card">
                        <h3>{summary.currentMonthName ? `${summary.currentMonthName}'s Collection` : "Current Month's Collection"}</h3>
                        <p>${summary?.currentMonthCollection}</p>
                    </div>
                )}
                {role === 'principal' && (
                    <div className="summary-card">
                        <h3>{summary.academicYearString ? `${summary.academicYearString} Collection` : 'Current Academic Year Collection'}</h3>
                        <p>${summary?.currentAcademicYearCollection}</p>
                    </div>
                )}
                {role === 'principal' && (
                    <div className="summary-card">
                        <h3>Total Due</h3>
                        <p>${summary?.totalDue}</p>
                    </div>
                )}
            </div>
            <div className="students-paid-today">
                <h3>List of Students Paid Today</h3>
                {summary?.studentsPaidToday.length > 0 ? (
                    <ul>
                        {summary.studentsPaidToday.map((payment, index) => (
                            <li key={index}>
                                {payment.name} - ${payment.amount_paid}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No payments received today.</p>
                )}
            </div>
        </div>
    );
};

export default AmountView; 