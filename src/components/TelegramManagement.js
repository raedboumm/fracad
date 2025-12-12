import React, { useState, useEffect } from 'react';
import { telegramAPI, classesAPI, sectionsAPI } from '../services/api';
import Toast from './Toast';
import '../styles/TelegramManagement.css';

const TelegramManagement = () => {
  const [links, setLinks] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    id: '',
    url: '',
    class_id: '',
    section_id: '',
  });

  const [filteredSections, setFilteredSections] = useState([]);

  useEffect(() => {
    fetchLinks();
    fetchClasses();
    fetchSections();
  }, []);

  // Filter sections when class changes
  useEffect(() => {
    console.log('Telegram - formData.class_id:', formData.class_id);
    console.log('Telegram - sections length:', sections.length);
    console.log('Telegram - classes length:', classes.length);
    
    if (formData.class_id && sections.length > 0 && classes.length > 0) {
      const selectedClass = classes.find(c => c.id === parseInt(formData.class_id));
      console.log('Telegram - Selected class:', selectedClass);
      
      if (selectedClass) {
        // Check if class name contains 2ème, 3ème, or 4ème (secondary years with sections)
        const className = selectedClass.name || '';
        const needsSections = /2[èe]me/i.test(className) || 
                            /3[èe]me/i.test(className) || 
                            /4[èe]me/i.test(className);
        
        console.log('Telegram - Class name:', className);
        console.log('Telegram - Needs sections:', needsSections);
        
        if (needsSections) {
          // For Lycée classes (2ème, 3ème, 4ème), show Lycée sections
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
          console.log('Telegram - Lycée sections found:', lyceeSections);
          console.log('Telegram - Setting filtered sections, length:', lyceeSections.length);
          setFilteredSections(lyceeSections);
          
          // Reset section if it's not in the filtered list
          if (formData.section_id && !lyceeSections.find(s => s.id === parseInt(formData.section_id))) {
            setFormData(prev => ({ ...prev, section_id: '' }));
          }
        } else {
          console.log('Telegram - No sections needed for this class');
          // For other classes, no sections needed
          setFilteredSections([]);
          setFormData(prev => ({ ...prev, section_id: '' }));
        }
      }
    } else {
      console.log('Telegram - Clearing sections (no class selected or data not loaded)');
      setFilteredSections([]);
      setFormData(prev => ({ ...prev, section_id: '' }));
    }
  }, [formData.class_id, classes, sections]);

  const fetchLinks = async () => {
    try {
      setLoading(true);
      const response = await telegramAPI.getAll();
      setLinks(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching telegram links:', error);
      setToast({ message: 'Failed to fetch telegram links', type: 'error' });
      setLinks([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await classesAPI.getAll();
      setClasses(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching classes:', error);
      setClasses([]);
    }
  };

  const fetchSections = async () => {
    try {
      const response = await sectionsAPI.getAll();
      setSections(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching sections:', error);
      setSections([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const openAddModal = () => {
    setFormData({
      id: '',
      url: '',
      class_id: '',
      section_id: '',
    });
    setFilteredSections([]);
    setIsEditMode(false);
    setShowModal(true);
  };

  const openEditModal = (link) => {
    setFormData({
      id: link.id,
      url: link.url,
      class_id: link.class_id,
      section_id: link.section_id,
    });
    setIsEditMode(true);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.url.trim()) {
      setToast({ message: 'Please enter a telegram URL', type: 'error' });
      return;
    }

    if (!formData.class_id) {
      setToast({ message: 'Please select a class', type: 'error' });
      return;
    }

    // Only validate section if sections are available (2ème, 3ème, 4ème année)
    if (filteredSections.length > 0 && !formData.section_id) {
      setToast({ message: 'Please select a section', type: 'error' });
      return;
    }

    try {
      const linkData = {
        url: formData.url,
        class_id: parseInt(formData.class_id),
        section_id: formData.section_id ? parseInt(formData.section_id) : null,
      };

      if (isEditMode) {
        await telegramAPI.update(formData.id, linkData);
        setToast({ message: 'Telegram link updated successfully! 📱', type: 'success' });
      } else {
        await telegramAPI.create(linkData);
        setToast({ message: 'Telegram link created successfully! 📱', type: 'success' });
      }

      setShowModal(false);
      fetchLinks();
    } catch (error) {
      console.error('Error saving telegram link:', error);
      setToast({ 
        message: error.response?.data?.message || 'Failed to save telegram link', 
        type: 'error' 
      });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this telegram link?')) {
      try {
        await telegramAPI.delete(id);
        setToast({ message: 'Telegram link deleted successfully! 🗑️', type: 'success' });
        fetchLinks();
      } catch (error) {
        console.error('Error deleting telegram link:', error);
        setToast({ message: 'Failed to delete telegram link', type: 'error' });
      }
    }
  };

  if (loading) {
    return <div className="loading">Loading telegram links...</div>;
  }

  return (
    <div className="telegram-management">
      <div className="telegram-header">
        <h2>📱 Telegram</h2>
        <p>Manage Telegram group links for classes and sections</p>
      </div>

      <div className="telegram-controls">
        <button onClick={openAddModal} className="add-link-btn">
          ➕ Add Link
        </button>
      </div>

      <div className="telegram-table-container">
        <table className="telegram-table">
          <thead>
            <tr>
              <th>Class</th>
              <th>Section</th>
              <th>URL</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {links.length === 0 ? (
              <tr>
                <td colSpan="4" className="no-data">No telegram links found</td>
              </tr>
            ) : (
              links.map((link) => (
                <tr key={link.id}>
                  <td>{link.class_name}</td>
                  <td>{link.section_name}</td>
                  <td>
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="telegram-url">
                      {link.url}
                    </a>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => openEditModal(link)}
                        className="edit-btn"
                        title="Edit link"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(link.id)}
                        className="delete-btn"
                        title="Delete link"
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
              <h3>{isEditMode ? 'Edit Telegram Link' : 'Add Telegram Link'}</h3>
              <button onClick={() => setShowModal(false)} className="close-btn">
                ✖
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Telegram URL *</label>
                <input
                  type="url"
                  name="url"
                  value={formData.url}
                  onChange={handleInputChange}
                  placeholder="https://t.me/..."
                  required
                />
              </div>

              <div className="form-group">
                <label>Class *</label>
                <select
                  name="class_id"
                  value={formData.class_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select class</option>
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
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select section</option>
                    {filteredSections.map((section) => (
                      <option key={section.id} value={section.id}>
                        {section.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-actions">
                <button type="button" onClick={() => setShowModal(false)} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  {isEditMode ? 'Update Link' : 'Add Link'}
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

export default TelegramManagement;
