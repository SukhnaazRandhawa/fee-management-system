import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import classService from '../services/classService';
import paymentService from '../services/paymentService';
import studentService from '../services/studentService';
import './ClassDetailsPage.css';

const fetchData = async (classId, setClassDetails, setStudents, setPayments, setError, setLoading) => {
    try {
        setLoading(true);
        const [classRes, studentsRes, paymentsRes] = await Promise.all([
            classService.getClassById(classId),
            studentService.getStudentsByClass(classId),
            paymentService.getPaymentsByClass(classId),
        ]);
        setClassDetails(classRes.data);
        setStudents(studentsRes.data);
        setPayments(paymentsRes.data);
        setError(null);
    } catch (err) {
        setError('Failed to fetch class data.');
        console.error(err);
    } finally {
        setLoading(false);
    }
};

const ClassDetailsPage = () => {
    const { classId } = useParams();
    const [classDetails, setClassDetails] = useState(null);
    const [students, setStudents] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showImportModal, setShowImportModal] = useState(false);
    const [prevClasses, setPrevClasses] = useState([]);
    const [prevClassId, setPrevClassId] = useState('');
    const [prevStudents, setPrevStudents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [importLoading, setImportLoading] = useState(false);
    const [importError, setImportError] = useState('');
    const [importSuccess, setImportSuccess] = useState('');
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [editError, setEditError] = useState('');

    useEffect(() => {
        fetchData(classId, setClassDetails, setStudents, setPayments, setError, setLoading);
    }, [classId]);

    const academicYearMonths = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

    const processedStudentData = useMemo(() => {
        if (!classDetails || students.length === 0) return [];
        
        return students.map(student => {
            const studentPayments = payments.filter(p => p.student_id === student.id);
            const totalPaid = studentPayments.reduce((sum, p) => sum + parseFloat(p.amount_paid), 0);
            
            const annualFee = parseFloat(classDetails.annual_fee);
            const monthlyFee = parseFloat(classDetails.monthly_fee);

            let allocatedPayment = totalPaid;
            
            const annualPaid = Math.min(allocatedPayment, annualFee);
            allocatedPayment -= annualPaid;

            const monthlyPaid = academicYearMonths.map(() => {
                const paidThisMonth = Math.min(allocatedPayment, monthlyFee);
                allocatedPayment -= paidThisMonth;
                return paidThisMonth;
            });

            const currentDate = new Date();
            const currentMonth = currentDate.getMonth(); // 0-11
            const academicSessionStartYear = currentMonth < 3 ? currentDate.getFullYear() - 1 : currentDate.getFullYear();

            let annualStatus;
            const april1st = new Date(academicSessionStartYear, 3, 1);
            if (annualPaid >= annualFee) {
                annualStatus = { text: `$${annualFee.toFixed(2)}`, className: 'paid' };
            } else if (currentDate >= april1st) {
                annualStatus = { text: 'Unpaid', className: 'unpaid' };
            } else {
                annualStatus = { text: 'Upcoming', className: '' };
            }

            const monthlyStatus = academicYearMonths.map((monthName, index) => {
                const monthDate = new Date(academicSessionStartYear + (index >= 9 ? 1 : 0), (index + 3) % 12, 1);
                if (currentDate < monthDate) {
                    return { text: '', className: '' };
                }
                const paidAmount = monthlyPaid[index];
                if (paidAmount >= monthlyFee) {
                    return { text: `$${monthlyFee.toFixed(2)}`, className: 'paid' };
                }
                return { text: 'Unpaid', className: 'unpaid' };
            });

            let totalFeesDueSoFar = annualFee;
            const monthsPassed = academicYearMonths.filter((_, index) => {
                const monthDate = new Date(academicSessionStartYear + (index >= 9 ? 1 : 0), (index + 3) % 12, 1);
                return currentDate >= monthDate;
            }).length;

            totalFeesDueSoFar += monthsPassed * monthlyFee;
            
            const currentBalance = totalFeesDueSoFar - totalPaid;
            const totalDue = currentBalance + parseFloat(student.previous_year_balance);

            return {
                ...student,
                annualStatus,
                monthlyStatus,
                currentBalance: currentBalance.toFixed(2),
                totalDue: totalDue.toFixed(2),
            };
        });
    }, [students, payments, classDetails]);

    // Fetch previous year classes for import
    const fetchPrevClasses = async () => {
        setPrevClasses([]);
        setPrevClassId('');
        setPrevStudents([]);
        setSelectedStudents([]);
        setImportError('');
        setImportSuccess('');
        try {
            const res = await classService.getClasses(); // get all classes
            setPrevClasses(res.data);
        } catch {
            setPrevClasses([]);
        }
    };

    // Fetch students from selected previous class
    const fetchPrevStudents = async (classId) => {
        setPrevStudents([]);
        setSelectedStudents([]);
        setImportError('');
        setImportSuccess('');
        if (!classId) return;
        try {
            // Get previous year
            const currentDate = new Date();
            const currentMonth = currentDate.getMonth();
            const prevSessionStartYear = currentMonth < 3 ? currentDate.getFullYear() - 2 : currentDate.getFullYear() - 1;
            const prevSessionEndYear = prevSessionStartYear + 1;
            const prevAcademicYear = `${prevSessionStartYear}-${prevSessionEndYear}`;
            const res = await classService.getFeeHistory(classId, prevAcademicYear);
            setPrevStudents(res.data.students);
        } catch {
            setPrevStudents([]);
        }
    };

    const handleImport = async () => {
        console.log('handleImport called', { classId, prevClassId, selectedStudents });
        setImportLoading(true);
        setImportError('');
        setImportSuccess('');
        try {
            await classService.importStudents(classId, {
                sourceClassId: prevClassId,
                studentIds: selectedStudents
            });
            setImportSuccess('Students imported successfully!');
            setShowImportModal(false);
            window.location.reload(); // reload to show new students
        } catch (err) {
            if (err.response && err.response.status === 409 && err.response.data && err.response.data.error) {
                setImportError(err.response.data.error); // Show backend error
            } else {
                setImportError('Failed to import students.');
            }
            console.error('Import error:', err);
        }
        setImportLoading(false);
    };

    const handleEditStudent = (student) => {
        console.log('Editing student:', student);
        setEditForm({ ...student });
        setShowEditModal(true);
        setEditError('');
    };

    const handleEditFormChange = (e) => {
        setEditForm({ ...editForm, [e.target.name]: e.target.value });
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setEditError('');
        try {
            await studentService.updateStudent(editForm.id, editForm);
            setShowEditModal(false);
            // Refresh students list
            // (call your fetch students function here)
            await fetchData(classId, setClassDetails, setStudents, setPayments, setError, setLoading);
        } catch (err) {
            setEditError('Failed to update student.');
        }
    };

    const handleDeleteStudent = async (student) => {
        console.log('Deleting student:', student);
        if (window.confirm(`Are you sure you want to delete ${student.name}?`)) {
            try {
                await studentService.deleteStudent(student.id);
                // Refresh students list
                await fetchData(classId, setClassDetails, setStudents, setPayments, setError, setLoading);
            } catch (err) {
                alert('Failed to delete student.');
            }
        }
    };

    if (loading) return <div>Loading class details...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div className="class-details-view">
            <h2>{classDetails?.name} - Fee Status</h2>
            <button onClick={() => { setShowImportModal(true); fetchPrevClasses(); }} style={{ marginBottom: '1rem', background: '#2980b9', color: 'white' }}>
                Import Students
            </button>
            {showImportModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: 8, minWidth: 320 }}>
                        <h3>Import Students from Previous Year</h3>
                        <div style={{ marginBottom: '1rem' }}>
                            <label>Select Previous Class: </label>
                            <select value={prevClassId} onChange={e => { setPrevClassId(e.target.value); fetchPrevStudents(e.target.value); }}>
                                <option value="">Select</option>
                                {prevClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: '1rem' }}>
                            {prevStudents.length === 0 ? <div>No students found.</div> : (
                                <ul style={{ listStyle: 'none', padding: 0 }}>
                                    {prevStudents.map(s => (
                                        <li key={s.id}>
                                            <label>
                                                <input type="checkbox" value={s.id} checked={selectedStudents.includes(s.id)} onChange={e => {
                                                    if (e.target.checked) setSelectedStudents([...selectedStudents, s.id]);
                                                    else setSelectedStudents(selectedStudents.filter(id => id !== s.id));
                                                }} />
                                                {s.name} ({s.student_id})
                                            </label>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        {importError && <div style={{ color: 'red' }}>{importError}</div>}
                        {importSuccess && <div style={{ color: 'green' }}>{importSuccess}</div>}
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button onClick={handleImport} disabled={importLoading || selectedStudents.length === 0} style={{ background: '#27ae60', color: 'white' }}>Done</button>
                            <button onClick={() => setShowImportModal(false)} disabled={importLoading}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Student's Name</th>
                            <th>Father's Name</th>
                            <th>Phone</th>
                            <th>Annual Fee</th>
                            {academicYearMonths.map(m => <th key={m}>{m}</th>)}
                            <th>Previous Balance</th>
                            <th>Current Balance</th>
                            <th>Due</th>
                            <th>Modifications</th>
                        </tr>
                    </thead>
                    <tbody>
                        {processedStudentData.map(student => (
                            <tr key={student.id}>
                                <td>{student.student_id}</td>
                                <td>{student.name}</td>
                                <td>{student.father_name}</td>
                                <td>{student.phone}</td>
                                <td className={student.annualStatus.className}>{student.annualStatus.text}</td>
                                {student.monthlyStatus.map((status, index) => (
                                    <td key={index} className={status.className}>{status.text}</td>
                                ))}
                                <td className={parseFloat(student.previous_year_balance) === 0 ? 'balance-green' : 'balance-red'}>
                                    ${parseFloat(student.previous_year_balance).toFixed(2)}
                                </td>
                                <td>${student.currentBalance < 0 ? `-$${Math.abs(student.currentBalance).toFixed(2)}` : `$${student.currentBalance}`}</td>
                                <td>${student.totalDue < 0 ? `-$${Math.abs(student.totalDue).toFixed(2)}` : `$${student.totalDue}`}</td>
                                <td>
                                    <button onClick={() => handleEditStudent(student)}>Modify</button>
                                    <button onClick={() => handleDeleteStudent(student)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {showEditModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Edit Student</h3>
                        <form onSubmit={handleEditSubmit}>
                            <input name="name" value={editForm.name || ''} onChange={handleEditFormChange} placeholder="Name" />
                            <input name="father_name" value={editForm.father_name || ''} onChange={handleEditFormChange} placeholder="Father's Name" />
                            <input name="mother_name" value={editForm.mother_name || ''} onChange={handleEditFormChange} placeholder="Mother's Name" />
                            <input name="email" value={editForm.email || ''} onChange={handleEditFormChange} placeholder="Email" />
                            <input name="phone" value={editForm.phone || ''} onChange={handleEditFormChange} placeholder="Phone" />
                            {/* Add other fields as needed */}
                            {editError && <div style={{ color: 'red' }}>{editError}</div>}
                            <button type="submit">Save</button>
                            <button type="button" onClick={() => setShowEditModal(false)}>Cancel</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClassDetailsPage; 