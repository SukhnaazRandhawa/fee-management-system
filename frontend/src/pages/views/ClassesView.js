import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EditClassModal from '../../components/EditClassModal';
import classService from '../../services/classService';

const ClassesView = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
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

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h2>Classes</h2>
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
    </div>
  );
};

export default ClassesView; 