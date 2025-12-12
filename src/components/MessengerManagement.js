import React, { useState, useEffect } from 'react';
import { messengerAPI, classesAPI, sectionsAPI } from '../services/api';
import Toast from './Toast';
import '../styles/MessengerManagement.css';

const MessengerManagement = () => {
  const [groups, setGroups] = useState([]);
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
    fetchGroups();
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

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await messengerAPI.getAll();
      setGroups(response.data);
    } catch (error) {
      console.error('Error fetching messenger groups:', error);
      setToast({ message: 'Failed to fetch messenger groups', type: 'error' });
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

  const openEditModal = (group) => {
    setFormData({
      id: group.id,
      url: group.url,
      class_id: group.class_id,
      section_id: group.section_id,
    });
    setIsEditMode(true);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.url.trim()) {
      setToast({ message: 'Please enter a messenger group link', type: 'error' });
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
      const groupData = {
        url: formData.url,
        class_id: parseInt(formData.class_id),
        section_id: formData.section_id ? parseInt(formData.section_id) : null,
      };

      if (isEditMode) {
        await messengerAPI.update(formData.id, groupData);
        setToast({ message: 'Messenger group updated successfully! 💬', type: 'success' });
      } else {
        await messengerAPI.create(groupData);
        setToast({ message: 'Messenger group created successfully! 💬', type: 'success' });
      }

      setShowModal(false);
      fetchGroups();
    } catch (error) {
      console.error('Error saving messenger group:', error);
      setToast({ 
        message: error.response?.data?.message || 'Failed to save messenger group', 
        type: 'error' 
      });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this messenger group?')) {
      try {
        await messengerAPI.delete(id);
        setToast({ message: 'Messenger group deleted successfully! 🗑️', type: 'success' });
        fetchGroups();
      } catch (error) {
        console.error('Error deleting messenger group:', error);
        setToast({ message: 'Failed to delete messenger group', type: 'error' });
      }
    }
  };

  if (loading) {
    return <div className="loading">Loading messenger groups...</div>;
  }

  return (
    <div className="messenger-management">
      <div className="messenger-header">
        <h2>💬 Messenger Groups</h2>
        <p>Manage Facebook Messenger group links for classes and sections</p>
      </div>

      <div className="messenger-controls">
        <button onClick={openAddModal} className="add-group-btn">
          ➕ Add Group
        </button>
      </div>

      <div className="messenger-table-container">
        <table className="messenger-table">
          <thead>
            <tr>
              <th>Class</th>
              <th>Section</th>
              <th>URL</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {groups.length === 0 ? (
              <tr>
                <td colSpan="4" className="no-data">No messenger groups found</td>
              </tr>
            ) : (
              groups.map((group) => (
                <tr key={group.id}>
                  <td>{group.class_name}</td>
                  <td>{group.section_name || '-'}</td>
                  <td>
                    <a href={group.url} target="_blank" rel="noopener noreferrer" className="messenger-url">
                      {group.url}
                    </a>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => openEditModal(group)}
                        className="edit-btn"
                        title="Edit group"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(group.id)}
                        className="delete-btn"
                        title="Delete group"
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
              <h3>{isEditMode ? 'Edit Messenger Group' : 'Add Messenger Group'}</h3>
              <button onClick={() => setShowModal(false)} className="close-btn">
                ✖
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Messenger Group Link *</label>
                <input
                  type="url"
                  name="url"
                  value={formData.url}
                  onChange={handleInputChange}
                  placeholder="https://m.me/your-group-link"
                  required
                />
                <small>Enter the Facebook Messenger group link</small>
              </div>

              <div className="form-group">
                <label>Class *</label>
                <select
                  name="class_id"
                  value={formData.class_id}
                  onChange={handleInputChange}
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
                  {isEditMode ? 'Update Group' : 'Add Group'}
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

export default MessengerManagement;
