import React from 'react';
import './Receipt.css';

const Receipt = ({ paymentDetails, studentDetails, schoolDetails, onPrint, onClose }) => {
    console.log('Receipt component received:', { paymentDetails, studentDetails, schoolDetails });
    
    if (!paymentDetails || !studentDetails) {
        console.log('Receipt: Missing required data');
        return null;
    }

    const { amount_paid, payment_method, payment_date, academic_year, id } = paymentDetails;
    const { name, student_id, class_name, father_name } = studentDetails;

    // Validate and format the amount
    const formattedAmount = amount_paid && !isNaN(parseFloat(amount_paid)) 
        ? parseFloat(amount_paid).toFixed(2) 
        : '0.00';

    // Validate and format the date
    const formattedDate = payment_date && !isNaN(new Date(payment_date).getTime())
        ? new Date(payment_date).toLocaleDateString()
        : new Date().toLocaleDateString();

    console.log('Receipt formatted data:', { formattedAmount, formattedDate, amount_paid, payment_date });

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
                    </div>
                    <hr />
                    <div className="receipt-info">
                        <div>
                            <p><strong>Receipt No:</strong> {id || 'N/A'}</p>
                            <p><strong>Date:</strong> {formattedDate}</p>
                        </div>
                        <div>
                            <p><strong>Academic Year:</strong> {academic_year || 'N/A'}</p>
                        </div>
                    </div>
                    <hr />
                    <h4>Student Information</h4>
                    <p><strong>Student ID:</strong> {student_id || 'N/A'}</p>
                    <p><strong>Student Name:</strong> {name || 'N/A'}</p>
                    <p><strong>Father's Name:</strong> {father_name || 'N/A'}</p>
                    <p><strong>Class:</strong> {class_name || 'N/A'}</p>
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
                                <td>${formattedAmount}</td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr>
                                <td><strong>Total Paid</strong></td>
                                <td><strong>${formattedAmount}</strong></td>
                            </tr>
                            <tr>
                                <td><strong>Payment Method</strong></td>
                                <td><strong>{payment_method || 'N/A'}</strong></td>
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