import React, { useState, useEffect } from 'react';
import { bacAPI, sectionsAPI, subjectsAPI } from '../services/api';
import Toast from './Toast';
import '../styles/BacManagement.css';

const BacManagement = () => {
  const [bacEntries, setBacEntries] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [toast, setToast] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    id: '',
    year: new Date().getFullYear(),
    section_id: '',
    subject_name: '',
    exam_pdf: '',
    correction_pdf: ''
  });

  const [examFile, setExamFile] = useState(null);
  const [correctionFile, setCorrectionFile] = useState(null);

  useEffect(() => {
    // Only fetch if we have a token (user is authenticated)
    const token = localStorage.getItem('token');
    if (token) {
      fetchBacLevel();
      fetchBacEntries();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchBacEntries = async () => {
    try {
      setLoading(true);
      setHasError(false);
      const response = await bacAPI.getAll();
      const entriesData = response.data?.data || response.data || [];
      setBacEntries(Array.isArray(entriesData) ? entriesData : []);
    } catch (error) {
      // Suppress logging for auth errors
      if (error.response?.status !== 401 && error.response?.status !== 403 && error.response?.status !== 500) {
        console.error('Error fetching BAC entries:', error);
      }
      setHasError(true);
      // Only show toast for non-auth errors
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        setToast({ message: 'Failed to fetch BAC entries', type: 'error' });
      }
      setBacEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBacLevel = async () => {
    try {
      // Fetch all sections (no filtering)
      const response = await sectionsAPI.getAll();
      const allSections = response.data?.data || response.data || [];
      
      console.log('Fetched all sections:', allSections);
      setSections(Array.isArray(allSections) ? allSections : []);
    } catch (error) {
      if (error.response?.status !== 401 && error.response?.status !== 403 && error.response?.status !== 500) {
        console.error('Error fetching sections:', error);
      }
      setSections([]);
    }
  };

  const fetchSubjectsForSection = async (sectionId) => {
    if (!sectionId) {
      setSubjects([]);
      return;
    }
    
    try {
      const response = await subjectsAPI.getBySection(sectionId);
      const subjectsData = response.data?.data || response.data || [];
      console.log('Fetched subjects for section', sectionId, ':', subjectsData);
      setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
    } catch (error) {
      if (error.response?.status !== 401 && error.response?.status !== 403 && error.response?.status !== 500) {
        console.error('Error fetching subjects:', error);
      }
      setSubjects([]);
    }
  };

  const openAddModal = () => {
    setFormData({
      id: '',
      year: new Date().getFullYear(),
      section_id: '',
      subject_name: '',
      exam_pdf: '',
      correction_pdf: ''
    });
    setExamFile(null);
    setCorrectionFile(null);
    setSubjects([]);
    setIsEditMode(false);
    setShowModal(true);
  };

  const openEditModal = (entry) => {
    setFormData({
      id: entry.id,
      year: entry.year,
      section_id: entry.section_id,
      subject_name: entry.subject_name,
      exam_pdf: entry.exam_pdf || '',
      correction_pdf: entry.correction_pdf || ''
    });
    setExamFile(null);
    setCorrectionFile(null);
    if (entry.section_id) {
      fetchSubjectsForSection(entry.section_id);
    }
    setIsEditMode(true);
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // When section changes, fetch subjects for that section
    if (name === 'section_id') {
      fetchSubjectsForSection(value);
      setFormData(prev => ({ ...prev, subject_name: '' }));
    }
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    const maxSize = 20 * 1024 * 1024; // 20MB in bytes (becomes ~27MB when base64 encoded)
    
    if (file) {
      if (file.type !== 'application/pdf') {
        setToast({ message: 'Please select a PDF file', type: 'error' });
        e.target.value = '';
        return;
      }
      
      if (file.size > maxSize) {
        setToast({ message: 'File size must be less than 20MB', type: 'error' });
        e.target.value = '';
        return;
      }
      
      if (type === 'exam') {
        setExamFile(file);
      } else {
        setCorrectionFile(file);
      }
    }
  };

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.year || !formData.section_id || !formData.subject_name) {
      setToast({ message: 'Year, section, and subject are required', type: 'error' });
      return;
    }

    try {
      setUploading(true);
      
      const bacData = {
        year: parseInt(formData.year),
        section_id: parseInt(formData.section_id),
        subject_name: formData.subject_name,
        exam_pdf: formData.exam_pdf,
        correction_pdf: formData.correction_pdf
      };

      // Convert new files to base64 if uploaded
      if (examFile) {
        setToast({ message: 'Processing exam PDF...', type: 'info' });
        bacData.exam_pdf = await convertFileToBase64(examFile);
      }
      if (correctionFile) {
        setToast({ message: 'Processing correction PDF...', type: 'info' });
        bacData.correction_pdf = await convertFileToBase64(correctionFile);
      }

      setToast({ message: 'Uploading to server...', type: 'info' });

      if (isEditMode) {
        await bacAPI.update(formData.id, bacData);
        setToast({ message: 'BAC entry updated successfully! 📚', type: 'success' });
      } else {
        await bacAPI.create(bacData);
        setToast({ message: 'BAC entry created successfully! 📚', type: 'success' });
      }

      setShowModal(false);
      await fetchBacEntries();
    } catch (error) {
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        console.error('Error saving BAC entry:', error);
      }
      const errorMsg = error.response?.status === 413 
        ? 'File is too large. Please use files smaller than 20MB.'
        : error.response?.data?.message || 'Failed to save BAC entry. Please try again.';
      
      setToast({
        message: errorMsg,
        type: 'error'
      });
    } finally {
      setUploading(false);
    }
  };

  const openDeleteModal = (entry) => {
    setEntryToDelete(entry);
    setShowDeleteModal(true);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setEntryToDelete(null);
  };

  const confirmDelete = async () => {
    try {
      await bacAPI.delete(entryToDelete.id);
      setToast({ message: 'BAC entry deleted successfully! 🗑️', type: 'success' });
      setShowDeleteModal(false);
      setEntryToDelete(null);
      await fetchBacEntries();
    } catch (error) {
      console.error('Error deleting BAC entry:', error);
      setToast({ message: 'Failed to delete BAC entry', type: 'error' });
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await bacAPI.toggleStatus(id);
      setToast({ message: 'Status updated successfully! ✅', type: 'success' });
      await fetchBacEntries();
    } catch (error) {
      console.error('Error toggling status:', error);
      setToast({ message: 'Failed to update status', type: 'error' });
    }
  };

  if (loading) {
    return <div className="loading">Loading BAC entries...</div>;
  }

  return (
    <div className="bac-management">
      <div className="header">
        <h2>📚 BAC Entries Management</h2>
        <button onClick={openAddModal} className="add-btn">
          + Add BAC Entry
        </button>
      </div>

      <div className="bac-table">
        <table>
          <thead>
            <tr>
              <th>Year</th>
              <th>Section</th>
              <th>Subject</th>
              <th>Exam PDF</th>
              <th>Correction PDF</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bacEntries.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-data">
                  No BAC entries found. Add your first entry!
                </td>
              </tr>
            ) : (
              bacEntries.map((entry) => (
                <tr key={entry.id}>
                  <td className="year-cell"><strong>{entry.year}</strong></td>
                  <td className="section-cell">{entry.section_name || 'N/A'}</td>
                  <td className="subject-cell">{entry.subject_name}</td>
                  <td className="pdf-cell">
                    {entry.exam_pdf ? (
                      <a 
                        href={entry.exam_pdf} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="pdf-link"
                        download={`exam_${entry.year}_${entry.subject_name}.pdf`}
                      >
                        📄 Download
                      </a>
                    ) : '-'}
                  </td>
                  <td className="pdf-cell">
                    {entry.correction_pdf ? (
                      <a 
                        href={entry.correction_pdf} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="pdf-link"
                        download={`correction_${entry.year}_${entry.subject_name}.pdf`}
                      >
                        📄 Download
                      </a>
                    ) : '-'}
                  </td>
                  <td className="status-cell">
                    <button
                      onClick={() => handleToggleStatus(entry.id)}
                      className={`status-badge ${entry.is_active ? 'active' : 'inactive'}`}
                    >
                      {entry.is_active ? '✓ Active' : '✗ Inactive'}
                    </button>
                  </td>
                  <td className="actions-cell">
                    <button onClick={() => openEditModal(entry)} className="edit-btn" title="Edit">
                      ✏️
                    </button>
                    <button onClick={() => openDeleteModal(entry)} className="delete-btn" title="Delete">
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
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{isEditMode ? 'Edit BAC Entry' : 'Add New BAC Entry'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Year *</label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  required
                  min="2000"
                  max="2100"
                  placeholder="e.g., 2024"
                />
              </div>

              <div className="form-group">
                <label>Section *</label>
                <select
                  name="section_id"
                  value={formData.section_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Section</option>
                  {sections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.name}
                    </option>
                  ))}
                </select>
              </div>

              {formData.section_id && (
                <div className="form-group">
                  <label>Subject *</label>
                  <select
                    name="subject_name"
                    value={formData.subject_name}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.name}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                  <small className="help-text">
                    Subjects are filtered based on selected section
                  </small>
                </div>
              )}

              {formData.section_id && (
                <>
                  <div className="form-group">
                    <label htmlFor="exam-pdf-input">Exam PDF {isEditMode && formData.exam_pdf && '(Current file uploaded)'}</label>
                    <div className="file-upload-wrapper">
                      <input
                        id="exam-pdf-input"
                        type="file"
                        accept=".pdf"
                        onChange={(e) => handleFileChange(e, 'exam')}
                        className="file-input-hidden"
                      />
                      <label htmlFor="exam-pdf-input" className="file-upload-btn">
                        📄 Choose Exam PDF File
                      </label>
                    </div>
                    {examFile && <small className="file-name">✓ Selected: {examFile.name} ({(examFile.size / 1024 / 1024).toFixed(2)} MB)</small>}
                    {isEditMode && formData.exam_pdf && !examFile && (
                      <small className="file-exists">✓ File already uploaded</small>
                    )}
                    <small className="help-text">Max file size: 50MB</small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="correction-pdf-input">Correction PDF {isEditMode && formData.correction_pdf && '(Current file uploaded)'}</label>
                    <div className="file-upload-wrapper">
                      <input
                        id="correction-pdf-input"
                        type="file"
                        accept=".pdf"
                        onChange={(e) => handleFileChange(e, 'correction')}
                        className="file-input-hidden"
                      />
                      <label htmlFor="correction-pdf-input" className="file-upload-btn">
                        📄 Choose Correction PDF File
                      </label>
                    </div>
                    {correctionFile && <small className="file-name">✓ Selected: {correctionFile.name} ({(correctionFile.size / 1024 / 1024).toFixed(2)} MB)</small>}
                    {isEditMode && formData.correction_pdf && !correctionFile && (
                      <small className="file-exists">✓ File already uploaded</small>
                    )}
                    <small className="help-text">Max file size: 50MB</small>
                  </div>
                </>
              )}

              <div className="form-actions">
                <button type="button" onClick={() => setShowModal(false)} className="cancel-btn" disabled={uploading}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn" disabled={uploading}>
                  {uploading ? '⏳ Uploading...' : (isEditMode ? 'Update Entry' : 'Create Entry')}
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
            <p>Are you sure you want to delete this BAC entry?</p>
            {entryToDelete && (
              <div className="delete-details">
                <p><strong>Year:</strong> {entryToDelete.year}</p>
                <p><strong>Section:</strong> {entryToDelete.section_name}</p>
                <p><strong>Subject:</strong> {entryToDelete.subject_name}</p>
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

export default BacManagement;
