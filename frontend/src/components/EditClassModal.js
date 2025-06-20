import React, { useEffect, useState } from 'react';

const EditClassModal = ({ isOpen, onClose, classData, onSave }) => {
    const [formData, setFormData] = useState({ name: '', monthly_fee: '', annual_fee: '' });

    useEffect(() => {
        if (classData) {
            setFormData({
                name: classData.name,
                monthly_fee: classData.monthly_fee,
                annual_fee: classData.annual_fee,
            });
        }
    }, [classData]);

    if (!isOpen) {
        return null;
    }

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = () => {
        onSave(classData.id, formData);
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <h2>Edit Class</h2>
                <label>Class Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} />
                
                <label>Monthly Fee</label>
                <input type="number" name="monthly_fee" value={formData.monthly_fee} onChange={handleChange} />

                <label>Annual Fee</label>
                <input type="number" name="annual_fee" value={formData.annual_fee} onChange={handleChange} />

                <button onClick={handleSave}>Save</button>
                <button onClick={onClose}>Cancel</button>
            </div>
        </div>
    );
};

export default EditClassModal; 