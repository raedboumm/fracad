import React, { useState, useEffect } from 'react';
import { subjectsAPI, classesAPI, sectionsAPI } from '../services/api';
import '../styles/SubjectsManagement.css';

const SubjectsManagement = () => {
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [subjectsPerPage] = useState(5);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
    status: 'active',
    classes: [],
    sections: []
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [showSections, setShowSections] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  // Check if sections should be shown based on selected classes
  useEffect(() => {
    if (formData.classes.length > 0 && classes.length > 0) {
      const selectedClasses = classes.filter(c => formData.classes.includes(c.id));
      const needsSections = selectedClasses.some(c => {
        const className = c.name || '';
        return /2[èe]me.*lyc[ée]e/i.test(className) || 
               /3[èe]me.*lyc[ée]e/i.test(className) || 
               /4[èe]me.*lyc[ée]e/i.test(className) ||
               /bac/i.test(className) ||
               /baccalaur[ée]at/i.test(className);
      });
      setShowSections(needsSections);
      
      // Clear sections if not needed
      if (!needsSections && formData.sections.length > 0) {
        setFormData(prev => ({ ...prev, sections: [] }));
      }
    } else {
      setShowSections(false);
      setFormData(prev => ({ ...prev, sections: [] }));
    }
  }, [formData.classes, classes]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [subjectsResponse, classesResponse, sectionsResponse] = await Promise.all([
        subjectsAPI.getAll(),
        classesAPI.getAll(),
        sectionsAPI.getAll()
      ]);
      setSubjects(subjectsResponse.data);
      setClasses(classesResponse.data);
      setSections(sectionsResponse.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (subject = null) => {
    if (subject) {
      setEditingSubject(subject);
      setFormData({
        name: subject.name || '',
        description: subject.description || '',
        image_url: subject.image_url || '',
        status: subject.status || 'active',
        classes: subject.classes ? subject.classes.map(c => c.id) : [],
        sections: subject.sections ? subject.sections.map(s => s.id) : []
      });
      setImagePreview(subject.image_url || '');
    } else {
      setEditingSubject(null);
      setFormData({
        name: '',
        description: '',
        image_url: '',
        status: 'active',
        classes: [],
        sections: []
      });
      setImagePreview('');
    }
    setImageFile(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSubject(null);
    setFormData({
      name: '',
      description: '',
      image_url: '',
      status: 'active',
      classes: [],
      sections: []
    });
    setImageFile(null);
    setImagePreview('');
    setError('');
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Image size should be less than 2MB');
        e.target.value = '';
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setFormData({
          ...formData,
          image_url: reader.result
        });
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const handleClassChange = (classId) => {
    const updatedClasses = formData.classes.includes(classId)
      ? formData.classes.filter(id => id !== classId)
      : [...formData.classes, classId];
    
    setFormData({
      ...formData,
      classes: updatedClasses
    });
  };

  const handleSectionChange = (sectionId) => {
    const updatedSections = formData.sections.includes(sectionId)
      ? formData.sections.filter(id => id !== sectionId)
      : [...formData.sections, sectionId];
    
    setFormData({
      ...formData,
      sections: updatedSections
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Submitting formData:', formData);
      console.log('Image URL length:', formData.image_url?.length);
      
      if (editingSubject) {
        await subjectsAPI.update(editingSubject.id, formData);
      } else {
        await subjectsAPI.create(formData);
      }
      fetchData();
      handleCloseModal();
    } catch (err) {
      console.error('Submit error:', err);
      setError(err.response?.data?.message || 'Failed to save subject');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this subject?')) {
      try {
        await subjectsAPI.delete(id);
        fetchData();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete subject');
      }
    }
  };

  const filteredSubjects = subjects.filter(subject =>
    subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (subject.description && subject.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const indexOfLastSubject = currentPage * subjectsPerPage;
  const indexOfFirstSubject = indexOfLastSubject - subjectsPerPage;
  const currentSubjects = filteredSubjects.slice(indexOfFirstSubject, indexOfLastSubject);
  const totalPages = Math.ceil(filteredSubjects.length / subjectsPerPage);

  // Group classes by level
  const groupedClasses = classes.reduce((acc, classItem) => {
    const levelName = classItem.level_name || 'Other';
    if (!acc[levelName]) {
      acc[levelName] = [];
    }
    acc[levelName].push(classItem);
    return acc;
  }, {});

  if (loading) return <div className="loading">Loading subjects...</div>;

  return (
    <div className="subjects-management">
      <div className="subjects-container">
        <div className="subjects-header">
          <h2>Subjects Management</h2>
          <button className="add-subject-btn" onClick={() => handleOpenModal()}>
            Add New Subject
          </button>
        </div>

        <div className="subjects-controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search subjects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {error && !showModal && <div className="error-message">{error}</div>}

        <div className="subjects-table-container">
          <table className="subjects-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Icon</th>
                <th>Description</th>
                <th>Status</th>
                <th>Classes</th>
                <th>Sections</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentSubjects.length === 0 ? (
                <tr>
                  <td colSpan="7" className="no-data">
                    {searchQuery ? 'No subjects found matching your search' : 'No subjects available. Add your first subject!'}
                  </td>
                </tr>
              ) : (
                currentSubjects.map((subject) => (
                  <tr key={subject.id}>
                    <td className="subject-name">{subject.name}</td>
                    <td className="subject-icon">
                      {subject.image_url && subject.image_url.trim() !== '' ? (
                        <img 
                          src={subject.image_url} 
                          alt={subject.name}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = '<span class="no-icon">📚</span>';
                          }}
                        />
                      ) : (
                        <span className="no-icon">📚</span>
                      )}
                    </td>
                    <td className="subject-description">
                      {subject.description || '-'}
                    </td>
                    <td>
                      <span className={`status-badge ${subject.status}`}>
                        {subject.status}
                      </span>
                    </td>
                    <td className="subject-classes">
                      {subject.classes && subject.classes.length > 0 ? (
                        <div className="badge-container">
                          {subject.classes.map((classItem, index) => (
                            <span key={index} className="class-badge">
                              {classItem.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="subject-sections">
                      {subject.sections && subject.sections.length > 0 ? (
                        <div className="badge-container">
                          {subject.sections.map((section, index) => (
                            <span key={index} className="section-badge">
                              {section.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="action-btn edit-btn"
                          onClick={() => handleOpenModal(subject)}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          className="action-btn delete-btn"
                          onClick={() => handleDelete(subject.id)}
                          title="Delete"
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

        {totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="pagination-btn"
            >
              ‹
            </button>
            <span className="pagination-info">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="pagination-btn"
            >
              ›
            </button>
          </div>
        )}

        {/* Add/Edit Subject Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingSubject ? 'Edit Subject' : 'Add New Subject'}</h3>
                <button className="close-btn" onClick={handleCloseModal}>
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="modal-body">
                {error && <div className="error-message">{error}</div>}

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="status">Status</label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="form-group full-width">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="3"
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="icon_upload">Upload Icon Image</label>
                  <div className="file-input-wrapper">
                    <input
                      type="file"
                      id="icon_upload"
                      name="icon_upload"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="file-input"
                    />
                    <label htmlFor="icon_upload" className="file-input-label">
                      <span className="file-icon">📁</span>
                      <span className="file-text">{imageFile ? imageFile.name : 'Choose Image File'}</span>
                    </label>
                  </div>
                  <p className="helper-text">Upload JPG, PNG, or SVG image (Max 2MB)</p>
                </div>

                {imagePreview && (
                  <div className="form-group full-width">
                    <label>Icon Preview</label>
                    <div className="image-preview-container">
                      <img src={imagePreview} alt="Icon preview" className="image-preview" />
                    </div>
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label>Classes</label>
                    <div className="checkbox-group">
                      {Object.entries(groupedClasses).map(([levelName, levelClasses]) => (
                        <div key={levelName} className="level-group">
                          <h4 className="level-header">{levelName}</h4>
                          {levelClasses.map((classItem) => (
                            <label key={classItem.id} className="checkbox-label">
                              <input
                                type="checkbox"
                                checked={formData.classes.includes(classItem.id)}
                                onChange={() => handleClassChange(classItem.id)}
                              />
                              <span>{classItem.name}</span>
                            </label>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>

                  {showSections && (
                    <div className="form-group">
                      <label>Sections *</label>
                      <p className="helper-text">Required for 2ème, 3ème, 4ème Année Lycée</p>
                      <div className="checkbox-group">
                        {sections.map((section) => (
                          <label key={section.id} className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={formData.sections.includes(section.id)}
                            onChange={() => handleSectionChange(section.id)}
                          />
                          <span>{section.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  )}
                </div>

                <div className="modal-actions">
                  <button type="button" className="cancel-btn" onClick={handleCloseModal}>
                    Cancel
                  </button>
                  <button type="submit" className="submit-btn">
                    {editingSubject ? 'Update Subject' : 'Add Subject'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubjectsManagement;
