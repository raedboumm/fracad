import React, { useState, useEffect } from 'react';
import { classesAPI, levelsAPI } from '../services/api';
import '../styles/ClassesManagement.css';

const ClassesManagement = () => {
  const [classes, setClasses] = useState([]);
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    level_id: '',
    year_number: '',
    description: '',
    requires_section: 0,
    status: 'active'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [classesResponse, levelsResponse] = await Promise.all([
        classesAPI.getAll(),
        levelsAPI.getAll()
      ]);
      setClasses(classesResponse.data);
      setLevels(levelsResponse.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (classItem = null) => {
    if (classItem) {
      setEditingClass(classItem);
      setFormData({
        name: classItem.name,
        level_id: classItem.level_id,
        year_number: classItem.year_number || '',
        description: classItem.description || '',
        requires_section: classItem.requires_section || 0,
        status: classItem.status
      });
    } else {
      setEditingClass(null);
      setFormData({
        name: '',
        level_id: '',
        year_number: '',
        description: '',
        requires_section: 0,
        status: 'active'
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingClass(null);
    setFormData({
      name: '',
      level_id: '',
      year_number: '',
      description: '',
      requires_section: 0,
      status: 'active'
    });
    setError('');
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim() || !formData.level_id) {
      setError('Class name and level are required');
      return;
    }

    try {
      const submitData = {
        ...formData,
        year_number: formData.year_number ? parseInt(formData.year_number) : null
      };

      if (editingClass) {
        await classesAPI.update(editingClass.id, submitData);
      } else {
        await classesAPI.create(submitData);
      }
      await fetchData();
      handleCloseModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save class');
      console.error('Error saving class:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this class?')) {
      return;
    }

    try {
      await classesAPI.delete(id);
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete class');
      console.error('Error deleting class:', err);
    }
  };

  const filteredClasses = classes.filter(classItem =>
    classItem.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (classItem.level_name && classItem.level_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (classItem.description && classItem.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return <div className="classes-loading">Loading classes...</div>;
  }

  return (
    <div className="classes-management">
      <div className="classes-header">
        <h1>Classes Management</h1>
        <button className="btn-add-class" onClick={() => handleOpenModal()}>
          <span className="btn-icon">➕</span> Add New Class
        </button>
      </div>

      <div className="classes-search">
        <input
          type="text"
          placeholder="Search classes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      {error && !showModal && <div className="error-message">{error}</div>}

      <div className="classes-table-container">
        <table className="classes-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Level</th>
              <th>Description</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredClasses.length === 0 ? (
              <tr>
                <td colSpan="5" className="no-data">
                  {searchQuery ? 'No classes found matching your search' : 'No classes available. Add your first class!'}
                </td>
              </tr>
            ) : (
              filteredClasses.map((classItem) => (
                <tr key={classItem.id}>
                  <td className="class-name">{classItem.name}</td>
                  <td className="class-level">{classItem.level_name || '-'}</td>
                  <td className="class-description">{classItem.description || '-'}</td>
                  <td>
                    <span className={`status-badge ${classItem.status}`}>
                      {classItem.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button
                      className="btn-edit"
                      onClick={() => handleOpenModal(classItem)}
                      title="Edit"
                    >
                      <span>✏️</span>
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(classItem.id)}
                      title="Delete"
                    >
                      <span>🗑️</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingClass ? 'Edit Class' : 'Add New Class'}</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                ✕
              </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit} className="class-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Class Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., 1ere Année, 7eme Année"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="level_id">Level *</label>
                  <select
                    id="level_id"
                    name="level_id"
                    value={formData.level_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select a level</option>
                    {levels.map((level) => (
                      <option key={level.id} value={level.id}>
                        {level.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="year_number">Year Number</label>
                  <input
                    type="number"
                    id="year_number"
                    name="year_number"
                    value={formData.year_number}
                    onChange={handleChange}
                    placeholder="1, 2, 3, 4, 5, 6, 7, 8, 9..."
                    min="1"
                    max="12"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter class description (optional)"
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="requires_section">Requires Section</label>
                  <select
                    id="requires_section"
                    name="requires_section"
                    value={formData.requires_section}
                    onChange={handleChange}
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="status">Status *</label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-save">
                  {editingClass ? 'Update Class' : 'Add Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassesManagement;
