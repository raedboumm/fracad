import React, { useState, useEffect } from 'react';
import { testimonialsAPI } from '../services/api';
import Toast from './Toast';
import '../styles/TestimonialsManagement.css';

const TestimonialsManagement = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [toast, setToast] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [testimonialToDelete, setTestimonialToDelete] = useState(null);

  const [formData, setFormData] = useState({
    id: '',
    type: 'text',
    name: '',
    gender: 'male',
    rating: 5,
    content: '',
    video_url: '',
    display_order: 0,
    is_active: true,
  });

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      const response = await testimonialsAPI.getAll();
      const testimonialsData = response.data?.data || response.data || [];
      setTestimonials(Array.isArray(testimonialsData) ? testimonialsData : []);
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      setToast({ message: 'Failed to fetch testimonials', type: 'error' });
      setTestimonials([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const openAddModal = () => {
    setFormData({
      id: '',
      type: 'text',
      name: '',
      gender: 'male',
      rating: 5,
      content: '',
      video_url: '',
      display_order: testimonials.length,
      is_active: true,
    });
    setIsEditMode(false);
    setShowModal(true);
  };

  const openEditModal = (testimonial) => {
    setFormData({
      id: testimonial.id,
      type: testimonial.type,
      name: testimonial.name,
      gender: testimonial.gender,
      rating: testimonial.rating,
      content: testimonial.content || '',
      video_url: testimonial.video_url || '',
      display_order: testimonial.display_order,
      is_active: testimonial.is_active,
    });
    setIsEditMode(true);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || (formData.type === 'text' && !formData.content) || (formData.type === 'video' && !formData.video_url)) {
      setToast({ message: 'Please fill all required fields', type: 'error' });
      return;
    }

    try {
      const testimonialData = {
        ...formData,
        rating: parseInt(formData.rating),
        display_order: parseInt(formData.display_order),
      };

      if (isEditMode) {
        await testimonialsAPI.update(formData.id, testimonialData);
        setToast({ message: 'Testimonial updated successfully! ⭐', type: 'success' });
      } else {
        await testimonialsAPI.create(testimonialData);
        setToast({ message: 'Testimonial created successfully! ⭐', type: 'success' });
      }

      setShowModal(false);
      await fetchTestimonials();
    } catch (error) {
      console.error('Error saving testimonial:', error);
      setToast({
        message: error.response?.data?.message || 'Failed to save testimonial',
        type: 'error'
      });
    }
  };

  const openDeleteModal = (testimonial) => {
    setTestimonialToDelete(testimonial);
    setShowDeleteModal(true);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setTestimonialToDelete(null);
  };

  const confirmDelete = async () => {
    try {
      await testimonialsAPI.delete(testimonialToDelete.id);
      setToast({ message: 'Testimonial deleted successfully! 🗑️', type: 'success' });
      setShowDeleteModal(false);
      setTestimonialToDelete(null);
      await fetchTestimonials();
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      setToast({ message: 'Failed to delete testimonial', type: 'error' });
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await testimonialsAPI.toggleStatus(id);
      setToast({ message: 'Status updated successfully! ✅', type: 'success' });
      await fetchTestimonials();
    } catch (error) {
      console.error('Error toggling status:', error);
      setToast({ message: 'Failed to update status', type: 'error' });
    }
  };

  if (loading) {
    return <div className="loading">Loading testimonials...</div>;
  }

  return (
    <div className="testimonials-management">
      <div className="header">
        <h2>💬 Testimonials Management</h2>
        <button onClick={openAddModal} className="add-btn">
          + Add Testimonial
        </button>
      </div>

      <div className="testimonials-table">
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Name</th>
              <th>Gender</th>
              <th>Rating</th>
              <th>Content</th>
              <th>Video URL</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {testimonials.length === 0 ? (
              <tr>
                <td colSpan="8" className="no-data">
                  No testimonials found. Add your first testimonial!
                </td>
              </tr>
            ) : (
              testimonials.map((testimonial) => (
                <tr key={testimonial.id}>
                  <td className="type-cell">
                    <span className={`type-badge ${testimonial.type}`}>
                      {testimonial.type === 'video' ? '🎥' : '📝'} {testimonial.type}
                    </span>
                  </td>
                  <td className="name-cell">{testimonial.name}</td>
                  <td className="gender-cell">
                    {testimonial.gender === 'male' ? '👨' : '👩'} {testimonial.gender}
                  </td>
                  <td className="rating-cell">
                    {'⭐'.repeat(testimonial.rating)} ({testimonial.rating})
                  </td>
                  <td className="content-cell">
                    {testimonial.type === 'text' ? 
                      (testimonial.content?.substring(0, 50) + (testimonial.content?.length > 50 ? '...' : '')) 
                      : '-'}
                  </td>
                  <td className="url-cell">
                    {testimonial.video_url ? (
                      <a href={testimonial.video_url} target="_blank" rel="noopener noreferrer" className="video-link">
                        🎬 View
                      </a>
                    ) : '-'}
                  </td>
                  <td className="status-cell">
                    <button
                      onClick={() => handleToggleStatus(testimonial.id)}
                      className={`status-badge ${testimonial.is_active ? 'active' : 'inactive'}`}
                    >
                      {testimonial.is_active ? '✓ Active' : '✗ Inactive'}
                    </button>
                  </td>
                  <td className="actions-cell">
                    <button onClick={() => openEditModal(testimonial)} className="edit-btn" title="Edit">
                      ✏️
                    </button>
                    <button onClick={() => openDeleteModal(testimonial)} className="delete-btn" title="Delete">
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{isEditMode ? '✏️ Edit Testimonial' : '➕ Add Testimonial'}</h3>
              <button onClick={() => setShowModal(false)} className="close-btn">✖</button>
            </div>
            <form onSubmit={handleSubmit} className="testimonial-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="type">Type *</label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="text">Text</option>
                    <option value="video">Video</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="gender">Gender</label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="name">Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter student name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="rating">Rating (1-5) *</label>
                <input
                  type="range"
                  id="rating"
                  name="rating"
                  value={formData.rating}
                  onChange={handleInputChange}
                  min="1"
                  max="5"
                  step="1"
                />
                <div className="rating-display">
                  {'⭐'.repeat(formData.rating)} ({formData.rating}/5)
                </div>
              </div>

              {formData.type === 'text' ? (
                <div className="form-group">
                  <label htmlFor="content">Content *</label>
                  <textarea
                    id="content"
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    placeholder="Enter testimonial text"
                    rows="5"
                    required={formData.type === 'text'}
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label htmlFor="video_url">Video URL *</label>
                  <input
                    type="url"
                    id="video_url"
                    name="video_url"
                    value={formData.video_url}
                    onChange={handleInputChange}
                    placeholder="https://www.youtube.com/watch?v=..."
                    required={formData.type === 'video'}
                  />
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="display_order">Display Order</label>
                  <input
                    type="number"
                    id="display_order"
                    name="display_order"
                    value={formData.display_order}
                    onChange={handleInputChange}
                    min="0"
                  />
                </div>

                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                    />
                    Active (Show on homepage)
                  </label>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowModal(false)} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  {isEditMode ? 'Update Testimonial' : 'Create Testimonial'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content-delete">
            <h3>⚠️ Confirm Delete</h3>
            <p>Are you sure you want to delete this testimonial?</p>
            {testimonialToDelete && (
              <div className="delete-details">
                <p><strong>Name:</strong> {testimonialToDelete.name}</p>
                <p><strong>Type:</strong> {testimonialToDelete.type}</p>
                <p><strong>Rating:</strong> {'⭐'.repeat(testimonialToDelete.rating)}</p>
              </div>
            )}
            <p className="warning-text">This action cannot be undone!</p>
            <div className="modal-actions">
              <button onClick={cancelDelete} className="cancel-btn">Cancel</button>
              <button onClick={confirmDelete} className="confirm-delete-btn">Delete</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default TestimonialsManagement;
