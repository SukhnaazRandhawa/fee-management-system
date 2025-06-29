import React from 'react';
import './Receipt.css';

const Receipt = ({ paymentDetails, studentDetails, schoolDetails, onPrint, onClose }) => {
    if (!paymentDetails || !studentDetails) return null;

    const { amount_paid, payment_method, payment_date } = paymentDetails;
    const { name, student_id, class_name, father_name } = studentDetails;

    return (
        <div className="receipt-overlay">
            <div className="receipt-container">
                <div className="receipt-header">
                    <h2>Payment Receipt</h2>
                    <button className="close-btn no-print" onClick={onClose}>×</button>
                </div>
                <div className="receipt-body">
                    <div className="school-details">
                        <h3>{schoolDetails?.name || 'School Name'}</h3>
                        <p>{schoolDetails?.location || ''}</p>
                    </div>
                    <hr />
                    <div className="receipt-info">
                        <div>
                            <p><strong>Receipt No:</strong> {paymentDetails.id}</p>
                            <p><strong>Date:</strong> {new Date(payment_date).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <p><strong>Academic Year:</strong> {paymentDetails.academic_year}</p>
                        </div>
                    </div>
                    <hr />
                    <h4>Student Information</h4>
                    <p><strong>Student ID:</strong> {student_id}</p>
                    <p><strong>Student Name:</strong> {name}</p>
                    <p><strong>Father's Name:</strong> {father_name}</p>
                    <p><strong>Class:</strong> {class_name}</p>
                    <hr />
                    <h4>Payment Details</h4>
                    <table className="payment-table">
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Fee Payment</td>
                                <td>${parseFloat(amount_paid).toFixed(2)}</td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr>
                                <td><strong>Total Paid</strong></td>
                                <td><strong>${parseFloat(amount_paid).toFixed(2)}</strong></td>
                            </tr>
                            <tr>
                                <td><strong>Payment Method</strong></td>
                                <td><strong>{payment_method}</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                <div className="receipt-footer no-print">
                    <button onClick={onPrint}>Print Receipt</button>
                </div>
            </div>
        </div>
    );
};

export default Receipt; 