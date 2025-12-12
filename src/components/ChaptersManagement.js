import React, { useState, useEffect } from 'react';
import { chaptersAPI, subjectsAPI, classesAPI, sectionsAPI } from '../services/api';
import '../styles/ChaptersManagement.css';

const ChaptersManagement = () => {
  const [chapters, setChapters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingChapter, setEditingChapter] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [chaptersPerPage] = useState(5);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subject_id: '',
    status: 'active',
    academic_years: [],
    classes: [],
    sections: []
  });
  const [newAcademicYear, setNewAcademicYear] = useState('');
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
               /4[èe]me.*lyc[ée]e/i.test(className);
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
      const [chaptersResponse, subjectsResponse, classesResponse, sectionsResponse] = await Promise.all([
        chaptersAPI.getAll(),
        subjectsAPI.getAll(),
        classesAPI.getAll(),
        sectionsAPI.getAll()
      ]);
      setChapters(chaptersResponse.data);
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

  const handleOpenModal = (chapter = null) => {
    if (chapter) {
      setEditingChapter(chapter);
      setFormData({
        name: chapter.name || '',
        description: chapter.description || '',
        subject_id: chapter.subject_id || '',
        status: chapter.status || 'active',
        academic_years: chapter.academic_years || [],
        classes: chapter.classes ? chapter.classes.map(c => c.id) : [],
        sections: chapter.sections ? chapter.sections.map(s => s.id) : []
      });
    } else {
      setEditingChapter(null);
      setFormData({
        name: '',
        description: '',
        subject_id: '',
        status: 'active',
        academic_years: [],
        classes: [],
        sections: []
      });
    }
    setNewAcademicYear('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingChapter(null);
    setFormData({
      name: '',
      description: '',
      subject_id: '',
      status: 'active',
      academic_years: [],
      classes: [],
      sections: []
    });
    setNewAcademicYear('');
    setError('');
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAddAcademicYear = () => {
    if (newAcademicYear && !formData.academic_years.includes(newAcademicYear)) {
      setFormData({
        ...formData,
        academic_years: [...formData.academic_years, newAcademicYear]
      });
      setNewAcademicYear('');
    }
  };

  const handleRemoveAcademicYear = (year) => {
    setFormData({
      ...formData,
      academic_years: formData.academic_years.filter(y => y !== year)
    });
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
      if (editingChapter) {
        await chaptersAPI.update(editingChapter.id, formData);
      } else {
        await chaptersAPI.create(formData);
      }
      fetchData();
      handleCloseModal();
    } catch (err) {
      console.error('Submit error:', err);
      setError(err.response?.data?.message || 'Failed to save chapter');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this chapter?')) {
      try {
        await chaptersAPI.delete(id);
        fetchData();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete chapter');
      }
    }
  };

  const filteredChapters = chapters.filter(chapter =>
    chapter.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (chapter.subject_name && chapter.subject_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const indexOfLastChapter = currentPage * chaptersPerPage;
  const indexOfFirstChapter = indexOfLastChapter - chaptersPerPage;
  const currentChapters = filteredChapters.slice(indexOfFirstChapter, indexOfLastChapter);
  const totalPages = Math.ceil(filteredChapters.length / chaptersPerPage);

  // Group classes by level for the form
  const groupedClasses = classes.reduce((acc, classItem) => {
    const levelName = classItem.level_name || 'Other';
    if (!acc[levelName]) {
      acc[levelName] = [];
    }
    acc[levelName].push(classItem);
    return acc;
  }, {});

  if (loading) return <div className="loading">Loading chapters...</div>;

  return (
    <div className="chapters-management">
      <div className="chapters-container">
        <div className="chapters-header">
          <h2>Chapters Management</h2>
          <button onClick={() => handleOpenModal()} className="add-chapter-btn">
            Add New Chapter
          </button>
        </div>

        <div className="chapters-controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search chapters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="chapters-table-container">
          <table className="chapters-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Subject</th>
                <th>Academic Years</th>
                <th>Classes</th>
                <th>Sections</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentChapters.length === 0 ? (
                <tr>
                  <td colSpan="7" className="no-data">
                    {searchQuery ? 'No chapters found matching your search' : 'No chapters available. Add your first chapter!'}
                  </td>
                </tr>
              ) : (
                currentChapters.map((chapter) => (
                  <tr key={chapter.id}>
                    <td className="chapter-name">{chapter.name}</td>
                    <td className="chapter-subject">{chapter.subject_name || '-'}</td>
                    <td className="chapter-years">
                      <div className="badge-container">
                        {chapter.academic_years && chapter.academic_years.length > 0 ? (
                          chapter.academic_years.map((year, index) => (
                            <span key={index} className="year-badge">
                              {year}
                            </span>
                          ))
                        ) : (
                          '-'
                        )}
                      </div>
                    </td>
                    <td className="chapter-classes">
                      <div className="badge-container">
                        {chapter.classes && chapter.classes.length > 0 ? (
                          chapter.classes.map((classItem, index) => (
                            <span key={index} className="class-badge">
                              {classItem.name}
                            </span>
                          ))
                        ) : (
                          '-'
                        )}
                      </div>
                    </td>
                    <td className="chapter-sections">
                      <div className="badge-container">
                        {chapter.sections && chapter.sections.length > 0 ? (
                          chapter.sections.map((section, index) => (
                            <span key={index} className="section-badge">
                              {section.name}
                            </span>
                          ))
                        ) : (
                          '-'
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${chapter.status}`}>
                        {chapter.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => handleOpenModal(chapter)}
                          className="action-btn edit-btn"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(chapter.id)}
                          className="action-btn delete-btn"
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

        {/* Add/Edit Chapter Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingChapter ? 'Edit Chapter' : 'Add New Chapter'}</h3>
                <button className="close-btn" onClick={handleCloseModal}>
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="modal-body">
                {error && <div className="error-message">{error}</div>}

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Chapter Name *</label>
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
                    <label htmlFor="subject_id">Subject *</label>
                    <select
                      id="subject_id"
                      name="subject_id"
                      value={formData.subject_id}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Subject</option>
                      {subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name}
                        </option>
                      ))}
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
                  <label>Academic Years</label>
                  <div className="academic-year-input">
                    <input
                      type="text"
                      value={newAcademicYear}
                      onChange={(e) => setNewAcademicYear(e.target.value)}
                      placeholder="YYYY-YYYY (e.g., 2024-2025)"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddAcademicYear();
                        }
                      }}
                    />
                    <button type="button" onClick={handleAddAcademicYear} className="add-year-btn">
                      +
                    </button>
                  </div>
                  <div className="selected-years">
                    {formData.academic_years.map((year, index) => (
                      <span key={index} className="year-tag">
                        {year}
                        <button type="button" onClick={() => handleRemoveAcademicYear(year)}>×</button>
                      </span>
                    ))}
                  </div>
                </div>

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
                      <p className="helper-text">Required for 2ème, 3ème, 4ème Année Lycée</p>
                    </div>
                  )}
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

                <div className="modal-actions">
                  <button type="button" onClick={handleCloseModal} className="cancel-btn">
                    Cancel
                  </button>
                  <button type="submit" className="submit-btn">
                    {editingChapter ? 'Update Chapter' : 'Add Chapter'}
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

export default ChaptersManagement;
