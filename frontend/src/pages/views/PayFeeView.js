import React, { useState } from 'react';
import paymentService from '../../services/paymentService';
import studentService from '../../services/studentService';
import './PayFeeView.css';

const PayFeeView = () => {
    const [searchCriteria, setSearchCriteria] = useState({
        student_id: '',
        name: '',
        phone: ''
    });
    const [foundStudent, setFoundStudent] = useState(null);
    const [paymentData, setPaymentData] = useState({ amount_paid: '', payment_method: '' });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSearchChange = (e) => {
        setSearchCriteria({ ...searchCriteria, [e.target.name]: e.target.value });
    };

    const handleFindStudent = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setFoundStudent(null);
        
        const { student_id, name, phone } = searchCriteria;
        const hasId = student_id.trim() !== '';
        const hasNameAndPhone = name.trim() !== '' && phone.trim() !== '';

        if (!hasId && !hasNameAndPhone) {
            setError('Please search by Student ID, or by both Student Name and Phone Number.');
            return;
        }

        try {
            const filledCriteria = Object.fromEntries(
                Object.entries(searchCriteria).filter(([_, value]) => value.trim() !== '')
            );
            
            const response = await studentService.searchStudent(filledCriteria);
            const student = response.data;
            setFoundStudent(student);

            setSearchCriteria({
                student_id: student.student_id || '',
                name: student.name || '',
                phone: student.phone || ''
            });

        } catch (err) {
            setError(err.response?.data?.error || 'Student not found.');
        }
    };

    const handlePaymentChange = (e) => {
        setPaymentData({ ...paymentData, [e.target.name]: e.target.value });
    };

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        try {
            const academic_year = new Date().getFullYear() + '-' + (new Date().getFullYear() + 1);
            const dataToSubmit = {
                student_id: foundStudent.id,
                amount_paid: paymentData.amount_paid,
                payment_method: paymentData.payment_method,
                academic_year,
            };
            await paymentService.makePayment(dataToSubmit);
            setMessage('Payment made successfully!');
            setFoundStudent(null);
            setSearchCriteria({ student_id: '', name: '', phone: '' });
            setPaymentData({ amount_paid: '', payment_method: '' });
        } catch (err) {
            setError(err.response?.data?.error || 'Payment failed.');
        }
    };

    return (
        <div className="pay-fee-view">
            <h2>Pay Fee</h2>
            <p>Search by Student ID, or by both Name and Phone Number.</p>
            <form onSubmit={handleFindStudent} className="find-student-form">
                <div className="search-grid">
                    <input name="student_id" placeholder="Student ID" value={searchCriteria.student_id} onChange={handleSearchChange} />
                    <input name="name" placeholder="Student Name" value={searchCriteria.name} onChange={handleSearchChange} />
                    <input name="phone" placeholder="Phone Number" value={searchCriteria.phone} onChange={handleSearchChange} />
                </div>
                <button type="submit">Find Student</button>
            </form>

            {error && <div className="error-message">{error}</div>}
            
            {foundStudent && (
                <div className="student-details-card">
                    <h3>Student Details</h3>
                    <p><strong>Name:</strong> {foundStudent.name}</p>
                    <p><strong>Class:</strong> {foundStudent.class_name}</p>
                    <p><strong>Student ID:</strong> {foundStudent.student_id}</p>
                    <p><strong>Father's Name:</strong> {foundStudent.father_name}</p>
                    <p><strong>Phone:</strong> {foundStudent.phone}</p>
                    <hr />
                    <form onSubmit={handlePaymentSubmit} className="payment-form">
                        <h3>Make Payment</h3>
                        <input type="number" name="amount_paid" placeholder="Amount Paid" value={paymentData.amount_paid} onChange={handlePaymentChange} required />
                        <select name="payment_method" value={paymentData.payment_method} onChange={handlePaymentChange} required >
                            <option value="">Select Payment Method</option>
                            <option value="Cash">Cash</option>
                            <option value="Online">Online</option>
                            <option value="Cheque">Cheque</option>
                        </select>
                        <button type="submit">Make Payment</button>
                    </form>
                </div>
            )}

            {message && <div className="success-message">{message}</div>}
        </div>
    );
};

export default PayFeeView; 