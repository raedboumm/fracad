import React, { useState, useEffect } from 'react';
import { highlightsAPI } from '../services/api';
import Toast from './Toast';
import '../styles/HighlightsManagement.css';

const HighlightsManagement = () => {
  const [highlights, setHighlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    id: '',
    title: '',
    description: '',
    video_url: '',
    thumbnail_url: '',
    display_order: 0,
    is_active: true,
  });

  useEffect(() => {
    fetchHighlights();
  }, []);

  const fetchHighlights = async () => {
    try {
      setLoading(true);
      const response = await highlightsAPI.getAll();
      console.log('Full response:', response);
      console.log('response.data type:', typeof response.data);
      console.log('response.data:', response.data);
      console.log('response.data.data:', response.data?.data);
      
      // The backend returns { data: [...] }, so we need response.data.data
      const highlightsArray = response.data?.data || response.data || [];
      console.log('Final highlights array:', highlightsArray);
      console.log('Array length:', highlightsArray.length);
      
      setHighlights(Array.isArray(highlightsArray) ? highlightsArray : []);
    } catch (error) {
      console.error('Error fetching highlights:', error);
      console.error('Error details:', error.response?.data);
      setToast({ message: 'Failed to fetch highlights', type: 'error' });
      setHighlights([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const extractVideoId = (url) => {
    // Extract YouTube video ID from various URL formats
    const patterns = [
      /youtube\.com\/watch\?v=([^&]+)/,
      /youtube\.com\/embed\/([^?]+)/,
      /youtu\.be\/([^?]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const getThumbnailUrl = (videoUrl) => {
    const videoId = extractVideoId(videoUrl);
    if (videoId) {
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
    return '';
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    let newValue = type === 'checkbox' ? checked : value;
    
    // Auto-generate thumbnail when video URL changes
    if (name === 'video_url' && value) {
      const thumbnailUrl = getThumbnailUrl(value);
      setFormData({
        ...formData,
        [name]: newValue,
        thumbnail_url: thumbnailUrl
      });
    } else {
      setFormData({
        ...formData,
        [name]: newValue
      });
    }
  };

  const openAddModal = () => {
    setFormData({
      id: '',
      title: '',
      description: '',
      video_url: '',
      thumbnail_url: '',
      display_order: highlights.length,
      is_active: true,
    });
    setIsEditMode(false);
    setShowModal(true);
  };

  const openEditModal = (highlight) => {
    setFormData({
      id: highlight.id,
      title: highlight.title,
      description: highlight.description || '',
      video_url: highlight.video_url,
      thumbnail_url: highlight.thumbnail_url || '',
      display_order: highlight.display_order,
      is_active: highlight.is_active,
    });
    setIsEditMode(true);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.video_url) {
      setToast({ message: 'Please fill all required fields', type: 'error' });
      return;
    }

    try {
      const highlightData = {
        ...formData,
        display_order: parseInt(formData.display_order),
      };

      if (isEditMode) {
        const response = await highlightsAPI.update(formData.id, highlightData);
        console.log('Update response:', response);
        setToast({ message: 'Highlight updated successfully! 🎥', type: 'success' });
      } else {
        const response = await highlightsAPI.create(highlightData);
        console.log('Create response:', response);
        setToast({ message: 'Highlight created successfully! 🎥', type: 'success' });
      }

      setShowModal(false);
      await fetchHighlights(); // Wait for fetch to complete
    } catch (error) {
      console.error('Error saving highlight:', error);
      console.error('Error details:', error.response?.data);
      setToast({
        message: error.response?.data?.message || 'Failed to save highlight',
        type: 'error'
      });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this highlight?')) {
      return;
    }
    try {
      await highlightsAPI.delete(id);
      setToast({ message: 'Highlight deleted successfully! 🗑️', type: 'success' });
      await fetchHighlights();
    } catch (error) {
      console.error('Error deleting highlight:', error);
      setToast({ message: 'Failed to delete highlight', type: 'error' });
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await highlightsAPI.toggleStatus(id);
      setToast({ message: 'Status updated successfully! ✅', type: 'success' });
      await fetchHighlights();
    } catch (error) {
      console.error('Error toggling status:', error);
      setToast({ message: 'Failed to update status', type: 'error' });
    }
  };

  const getVideoEmbedUrl = (url) => {
    const videoId = extractVideoId(url);
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
  };

  if (loading) {
    return <div className="loading">Loading highlights...</div>;
  }

  return (
    <div className="highlights-management">
      <div className="header">
        <h2>📺 YouTube Highlights Management</h2>
        <button onClick={openAddModal} className="add-btn">
          + Add New Highlight
        </button>
      </div>

      <div className="highlights-table">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Description</th>
              <th>Video URL</th>
              <th>Order</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {highlights.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-data">
                  No highlights found. Add your first highlight!
                </td>
              </tr>
            ) : (
              highlights.map((highlight) => (
                <tr key={highlight.id}>
                  <td className="title-cell">{highlight.title}</td>
                  <td className="description-cell">
                    {highlight.description ? 
                      (highlight.description.length > 50 
                        ? highlight.description.substring(0, 50) + '...' 
                        : highlight.description)
                      : '-'}
                  </td>
                  <td className="url-cell">
                    <a href={highlight.video_url} target="_blank" rel="noopener noreferrer" className="video-link">
                      🎬 View
                    </a>
                  </td>
                  <td className="order-cell">{highlight.display_order}</td>
                  <td className="status-cell">
                    <button
                      onClick={() => handleToggleStatus(highlight.id)}
                      className={`status-badge ${highlight.is_active ? 'active' : 'inactive'}`}
                    >
                      {highlight.is_active ? '✓ Active' : '✗ Inactive'}
                    </button>
                  </td>
                  <td className="actions-cell">
                    <button onClick={() => openEditModal(highlight)} className="edit-btn" title="Edit">
                      ✏️
                    </button>
                    <button onClick={() => handleDelete(highlight.id)} className="delete-btn" title="Delete">
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
              <h3>{isEditMode ? '✏️ Edit Highlight' : '➕ Add New Highlight'}</h3>
              <button onClick={() => setShowModal(false)} className="close-btn">✖</button>
            </div>
            <form onSubmit={handleSubmit} className="highlight-form">
              <div className="form-group">
                <label htmlFor="title">Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Physique bac 2025"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="video_url">YouTube Video URL *</label>
                <input
                  type="url"
                  id="video_url"
                  name="video_url"
                  value={formData.video_url}
                  onChange={handleInputChange}
                  placeholder="https://www.youtube.com/watch?v=..."
                  required
                />
                <small>Paste the YouTube video URL. Thumbnail will be auto-generated.</small>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Brief description of the video content"
                  rows="3"
                />
              </div>

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
                  <small>Lower numbers appear first</small>
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

              {formData.video_url && (
                <div className="form-group preview-group">
                  <label>Preview</label>
                  <div className="video-preview">
                    <iframe
                      src={getVideoEmbedUrl(formData.video_url)}
                      title="Video Preview"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              <div className="form-actions">
                <button type="button" onClick={() => setShowModal(false)} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  {isEditMode ? 'Update Highlight' : 'Create Highlight'}
                </button>
              </div>
            </form>
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

export default HighlightsManagement;
