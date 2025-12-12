import React, { useState, useEffect } from 'react';
import { examsAPI, subjectsAPI, levelsAPI, classesAPI, sectionsAPI } from '../services/api';
import Toast from './Toast';
import '../styles/ExamsManagement.css';

const ExamsManagement = () => {
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [levels, setLevels] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [currentExam, setCurrentExam] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [editingGrade, setEditingGrade] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState(null);
  const examsPerPage = 5;

  const [formData, setFormData] = useState({
    title: '',
    subject_id: '',
    description: '',
    start_time: '',
    end_time: '',
    status: 'active',
    exam_file_url: '',
    level_ids: [],
    class_ids: [],
    section_ids: []
  });

  const [examFile, setExamFile] = useState(null);
  const [filePreview, setFilePreview] = useState('');
  const [showSections, setShowSections] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  // Check if sections should be shown based on selected classes
  useEffect(() => {
    if (formData.class_ids.length > 0 && classes.length > 0) {
      const selectedClasses = classes.filter(c => formData.class_ids.includes(c.id));
      // Only check database field requires_section (1 = yes, 0 = no)
      const needsSections = selectedClasses.some(c => c.requires_section === 1);
      setShowSections(needsSections);
      
      // Clear sections if not needed
      if (!needsSections && formData.section_ids.length > 0) {
        setFormData(prev => ({ ...prev, section_ids: [] }));
      }
    } else {
      setShowSections(false);
      setFormData(prev => ({ ...prev, section_ids: [] }));
    }
  }, [formData.class_ids, classes]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [examsRes, subjectsRes, levelsRes, classesRes, sectionsRes] = await Promise.all([
        examsAPI.getAll(),
        subjectsAPI.getAll(),
        levelsAPI.getAll(),
        classesAPI.getAll(),
        sectionsAPI.getAll()
      ]);
      setExams(examsRes.data);
      setSubjects(subjectsRes.data);
      setLevels(levelsRes.data);
      setClasses(classesRes.data);
      setSections(sectionsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setToast({ message: 'Failed to load data', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setToast({ message: 'Please upload a PDF file', type: 'warning' });
        return;
      }
      
      setExamFile(file);
      setFilePreview(file.name);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, exam_file_url: reader.result });
      };
      reader.readAsDataURL(file);
    }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.subject_id || !formData.start_time || !formData.end_time) {
      setToast({ message: 'Please fill in all required fields', type: 'warning' });
      return;
    }

    if (formData.level_ids.length === 0) {
      setToast({ message: 'Please select at least one level', type: 'warning' });
      return;
    }

    if (formData.class_ids.length === 0) {
      setToast({ message: 'Please select at least one class', type: 'warning' });
      return;
    }

    if (showSections && formData.section_ids.length === 0) {
      setToast({ message: 'Please select at least one section', type: 'warning' });
      return;
    }

    if (!currentExam && !formData.exam_file_url) {
      setToast({ message: 'Please upload an exam file', type: 'warning' });
      return;
    }

    try {
      if (currentExam) {
        await examsAPI.update(currentExam.id, formData);
        setToast({ message: 'Exam updated successfully!', type: 'success' });
      } else {
        await examsAPI.create(formData);
        setToast({ message: 'Exam created successfully!', type: 'success' });
      }
      closeModal();
      fetchData();
    } catch (error) {
      console.error('Error saving exam:', error);
      setToast({ message: 'Failed to save exam', type: 'error' });
    }
  };

  const handleEdit = (exam) => {
    setCurrentExam(exam);
    setFormData({
      title: exam.title,
      subject_id: exam.subject_id,
      description: exam.description || '',
      start_time: exam.start_time ? new Date(exam.start_time).toISOString().slice(0, 16) : '',
      end_time: exam.end_time ? new Date(exam.end_time).toISOString().slice(0, 16) : '',
      status: exam.status,
      exam_file_url: exam.exam_file_url || '',
      level_ids: exam.level_ids ? exam.level_ids.split(',').map(Number) : [],
      class_ids: exam.class_ids ? exam.class_ids.split(',').map(Number) : [],
      section_ids: exam.section_ids ? exam.section_ids.split(',').map(Number) : []
    });
    setFilePreview(exam.exam_file_url ? 'Exam file uploaded' : '');
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this exam? This will also delete all related submissions.')) {
      try {
        await examsAPI.delete(id);
        setToast({ message: 'Exam deleted successfully!', type: 'success' });
        fetchData();
      } catch (error) {
        console.error('Error deleting exam:', error);
        setToast({ message: 'Failed to delete exam', type: 'error' });
      }
    }
  };

  const downloadExamFile = (exam) => {
    if (!exam.exam_file_url) {
      setToast({ message: 'No exam file available', type: 'info' });
      return;
    }

    const link = document.createElement('a');
    link.href = exam.exam_file_url;
    link.download = `${exam.title}_exam.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadSubmissionFile = (submission) => {
    if (!submission.submission_file_url) {
      setToast({ message: 'No submission file available', type: 'info' });
      return;
    }

    const link = document.createElement('a');
    link.href = submission.submission_file_url;
    link.download = `${submission.student_name}_submission.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const viewSubmissions = async (exam) => {
    try {
      const response = await examsAPI.getSubmissions(exam.id);
      setSubmissions(response.data);
      setCurrentExam(exam);
      setShowSubmissionsModal(true);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      setToast({ message: 'Failed to load submissions', type: 'error' });
    }
  };

  const handleGradeEdit = (submission) => {
    setEditingGrade({
      id: submission.id,
      grade: submission.grade || '',
      feedback: submission.feedback || ''
    });
  };

  const saveGrade = async () => {
    if (!editingGrade.grade || editingGrade.grade < 0 || editingGrade.grade > 100) {
      setToast({ message: 'Please enter a valid grade (0-100)', type: 'warning' });
      return;
    }

    try {
      await examsAPI.gradeSubmission(editingGrade.id, {
        grade: editingGrade.grade,
        feedback: editingGrade.feedback
      });
      setToast({ message: 'Grade saved successfully!', type: 'success' });
      setEditingGrade(null);
      viewSubmissions(currentExam);
    } catch (error) {
      console.error('Error saving grade:', error);
      setToast({ message: 'Failed to save grade', type: 'error' });
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setCurrentExam(null);
    setFormData({
      title: '',
      subject_id: '',
      description: '',
      start_time: '',
      end_time: '',
      status: 'active',
      exam_file_url: '',
      level_ids: [],
      class_ids: [],
      section_ids: []
    });
    setExamFile(null);
    setFilePreview('');
  };

  const closeSubmissionsModal = () => {
    setShowSubmissionsModal(false);
    setCurrentExam(null);
    setSubmissions([]);
    setEditingGrade(null);
  };

  const getClassesByLevel = (levelId) => {
    return classes.filter(c => c.level_id === levelId);
  };

  const formatDateTime = (datetime) => {
    if (!datetime) return 'N/A';
    return new Date(datetime).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      active: 'status-active',
      inactive: 'status-inactive',
      completed: 'status-completed'
    };
    return <span className={`status-badge ${statusColors[status]}`}>{status}</span>;
  };

  // Pagination
  const indexOfLastExam = currentPage * examsPerPage;
  const indexOfFirstExam = indexOfLastExam - examsPerPage;
  const currentExams = exams.slice(indexOfFirstExam, indexOfLastExam);
  const totalPages = Math.ceil(exams.length / examsPerPage);

  if (loading) {
    return <div className="loading">Loading exams...</div>;
  }

  return (
    <div className="exams-management">
      <div className="exams-header">
        <h2>Exams Management</h2>
        <button onClick={() => setShowModal(true)} className="btn-add">
          + Add New Exam
        </button>
      </div>

      <div className="exams-table-container">
        <table className="exams-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Level</th>
              <th>Class</th>
              <th>Section</th>
              <th>Subject</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentExams.map((exam) => (
              <tr key={exam.id}>
                <td>{exam.title}</td>
                <td>
                  {exam.level_names ? exam.level_names.split(',').map((level, idx) => (
                    <span key={idx} className="badge level-badge">{level}</span>
                  )) : 'N/A'}
                </td>
                <td>
                  {exam.class_names ? exam.class_names.split(',').map((className, idx) => (
                    <span key={idx} className="badge class-badge">{className}</span>
                  )) : 'N/A'}
                </td>
                <td>
                  {exam.section_names ? exam.section_names.split(',').map((section, idx) => (
                    <span key={idx} className="badge section-badge">{section}</span>
                  )) : 'N/A'}
                </td>
                <td>{exam.subject_name}</td>
                <td>{formatDateTime(exam.start_time)}</td>
                <td>{formatDateTime(exam.end_time)}</td>
                <td>{getStatusBadge(exam.status)}</td>
                <td>
                  <div className="action-buttons">
                    <button onClick={() => handleEdit(exam)} className="btn-action btn-edit" title="Edit">
                      ✏️
                    </button>
                    <button onClick={() => downloadExamFile(exam)} className="btn-action btn-download" title="Download Exam">
                      📥
                    </button>
                    <button onClick={() => viewSubmissions(exam)} className="btn-action btn-view" title="View Submissions">
                      📁
                    </button>
                    <button onClick={() => handleDelete(exam.id)} className="btn-action btn-delete" title="Delete">
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
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
            Previous
          </button>
          <span className="page-info">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      )}

      {/* Add/Edit Exam Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{currentExam ? 'Edit Exam' : 'Add New Exam'}</h3>
              <button onClick={closeModal} className="btn-close">×</button>
            </div>
            <form onSubmit={handleSubmit} className="exam-form">
              <div className="form-row">
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
                  <label>Subject *</label>
                  <select
                    name="subject_id"
                    value={formData.subject_id}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(subject => (
                      <option key={subject.id} value={subject.id}>{subject.name}</option>
                    ))}
                  </select>
                </div>
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
                  <label>Start Time *</label>
                  <input
                    type="datetime-local"
                    name="start_time"
                    value={formData.start_time}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>End Time *</label>
                  <input
                    type="datetime-local"
                    name="end_time"
                    value={formData.end_time}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Status *</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Exam File (PDF) {!currentExam && '*'}</label>
                  <div className="file-input-wrapper">
                    <input
                      type="file"
                      id="examFile"
                      accept="application/pdf"
                      onChange={handleFileChange}
                      className="file-input"
                    />
                    <label htmlFor="examFile" className="file-input-label">
                      {filePreview || 'Choose PDF file'}
                    </label>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Levels *</label>
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

              <div className="form-group">
                <label>Classes *</label>
                {formData.level_ids.length === 0 ? (
                  <p className="hint-text">Please select at least one level first</p>
                ) : (
                  <div className="classes-by-level">
                    {formData.level_ids.map(levelId => {
                      const level = levels.find(l => l.id === levelId);
                      const levelClasses = getClassesByLevel(levelId);
                      return (
                        <div key={levelId} className="level-classes-group">
                          <h4 className="level-title">{level?.name}</h4>
                          <div className="checkbox-group">
                            {levelClasses.map(cls => (
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
                      );
                    })}
                  </div>
                )}
              </div>

              {showSections && (
                <div className="form-group">
                  <label>Sections {showSections ? '*' : ''}</label>
                  <div className="checkbox-group">
                    {sections.map(section => (
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
                  <p className="helper-text">Required for 2ème, 3ème, 4ème Année Lycée</p>
                </div>
              )}

              <div className="form-actions">
                <button type="button" onClick={closeModal} className="btn-cancel">
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  {currentExam ? 'Update Exam' : 'Create Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submissions Modal */}
      {showSubmissionsModal && (
        <div className="modal-overlay" onClick={closeSubmissionsModal}>
          <div className="modal-content submissions-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Submissions for: {currentExam?.title}</h3>
              <button onClick={closeSubmissionsModal} className="btn-close">×</button>
            </div>
            <div className="submissions-content">
              {submissions.length === 0 ? (
                <p className="no-submissions">No submissions yet</p>
              ) : (
                <table className="submissions-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Student</th>
                      <th>Email</th>
                      <th>Submission Time</th>
                      <th>Files</th>
                      <th>Grade</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((submission, index) => (
                      <tr key={submission.id}>
                        <td>{index + 1}</td>
                        <td>{submission.student_name}</td>
                        <td>{submission.email}</td>
                        <td>{formatDateTime(submission.submitted_at)}</td>
                        <td>
                          {submission.submission_file_url ? (
                            <button
                              onClick={() => downloadSubmissionFile(submission)}
                              className="btn-download-file"
                            >
                              📥 Download
                            </button>
                          ) : (
                            'No file'
                          )}
                        </td>
                        <td>
                          {editingGrade?.id === submission.id ? (
                            <input
                              type="number"
                              min="0"
                              max="20"
                              step="0.5"
                              value={editingGrade.grade}
                              onChange={(e) => setEditingGrade({...editingGrade, grade: e.target.value})}
                              className="grade-input"
                              autoFocus
                            />
                          ) : (
                            submission.grade !== null ? `${submission.grade}/20` : 'Not graded'
                          )}
                        </td>
                        <td>
                          <span className={`submission-status status-${submission.status}`}>
                            {submission.status}
                          </span>
                        </td>
                        <td>
                          {editingGrade?.id === submission.id ? (
                            <>
                              <button onClick={saveGrade} className="btn-save-grade">
                                💾 Save
                              </button>
                              <button onClick={() => setEditingGrade(null)} className="btn-cancel-grade">
                                ❌
                              </button>
                            </>
                          ) : (
                            <button onClick={() => handleGradeEdit(submission)} className="btn-grade">
                              ✏️ Grade
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {editingGrade && (
                <div className="feedback-section">
                  <label>Feedback</label>
                  <textarea
                    value={editingGrade.feedback}
                    onChange={(e) => setEditingGrade({ ...editingGrade, feedback: e.target.value })}
                    rows="3"
                    placeholder="Enter feedback for the student..."
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
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

export default ExamsManagement;
