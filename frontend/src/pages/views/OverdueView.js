import React, { useEffect, useState } from 'react';
import dashboardService from '../../services/dashboardService';

const OverdueView = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [sortAsc, setSortAsc] = useState(false);

    useEffect(() => {
        const fetchOverdue = async () => {
            try {
                setLoading(true);
                const res = await dashboardService.getOverdueStudents();
                setStudents(res.data);
                setError('');
            } catch (err) {
                setError('Failed to fetch overdue students.');
            } finally {
                setLoading(false);
            }
        };
        fetchOverdue();
    }, []);

    const sortedStudents = [...students].sort((a, b) => {
        const diff = parseFloat(a.amount_overdue) - parseFloat(b.amount_overdue);
        return sortAsc ? diff : -diff;
    });

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div style={{ padding: '2rem' }}>
            <h2>Overdue Students</h2>
            {sortedStudents.length === 0 ? (
                <p>No overdue students. Everyone is paid up!</p>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                        <thead>
                            <tr>
                                <th>Student ID</th>
                                <th>Name</th>
                                <th>Class</th>
                                <th>Father's Name</th>
                                <th>Mother's Name</th>
                                <th>Phone</th>
                                <th>Email</th>
                                <th style={{ cursor: 'pointer' }} onClick={() => setSortAsc(!sortAsc)}>
                                    Amount Overdue {sortAsc ? '▲' : '▼'}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedStudents.map(s => (
                                <tr key={s.id}>
                                    <td>{s.student_id}</td>
                                    <td>{s.name}</td>
                                    <td>{s.class_name}</td>
                                    <td>{s.father_name}</td>
                                    <td>{s.mother_name}</td>
                                    <td>{s.phone}</td>
                                    <td>{s.email || '-'}</td>
                                    <td>${s.amount_overdue}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default OverdueView;
