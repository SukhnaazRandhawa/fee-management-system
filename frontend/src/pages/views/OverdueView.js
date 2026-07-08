import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import dashboardService from '../../services/dashboardService';
import reportService from '../../services/reportService';
import downloadFile from '../../utils/downloadFile';
import './DataTableView.css';

const OverdueView = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [sortAsc, setSortAsc] = useState(false);
    const [exporting, setExporting] = useState(false);
    const { role } = useContext(AuthContext);

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

    const handleExport = async () => {
        setExporting(true);
        try {
            const res = await reportService.getDuesCsv();
            downloadFile(res.data, 'overdue-students.csv');
        } catch (err) {
            alert('Failed to export CSV.');
        } finally {
            setExporting(false);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div className="data-table-view">
            <div className="controls-row" style={{ justifyContent: 'space-between' }}>
                <h2>Overdue Students</h2>
                {role === 'principal' && (
                    <button onClick={handleExport} disabled={exporting}>
                        {exporting ? 'Exporting...' : 'Export CSV'}
                    </button>
                )}
            </div>
            {sortedStudents.length === 0 ? (
                <p>No overdue students. Everyone is paid up!</p>
            ) : (
                <div className="table-scroll">
                    <table>
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
