import React, { useState } from 'react';
import paymentService from '../../services/paymentService';
import studentService from '../../services/studentService';
import './PayFeeView.css';
import Receipt from './Receipt';

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
    const [lastPayment, setLastPayment] = useState(null);

    const handleSearchChange = (e) => {
        setSearchCriteria({ ...searchCriteria, [e.target.name]: e.target.value });
    };

    const handleFindStudent = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setFoundStudent(null);
        setLastPayment(null);
        
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
            console.log('Submitting payment data:', dataToSubmit);
            const response = await paymentService.makePayment(dataToSubmit);
            //console.log('Payment response:', response.data);
            
            // Structure the payment data properly for the receipt
            const paymentResponse = response.data;
            let receiptPaymentDetails = null;
            
            // Determine which payment to show in receipt (prefer current year payment)
            if (paymentResponse.currentPayment) {
                receiptPaymentDetails = {
                    id: paymentResponse.currentPayment.id,
                    amount_paid: paymentResponse.currentPayment.amount_paid,
                    payment_method: paymentResponse.currentPayment.payment_method,
                    payment_date: paymentResponse.currentPayment.payment_date,
                    academic_year: paymentResponse.currentPayment.academic_year
                };
                console.log('Using current payment for receipt:', receiptPaymentDetails);
            } else if (paymentResponse.previousPayment) {
                receiptPaymentDetails = {
                    id: paymentResponse.previousPayment.id,
                    amount_paid: paymentResponse.previousPayment.amount_paid,
                    payment_method: paymentResponse.previousPayment.payment_method,
                    payment_date: paymentResponse.previousPayment.payment_date,
                    academic_year: paymentResponse.previousPayment.academic_year
                };
                console.log('Using previous payment for receipt:', receiptPaymentDetails);
            }
            
            // Add school details to the payment details
            if (receiptPaymentDetails && paymentResponse.schoolDetails) {
                receiptPaymentDetails.schoolDetails = paymentResponse.schoolDetails;
            }
            
            console.log('Final receipt payment details:', receiptPaymentDetails);
            setLastPayment(receiptPaymentDetails);
            
            setPaymentData({ amount_paid: '', payment_method: '' });
            setMessage('Payment made successfully! Print the receipt below.');

        } catch (err) {
            console.error('Payment error:', err);
            setError(err.response?.data?.error || 'Payment failed.');
        }
    };

    const handlePrintReceipt = () => {
        window.print();
    };

    const handleCloseReceipt = () => {
        setLastPayment(null);
        setFoundStudent(null);
        setSearchCriteria({ student_id: '', name: '', phone: '' });
        setMessage('');
        setError('');
    };

    return (
        <div className="pay-fee-view">
            {!lastPayment && (
                <>
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
                            <p><strong>Mother's Name:</strong> {foundStudent.mother_name}</p>
                            <p><strong>Address:</strong> {foundStudent.address}</p>
                            <p><strong>Phone:</strong> {foundStudent.phone}</p>
                            <p><strong>Registered On:</strong> {foundStudent.registration_date ? new Date(foundStudent.registration_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : ''}</p>
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
                </>
            )}

            {lastPayment && (
                <Receipt 
                    paymentDetails={lastPayment}
                    studentDetails={foundStudent}
                    schoolDetails={lastPayment.schoolDetails}
                    onPrint={handlePrintReceipt}
                    onClose={handleCloseReceipt}
                />
            )}
        </div>
    );
};

export default PayFeeView; 