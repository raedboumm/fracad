import React, { useState, useEffect } from 'react';
import { levelsAPI } from '../services/api';
import '../styles/LevelsManagement.css';

const LevelsManagement = () => {
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingLevel, setEditingLevel] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active'
  });

  useEffect(() => {
    fetchLevels();
  }, []);

  const fetchLevels = async () => {
    try {
      setLoading(true);
      const response = await levelsAPI.getAll();
      setLevels(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch levels');
      console.error('Error fetching levels:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (level = null) => {
    if (level) {
      setEditingLevel(level);
      setFormData({
        name: level.name,
        description: level.description || '',
        status: level.status
      });
    } else {
      setEditingLevel(null);
      setFormData({
        name: '',
        description: '',
        status: 'active'
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingLevel(null);
    setFormData({
      name: '',
      description: '',
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

    if (!formData.name.trim()) {
      setError('Level name is required');
      return;
    }

    try {
      if (editingLevel) {
        await levelsAPI.update(editingLevel.id, formData);
      } else {
        await levelsAPI.create(formData);
      }
      await fetchLevels();
      handleCloseModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save level');
      console.error('Error saving level:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this level?')) {
      return;
    }

    try {
      await levelsAPI.delete(id);
      await fetchLevels();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete level');
      console.error('Error deleting level:', err);
    }
  };

  const filteredLevels = levels.filter(level =>
    level.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (level.description && level.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return <div className="levels-loading">Loading levels...</div>;
  }

  return (
    <div className="levels-management">
      <div className="levels-header">
        <h1>Levels Management</h1>
        <button className="btn-add-level" onClick={() => handleOpenModal()}>
          <span className="btn-icon">➕</span> Add New Level
        </button>
      </div>

      <div className="levels-search">
        <input
          type="text"
          placeholder="Search levels..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      {error && !showModal && <div className="error-message">{error}</div>}

      <div className="levels-table-container">
        <table className="levels-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLevels.length === 0 ? (
              <tr>
                <td colSpan="4" className="no-data">
                  {searchQuery ? 'No levels found matching your search' : 'No levels available. Add your first level!'}
                </td>
              </tr>
            ) : (
              filteredLevels.map((level) => (
                <tr key={level.id}>
                  <td className="level-name">{level.name}</td>
                  <td className="level-description">{level.description || '-'}</td>
                  <td>
                    <span className={`status-badge ${level.status}`}>
                      {level.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button
                      className="btn-edit"
                      onClick={() => handleOpenModal(level)}
                      title="Edit"
                    >
                      <span>✏️</span>
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(level.id)}
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
              <h2>{editingLevel ? 'Edit Level' : 'Add New Level'}</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                ✕
              </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit} className="level-form">
              <div className="form-group">
                <label htmlFor="name">Level Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., College, Lycée, Primaire"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter level description (optional)"
                  rows="3"
                />
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

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-save">
                  {editingLevel ? 'Update Level' : 'Create Level'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LevelsManagement;
