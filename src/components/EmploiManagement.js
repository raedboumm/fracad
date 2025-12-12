import React, { useState, useEffect } from 'react';
import { emploiAPI, classesAPI, sectionsAPI } from '../services/api';
import Toast from './Toast';
import '../styles/EmploiManagement.css';

const EmploiManagement = () => {
  const [images, setImages] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [toast, setToast] = useState(null);
  const [viewImage, setViewImage] = useState('');

  const [formData, setFormData] = useState({
    id: '',
    image_url: '',
    class_id: '',
    section_id: '',
  });

  const [filteredSections, setFilteredSections] = useState([]);

  useEffect(() => {
    fetchImages();
    fetchClasses();
    fetchSections();
  }, []);

  // Filter sections when class changes
  useEffect(() => {
    if (formData.class_id && sections.length > 0 && classes.length > 0) {
      const selectedClass = classes.find(c => c.id === parseInt(formData.class_id));
      
      if (selectedClass) {
        const className = selectedClass.name || '';
        const needsSections = /2[èe]me/i.test(className) || 
                            /3[èe]me/i.test(className) || 
                            /4[èe]me/i.test(className);
        
        if (needsSections) {
          const lyceeSections = sections.filter(s => {
            const sectionName = (s.name || '').toLowerCase();
            return sectionName.includes('science') || 
                   sectionName.includes('math') || 
                   sectionName.includes('lettre') || 
                   sectionName.includes('économie') ||
                   sectionName.includes('economie') ||
                   sectionName.includes('gestion') ||
                   sectionName.includes('technique') ||
                   sectionName.includes('informatique') ||
                   sectionName.includes('sport');
          });
          setFilteredSections(lyceeSections);
          
          if (formData.section_id && !lyceeSections.find(s => s.id === parseInt(formData.section_id))) {
            setFormData(prev => ({ ...prev, section_id: '' }));
          }
        } else {
          setFilteredSections([]);
          setFormData(prev => ({ ...prev, section_id: '' }));
        }
      }
    } else {
      setFilteredSections([]);
      setFormData(prev => ({ ...prev, section_id: '' }));
    }
  }, [formData.class_id, classes, sections]);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const response = await emploiAPI.getAll();
      setImages(response.data);
    } catch (error) {
      console.error('Error fetching emploi images:', error);
      setToast({ message: 'Failed to fetch emploi images', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await classesAPI.getAll();
      setClasses(response.data);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchSections = async () => {
    try {
      const response = await sectionsAPI.getAll();
      setSections(response.data);
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        setToast({ message: 'Image size must be less than 20MB', type: 'error' });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image_url: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const openAddModal = () => {
    setFormData({
      id: '',
      image_url: '',
      class_id: '',
      section_id: '',
    });
    setFilteredSections([]);
    setIsEditMode(false);
    setShowModal(true);
  };

  const openEditModal = (image) => {
    setFormData({
      id: image.id,
      image_url: image.image_url,
      class_id: image.class_id,
      section_id: image.section_id || '',
    });
    setIsEditMode(true);
    setShowModal(true);
  };

  const openViewModal = (imageUrl) => {
    setViewImage(imageUrl);
    setShowViewModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.image_url) {
      setToast({ message: 'Please select an image', type: 'error' });
      return;
    }

    if (!formData.class_id) {
      setToast({ message: 'Please select a class', type: 'error' });
      return;
    }

    if (filteredSections.length > 0 && !formData.section_id) {
      setToast({ message: 'Please select a section', type: 'error' });
      return;
    }

    try {
      const imageData = {
        image_url: formData.image_url,
        class_id: parseInt(formData.class_id),
        section_id: formData.section_id ? parseInt(formData.section_id) : null,
      };

      if (isEditMode) {
        await emploiAPI.update(formData.id, imageData);
        setToast({ message: 'Emploi image updated successfully! 📅', type: 'success' });
      } else {
        await emploiAPI.create(imageData);
        setToast({ message: 'Emploi image uploaded successfully! 📅', type: 'success' });
      }

      setShowModal(false);
      fetchImages();
    } catch (error) {
      console.error('Error saving emploi image:', error);
      setToast({ 
        message: error.response?.data?.message || 'Failed to save emploi image', 
        type: 'error' 
      });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this emploi image?')) {
      try {
        await emploiAPI.delete(id);
        setToast({ message: 'Emploi image deleted successfully! 🗑️', type: 'success' });
        fetchImages();
      } catch (error) {
        console.error('Error deleting emploi image:', error);
        setToast({ message: 'Failed to delete emploi image', type: 'error' });
      }
    }
  };

  if (loading) {
    return <div className="loading">Loading emploi images...</div>;
  }

  return (
    <div className="emploi-management">
      <div className="emploi-header">
        <h2>📅 Emploi Images</h2>
        <p>Manage schedule and timetable images for classes and sections</p>
      </div>

      <div className="emploi-controls">
        <button onClick={openAddModal} className="add-emploi-btn">
          ➕ Add Emploi Image
        </button>
      </div>

      <div className="emploi-table-container">
        <table className="emploi-table">
          <thead>
            <tr>
              <th>Class</th>
              <th>Section</th>
              <th>Image</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {images.length === 0 ? (
              <tr>
                <td colSpan="4" className="no-data">No emploi images found</td>
              </tr>
            ) : (
              images.map((image) => (
                <tr key={image.id}>
                  <td>{image.class_name}</td>
                  <td>{image.section_name || '-'}</td>
                  <td>
                    <img 
                      src={image.image_url} 
                      alt="Emploi" 
                      className="emploi-thumbnail"
                      onClick={() => openViewModal(image.image_url)}
                    />
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => openViewModal(image.image_url)}
                        className="view-btn"
                        title="View image"
                      >
                        👁️
                      </button>
                      <button
                        onClick={() => openEditModal(image)}
                        className="edit-btn"
                        title="Edit image"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(image.id)}
                        className="delete-btn"
                        title="Delete image"
                      >
                        🗑️
                      </button>
                    </div>
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
              <h3>{isEditMode ? 'Edit Emploi Image' : 'Add Emploi Image'}</h3>
              <button onClick={() => setShowModal(false)} className="close-btn">
                ✖
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Class *</label>
                <select
                  name="class_id"
                  value={formData.class_id}
                  onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                  required
                >
                  <option value="">Select Class</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              {filteredSections.length > 0 && (
                <div className="form-group">
                  <label>Section *</label>
                  <select
                    name="section_id"
                    value={formData.section_id}
                    onChange={(e) => setFormData({ ...formData, section_id: e.target.value })}
                    required
                  >
                    <option value="">Select Section</option>
                    {filteredSections.map((section) => (
                      <option key={section.id} value={section.id}>
                        {section.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label>Emploi Image *</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  required={!isEditMode}
                />
                <small>Maximum file size: 20MB</small>
                {formData.image_url && (
                  <div className="image-preview">
                    <img src={formData.image_url} alt="Preview" />
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowModal(false)} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  {isEditMode ? 'Update Image' : 'Upload Image'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewModal && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="view-modal-content" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowViewModal(false)} className="close-view-btn">
              ✖
            </button>
            <img src={viewImage} alt="Emploi Full View" className="full-image" />
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

export default EmploiManagement;
