import React, { useEffect, useState } from 'react';
import classService from '../../services/classService';
import studentService from '../../services/studentService';
import './RegisterView.css';

const RegisterView = () => {
    const initialFormData = {
        name: '',
        class_id: '',
        father_name: '',
        mother_name: '',
        email: '',
        phone: '',
    };
    const [formData, setFormData] = useState(initialFormData);
    const [classes, setClasses] = useState([]);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const response = await classService.getClasses();
                setClasses(response.data);
            } catch (err) {
                setError('Failed to load classes.');
            }
        };
        fetchClasses();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        try {
            const response = await studentService.registerStudent(formData);
            setMessage(`Student registered successfully! Student ID: ${response.data.student_id}`);
            setFormData(initialFormData); // Reset form
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed.');
        }
    };

    return (
        <div className="register-view">
            <h2>Register New Student</h2>
            <form onSubmit={handleSubmit} className="register-form">
                <input type="text" name="name" placeholder="Name of the Student" value={formData.name} onChange={handleChange} required />
                <select name="class_id" value={formData.class_id} onChange={handleChange} required>
                    <option value="">Select a Class</option>
                    {classes.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
                <input type="text" name="father_name" placeholder="Father's Name" value={formData.father_name} onChange={handleChange} required />
                <input type="text" name="mother_name" placeholder="Mother's Name" value={formData.mother_name} onChange={handleChange} required />
                <input type="email" name="email" placeholder="Email (optional)" value={formData.email} onChange={handleChange} />
                <input type="text" name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleChange} required />
                <button type="submit">Register</button>
            </form>
            {message && <div className="success-message">{message}</div>}
            {error && <div className="error-message">{error}</div>}
        </div>
    );
};

export default RegisterView; 