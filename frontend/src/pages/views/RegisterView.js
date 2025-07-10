import React, { useEffect, useState } from 'react';
import RegisterSVG from '../../assets/register-illustration.svg'; // Your illustration
import classService from '../../services/classService';
import studentService from '../../services/studentService';
import './RegisterView.css';

export default function RegisterView() {
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
        <div className="register-page-bg">
            <div className="register-view">
                <h2>Register New Student</h2>
                <form onSubmit={handleSubmit} className="register-form">
                    <div>
                        <label className="register-label">Name of the Student</label>
                        <input type="text" name="name" placeholder="Name of the Student" value={formData.name} onChange={handleChange} required />
                    </div>
                    <div>
                        <label className="register-label">Class</label>
                        <select name="class_id" value={formData.class_id} onChange={handleChange} required>
                            <option value="">Select a Class</option>
                            {classes.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="register-label">Father's Name</label>
                        <input type="text" name="father_name" placeholder="Father's Name" value={formData.father_name} onChange={handleChange} required />
                    </div>
                    <div>
                        <label className="register-label">Mother's Name</label>
                        <input type="text" name="mother_name" placeholder="Mother's Name" value={formData.mother_name} onChange={handleChange} required />
                    </div>
                    <div>
                        <label className="register-label">Email (optional)</label>
                        <input type="email" name="email" placeholder="Email (optional)" value={formData.email} onChange={handleChange} />
                    </div>
                    <div>
                        <label className="register-label">Phone Number</label>
                        <input type="text" name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleChange} required />
                    </div>
                    <button type="submit">Register</button>
                </form>
                {message && <div className="success-message">{message}</div>}
                {error && <div className="error-message">{error}</div>}
            </div>
            <img src={RegisterSVG} alt="Register illustration" className="register-illustration" />
        </div>
    );
} 