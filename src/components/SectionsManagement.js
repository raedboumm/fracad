import React, { useState, useEffect } from 'react';
import { sectionsAPI } from '../services/api';
import '../styles/SectionsManagement.css';

const SectionsManagement = () => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active'
  });

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      setLoading(true);
      const response = await sectionsAPI.getAll();
      setSections(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch sections');
      console.error('Error fetching sections:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (section = null) => {
    if (section) {
      setEditingSection(section);
      setFormData({
        name: section.name,
        description: section.description || '',
        status: section.status
      });
    } else {
      setEditingSection(null);
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
    setEditingSection(null);
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
      setError('Section name is required');
      return;
    }

    try {
      if (editingSection) {
        await sectionsAPI.update(editingSection.id, formData);
      } else {
        await sectionsAPI.create(formData);
      }
      await fetchSections();
      handleCloseModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save section');
      console.error('Error saving section:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this section?')) {
      return;
    }

    try {
      await sectionsAPI.delete(id);
      await fetchSections();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete section');
      console.error('Error deleting section:', err);
    }
  };

  const filteredSections = sections.filter(section =>
    section.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (section.description && section.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return <div className="sections-loading">Loading sections...</div>;
  }

  return (
    <div className="sections-management">
      <div className="sections-header">
        <h1>Sections Management</h1>
        <button className="btn-add-section" onClick={() => handleOpenModal()}>
          <span className="btn-icon">➕</span> Add New Section
        </button>
      </div>

      <div className="sections-search">
        <input
          type="text"
          placeholder="Search sections..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      {error && !showModal && <div className="error-message">{error}</div>}

      <div className="sections-table-container">
        <table className="sections-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSections.length === 0 ? (
              <tr>
                <td colSpan="4" className="no-data">
                  {searchQuery ? 'No sections found matching your search' : 'No sections available. Add your first section!'}
                </td>
              </tr>
            ) : (
              filteredSections.map((section) => (
                <tr key={section.id}>
                  <td className="section-name">{section.name}</td>
                  <td className="section-description">{section.description || '-'}</td>
                  <td>
                    <span className={`status-badge ${section.status}`}>
                      {section.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button
                      className="btn-edit"
                      onClick={() => handleOpenModal(section)}
                      title="Edit"
                    >
                      <span>✏️</span>
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(section.id)}
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
              <h2>{editingSection ? 'Edit Section' : 'Add New Section'}</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                ✕
              </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit} className="section-form">
              <div className="form-group">
                <label htmlFor="name">Section Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Mathématiques, Sciences, Lettres"
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
                  placeholder="Enter section description (optional)"
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
                  {editingSection ? 'Update Section' : 'Add Section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SectionsManagement;
