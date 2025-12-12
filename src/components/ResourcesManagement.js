import React, { useState, useEffect } from 'react';
import { resourcesAPI, subjectsAPI, levelsAPI, chaptersAPI, classesAPI, sectionsAPI } from '../services/api';
import './ResourcesManagement.css';

const ResourcesManagement = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingResource, setViewingResource] = useState(null);
  const [editingResource, setEditingResource] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showSections, setShowSections] = useState(false);

  // Dropdown data
  const [subjects, setSubjects] = useState([]);
  const [levels, setLevels] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);

  // Form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'video',
    subject_id: '',
    chapter_id: '',
    level_ids: [],
    class_ids: [],
    section_ids: [],
    academic_year: '2025-2026',
    duration_seconds: '',
    display_order: 0,
    status: 'active'
  });
  const [file, setFile] = useState(null);

  useEffect(() => {
    fetchResources();
    fetchDropdownData();
  }, []);

  // Check if sections should be shown based on selected classes
  useEffect(() => {
    if (formData.class_ids.length > 0 && classes.length > 0) {
      const selectedClasses = classes.filter(c => formData.class_ids.includes(c.id));
      const needsSections = selectedClasses.some(c => c.requires_section === 1);
      setShowSections(needsSections);
      
      if (!needsSections && formData.section_ids.length > 0) {
        setFormData(prev => ({ ...prev, section_ids: [] }));
      }
    } else {
      setShowSections(false);
      setFormData(prev => ({ ...prev, section_ids: [] }));
    }
  }, [formData.class_ids, classes]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const response = await resourcesAPI.getAll();
      const data = response.data || response;
      setResources(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching resources:', error);
      setStatusMessage({ type: 'error', text: 'Error loading resources' });
      setResources([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const [subjectsRes, levelsRes, chaptersRes, classesRes, sectionsRes] = await Promise.all([
        subjectsAPI.getAll(),
        levelsAPI.getAll(),
        chaptersAPI.getAll(),
        classesAPI.getAll(),
        sectionsAPI.getAll()
      ]);
      setSubjects(Array.isArray(subjectsRes.data) ? subjectsRes.data : []);
      setLevels(Array.isArray(levelsRes.data) ? levelsRes.data : []);
      setChapters(Array.isArray(chaptersRes.data) ? chaptersRes.data : []);
      setClasses(Array.isArray(classesRes.data) ? classesRes.data : []);
      setSections(Array.isArray(sectionsRes.data) ? sectionsRes.data : []);
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (field, id) => {
    const currentIds = formData[field];
    if (currentIds.includes(id)) {
      setFormData({
        ...formData,
        [field]: currentIds.filter(item => item !== id)
      });
    } else {
      setFormData({
        ...formData,
        [field]: [...currentIds, id]
      });
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type
      if (formData.type === 'video' && !selectedFile.type.startsWith('video/')) {
        setStatusMessage({ type: 'error', text: 'Please select a video file' });
        return;
      }
      if (formData.type === 'pdf' && selectedFile.type !== 'application/pdf') {
        setStatusMessage({ type: 'error', text: 'Please select a PDF file' });
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title || !formData.subject_id) {
      setStatusMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    if (formData.level_ids.length === 0) {
      setStatusMessage({ type: 'error', text: 'Please select at least one level' });
      return;
    }

    if (formData.class_ids.length === 0) {
      setStatusMessage({ type: 'error', text: 'Please select at least one class' });
      return;
    }

    if (showSections && formData.section_ids.length === 0) {
      setStatusMessage({ type: 'error', text: 'Please select at least one section' });
      return;
    }

    if (!editingResource && !file) {
      setStatusMessage({ type: 'error', text: 'Please select a file to upload' });
      return;
    }

    try {
      setUploading(true);
      
      // Create FormData for file upload
      const uploadData = new FormData();
      uploadData.append('title', formData.title);
      uploadData.append('description', formData.description || '');
      uploadData.append('type', formData.type);
      uploadData.append('subject_id', formData.subject_id);
      uploadData.append('chapter_id', formData.chapter_id || '');
      uploadData.append('academic_year', formData.academic_year);
      uploadData.append('duration_seconds', formData.duration_seconds || '');
      uploadData.append('display_order', formData.display_order);
      uploadData.append('status', formData.status);
      uploadData.append('level_ids', JSON.stringify(formData.level_ids));
      uploadData.append('class_ids', JSON.stringify(formData.class_ids));
      uploadData.append('section_ids', JSON.stringify(formData.section_ids));
      
      if (file) {
        uploadData.append('file', file);
      }

      if (editingResource) {
        await resourcesAPI.update(editingResource.id, uploadData, (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        });
        setStatusMessage({ type: 'success', text: 'Resource updated successfully' });
      } else {
        await resourcesAPI.create(uploadData, (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        });
        setStatusMessage({ type: 'success', text: 'Resource created successfully' });
      }

      fetchResources();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving resource:', error);
      setStatusMessage({ type: 'error', text: error.response?.data?.message || 'Error saving resource' });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleEdit = (resource) => {
    setEditingResource(resource);
    setFormData({
      title: resource.title,
      description: resource.description || '',
      type: resource.type,
      subject_id: resource.subject_id,
      chapter_id: resource.chapter_id || '',
      level_ids: resource.level_ids || [],
      class_ids: resource.class_ids || [],
      section_ids: resource.section_ids || [],
      academic_year: resource.academic_year,
      duration_seconds: resource.duration_seconds || '',
      display_order: resource.display_order || 0,
      status: resource.status
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) {
      return;
    }

    try {
      await resourcesAPI.delete(id);
      setStatusMessage({ type: 'success', text: 'Resource deleted successfully' });
      fetchResources();
    } catch (error) {
      console.error('Error deleting resource:', error);
      setStatusMessage({ type: 'error', text: 'Error deleting resource' });
    }
  };

  const handleView = (resource) => {
    setViewingResource(resource);
    setShowViewModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingResource(null);
    setFormData({
      title: '',
      description: '',
      type: 'video',
      subject_id: '',
      chapter_id: '',
      level_ids: [],
      class_ids: [],
      section_ids: [],
      academic_year: '2025-2026',
      duration_seconds: '',
      display_order: 0,
      status: 'active'
    });
    setFile(null);
    setUploadProgress(0);
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setViewingResource(null);
  };

  // Filter classes based on selected levels
  const getFilteredClasses = () => {
    if (formData.level_ids.length === 0) return [];
    return classes.filter(c => formData.level_ids.includes(c.level_id));
  };

  // Filter sections based on selected classes
  const getFilteredSections = () => {
    if (formData.class_ids.length === 0) return [];
    // Get the first selected class's section IDs
    const selectedClass = classes.find(c => formData.class_ids.includes(c.id));
    if (!selectedClass) return sections;
    return sections;
  };

  if (loading) {
    return <div className="resources-management"><p>Loading resources...</p></div>;
  }

  return (
    <div className="resources-management">
      <div className="resources-header">
        <h2>Resources Management</h2>
        <button className="btn-add" onClick={() => setShowModal(true)}>
          + Add Resource
        </button>
      </div>

      {statusMessage && (
        <div className={`status-message ${statusMessage.type}`}>
          {statusMessage.text}
          <button onClick={() => setStatusMessage(null)}>×</button>
        </div>
      )}

      <div className="resources-table-container">
        <table className="resources-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Type</th>
              <th>Subject</th>
              <th>Levels</th>
              <th>Classes</th>
              <th>Sections</th>
              <th>Academic Year</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {resources.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center' }}>No resources found</td>
              </tr>
            ) : (
              resources.map(resource => (
                <tr key={resource.id}>
                  <td>{resource.title}</td>
                  <td>
                    <span className={`badge badge-${resource.type}`}>
                      {resource.type}
                    </span>
                  </td>
                  <td>{resource.subject_name}</td>
                  <td>{resource.level_names || 'N/A'}</td>
                  <td>{resource.class_names || 'N/A'}</td>
                  <td>{resource.section_names || 'All'}</td>
                  <td>{resource.academic_year}</td>
                  <td>
                    <span className={`status-badge status-${resource.status}`}>
                      {resource.status}
                    </span>
                  </td>
                  <td className="actions">
                    <button className="btn-view" onClick={() => handleView(resource)}>View</button>
                    <button className="btn-edit" onClick={() => handleEdit(resource)}>Edit</button>
                    <button className="btn-delete" onClick={() => handleDelete(resource.id)}>Delete</button>
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
              <h3>{editingResource ? 'Edit Resource' : 'Add New Resource'}</h3>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="resource-form">
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Type *</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    required
                    disabled={editingResource}
                  >
                    <option value="video">Video</option>
                    <option value="pdf">PDF</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Subject *</label>
                  <select
                    name="subject_id"
                    value={formData.subject_id}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(subject => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Chapter (Optional)</label>
                  <select
                    name="chapter_id"
                    value={formData.chapter_id}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Chapter</option>
                    {chapters.filter(ch => ch.subject_id === parseInt(formData.subject_id)).map(chapter => (
                      <option key={chapter.id} value={chapter.id}>
                        {chapter.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Academic Year *</label>
                  <input
                    type="text"
                    name="academic_year"
                    value={formData.academic_year}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              {/* Levels Selection */}
              <div className="form-group">
                <label>Levels * (Select one or more)</label>
                <div className="checkbox-group">
                  {levels.map(level => (
                    <label key={level.id} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.level_ids.includes(level.id)}
                        onChange={() => handleCheckboxChange('level_ids', level.id)}
                      />
                      {level.name}
                    </label>
                  ))}
                </div>
              </div>

              {/* Classes Selection */}
              {formData.level_ids.length > 0 && (
                <div className="form-group">
                  <label>Classes * (Select one or more)</label>
                  <div className="checkbox-group">
                    {getFilteredClasses().map(cls => (
                      <label key={cls.id} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.class_ids.includes(cls.id)}
                          onChange={() => handleCheckboxChange('class_ids', cls.id)}
                        />
                        {cls.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Sections Selection */}
              {showSections && (
                <div className="form-group">
                  <label>Sections * (Select one or more)</label>
                  <div className="checkbox-group">
                    {getFilteredSections().map(section => (
                      <label key={section.id} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.section_ids.includes(section.id)}
                          onChange={() => handleCheckboxChange('section_ids', section.id)}
                        />
                        {section.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {formData.type === 'video' && (
                <div className="form-group">
                  <label>Duration (seconds)</label>
                  <input
                    type="number"
                    name="duration_seconds"
                    value={formData.duration_seconds}
                    onChange={handleInputChange}
                  />
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>Display Order</label>
                  <input
                    type="number"
                    name="display_order"
                    value={formData.display_order}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>File {!editingResource && '*'}</label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept={formData.type === 'video' ? 'video/*' : 'application/pdf'}
                  required={!editingResource}
                />
                {file && <p className="file-name">Selected: {file.name}</p>}
              </div>

              {uploading && uploadProgress > 0 && (
                <div className="upload-progress">
                  <div className="progress-bar-container">
                    <div className="progress-bar" style={{ width: `${uploadProgress}%` }}>
                      {uploadProgress}%
                    </div>
                  </div>
                  <p className="progress-text">
                    {uploadProgress < 100 ? 'Uploading...' : 'Processing...'}
                  </p>
                </div>
              )}

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={handleCloseModal} disabled={uploading}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit" disabled={uploading}>
                  {uploading ? (uploadProgress < 100 ? `Uploading ${uploadProgress}%` : 'Processing...') : (editingResource ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && viewingResource && (
        <div className="modal-overlay" onClick={handleCloseViewModal}>
          <div className="modal-content view-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>View Resource: {viewingResource.title}</h3>
              <button className="modal-close" onClick={handleCloseViewModal}>×</button>
            </div>

            <div className="view-modal-body">
              <div className="resource-details">
                <div className="detail-row">
                  <strong>Type:</strong> 
                  <span className={`badge badge-${viewingResource.type}`}>{viewingResource.type}</span>
                </div>
                <div className="detail-row">
                  <strong>Subject:</strong> {viewingResource.subject_name}
                </div>
                {viewingResource.chapter_name && (
                  <div className="detail-row">
                    <strong>Chapter:</strong> {viewingResource.chapter_name}
                  </div>
                )}
                <div className="detail-row">
                  <strong>Levels:</strong> {viewingResource.level_names || 'N/A'}
                </div>
                <div className="detail-row">
                  <strong>Classes:</strong> {viewingResource.class_names || 'N/A'}
                </div>
                {viewingResource.section_names && (
                  <div className="detail-row">
                    <strong>Sections:</strong> {viewingResource.section_names}
                  </div>
                )}
                {viewingResource.description && (
                  <div className="detail-row">
                    <strong>Description:</strong>
                    <p>{viewingResource.description}</p>
                  </div>
                )}
                <div className="detail-row">
                  <strong>Academic Year:</strong> {viewingResource.academic_year}
                </div>
                {viewingResource.duration_seconds && (
                  <div className="detail-row">
                    <strong>Duration:</strong> {Math.floor(viewingResource.duration_seconds / 60)}:{(viewingResource.duration_seconds % 60).toString().padStart(2, '0')}
                  </div>
                )}
                {viewingResource.file_size_mb && (
                  <div className="detail-row">
                    <strong>File Size:</strong> {viewingResource.file_size_mb} MB
                  </div>
                )}
                <div className="detail-row">
                  <strong>Status:</strong> 
                  <span className={`status-badge status-${viewingResource.status}`}>
                    {viewingResource.status}
                  </span>
                </div>
              </div>

              <div className="resource-preview">
                {viewingResource.type === 'video' ? (
                  <div className="video-preview-container">
                    <h4>Video Preview:</h4>
                    <video
                      controls
                      controlsList="nodownload"
                      style={{ width: '100%', maxHeight: '400px', borderRadius: '8px' }}
                      src={`http://localhost:5000${viewingResource.resource_url}`}
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                ) : (
                  <div className="pdf-preview-container">
                    <h4>PDF Document:</h4>
                    <iframe
                      src={viewingResource.resource_url}
                      style={{ width: '100%', height: '500px', border: 'none', borderRadius: '8px' }}
                      title={viewingResource.title}
                    />
                    <a 
                      href={viewingResource.resource_url} 
                      download={`${viewingResource.title}.pdf`}
                      className="btn-download"
                    >
                      ⬇ Download PDF
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-close" onClick={handleCloseViewModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourcesManagement;
