import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EditClassModal from '../../components/EditClassModal';
import classService from '../../services/classService';
import './ClassesView.css'; // Ensure the CSS is imported

const ClassesView = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', monthly_fee: '', annual_fee: '' });
  const [addError, setAddError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await classService.getClasses();
      setClasses(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch classes.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (classId) => {
    navigate(`/dashboard/classes/${classId}`);
  };

  const handleEditClick = (e, classData) => {
    e.stopPropagation(); // Prevent navigation when clicking the edit button
    setSelectedClass(classData);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedClass(null);
  };

  const handleSaveChanges = async (id, updatedData) => {
    try {
      await classService.updateClass(id, updatedData);
      handleCloseModal();
      fetchClasses(); // Re-fetch classes to show updated data
    } catch (err) {
      setError('Failed to update class.');
      console.error(err);
    }
  };

  // Add Class logic
  const handleAddClassClick = () => {
    setShowAddModal(true);
    setAddForm({ name: '', monthly_fee: '', annual_fee: '' });
    setAddError('');
  };

  const handleAddFormChange = (e) => {
    setAddForm({ ...addForm, [e.target.name]: e.target.value });
  };

  const handleAddClassSubmit = async (e) => {
    e.preventDefault();
    setAddError('');
    if (!addForm.name || !addForm.monthly_fee || !addForm.annual_fee) {
      setAddError('All fields are required.');
      return;
    }
    try {
      await classService.addClass(addForm);
      setShowAddModal(false);
      fetchClasses();
    } catch (err) {
      setAddError('Failed to add class.');
      console.error(err);
    }
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setAddError('');
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Classes</h2>
        <button onClick={handleAddClassClick} style={{ marginRight: '1rem' }}>Add Class</button>
      </div>
      <div className="class-grid">
        {classes.map((c) => (
          <div key={c.id} className="class-card" onClick={() => handleCardClick(c.id)}>
            <h3>{c.name}</h3>
            <p>Monthly Fee: ${c.monthly_fee}</p>
            <p>Annual Fee: ${c.annual_fee}</p>
            <button onClick={(e) => handleEditClick(e, c)}>Edit</button>
          </div>
        ))}
      </div>
      <EditClassModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        classData={selectedClass}
        onSave={handleSaveChanges}
      />
      {/* Add Class Modal - must be a direct child, not inside grid */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add New Class</h3>
            <form onSubmit={handleAddClassSubmit}>
              <div>
                <label>Class Name</label>
                <input name="name" value={addForm.name} onChange={handleAddFormChange} required />
              </div>
              <div>
                <label>Monthly Fee</label>
                <input name="monthly_fee" type="number" value={addForm.monthly_fee} onChange={handleAddFormChange} required />
              </div>
              <div>
                <label>Annual Fee</label>
                <input name="annual_fee" type="number" value={addForm.annual_fee} onChange={handleAddFormChange} required />
              </div>
              {addError && <div style={{ color: 'red', marginTop: '0.5rem' }}>{addError}</div>}
              <div style={{ marginTop: '1rem' }}>
                <button type="submit">Add</button>
                <button type="button" onClick={handleCloseAddModal} style={{ marginLeft: '1rem' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassesView; 