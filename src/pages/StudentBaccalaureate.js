import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bacAPI } from '../services/api';
import '../styles/StudentBaccalaureate.css';

const StudentBaccalaureate = () => {
  const navigate = useNavigate();
  const [bacEntries, setBacEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedSection, setSelectedSection] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');

  useEffect(() => {
    fetchBacEntries();
  }, []);

  const fetchBacEntries = async () => {
    try {
      setLoading(true);
      const response = await bacAPI.getStudent();
      setBacEntries(response.data.data || []);
      setError('');
    } catch (err) {
      console.error('Error fetching bac entries:', err);
      setError('Failed to load baccalaureate exams');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (pdfData, filename) => {
    if (pdfData) {
      const link = document.createElement('a');
      link.href = pdfData;
      link.download = filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert('PDF file not available');
    }
  };

  // Get unique values for filters
  const years = ['all', ...new Set(bacEntries.map(entry => entry.year).filter(Boolean))].sort((a, b) => {
    if (a === 'all') return -1;
    if (b === 'all') return 1;
    return b - a;
  });
  
  const sections = ['all', ...new Set(bacEntries.map(entry => entry.section_name).filter(Boolean))];
  const subjects = ['all', ...new Set(bacEntries.map(entry => entry.subject_name).filter(Boolean))].sort();

  // Filter entries
  const filteredEntries = bacEntries.filter(entry => {
    if (selectedYear !== 'all' && entry.year !== parseInt(selectedYear)) return false;
    if (selectedSection !== 'all' && entry.section_name !== selectedSection) return false;
    if (selectedSubject !== 'all' && entry.subject_name !== selectedSubject) return false;
    return true;
  });

  // Group by year and then by subject
  const groupedByYear = filteredEntries.reduce((acc, entry) => {
    const year = entry.year;
    if (!acc[year]) acc[year] = [];
    acc[year].push(entry);
    return acc;
  }, {});

  const sortedYears = Object.keys(groupedByYear).sort((a, b) => b - a);

  return (
    <div className="student-bac-container">
      <div className="bac-header">
        <button className="back-button" onClick={() => navigate('/student/dashboard')}>
          ← Back to Dashboard
        </button>
        <h1>🎯 Baccalaureate Exams</h1>
        <p className="bac-subtitle">Practice with past exam papers and corrections</p>
      </div>

      {error && (
        <div className="error-message">
          <span>⚠️ {error}</span>
        </div>
      )}

      {!loading && bacEntries.length > 0 && (
        <div className="bac-filters">
          <div className="filter-group">
            <label>📅 Year:</label>
            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
              {years.map(year => (
                <option key={year} value={year}>
                  {year === 'all' ? 'All Years' : year}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>📚 Section:</label>
            <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)}>
              {sections.map(section => (
                <option key={section} value={section}>
                  {section === 'all' ? 'All Sections' : section}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>📖 Subject:</label>
            <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
              {subjects.map(subject => (
                <option key={subject} value={subject}>
                  {subject === 'all' ? 'All Subjects' : subject}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading baccalaureate exams...</p>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="no-exams">
          <div className="no-exams-icon">🎯</div>
          <h3>No Exams Available</h3>
          <p>
            {bacEntries.length === 0
              ? 'No baccalaureate exams have been published yet.'
              : 'No exams match your current filters. Try adjusting your selections.'}
          </p>
        </div>
      ) : (
        <div className="bac-content">
          {sortedYears.map(year => (
            <div key={year} className="year-section">
              <div className="year-header">
                <h2>📅 Year {year}</h2>
                <span className="exam-count">{groupedByYear[year].length} exam{groupedByYear[year].length !== 1 ? 's' : ''}</span>
              </div>

              <div className="exams-grid">
                {groupedByYear[year].map(entry => (
                  <div key={entry.id} className="exam-card">
                    <div className="exam-header">
                      <h3>{entry.subject_name}</h3>
                      {entry.section_name && (
                        <span className="section-badge">{entry.section_name}</span>
                      )}
                    </div>

                    <div className="exam-info">
                      <div className="info-item">
                        <span className="info-label">Year:</span>
                        <span className="info-value">{entry.year}</span>
                      </div>
                    </div>

                    <div className="exam-actions">
                      <button
                        className="btn-download exam-btn"
                        onClick={() => handleDownload(entry.exam_pdf, `${entry.subject_name}_${entry.year}_Exam.pdf`)}
                        disabled={!entry.exam_pdf}
                        title={entry.exam_pdf ? 'Download exam paper' : 'Exam not available'}
                      >
                        <span className="btn-icon">📝</span>
                        <span>Exam Paper</span>
                      </button>

                      <button
                        className="btn-download correction-btn"
                        onClick={() => handleDownload(entry.correction_pdf, `${entry.subject_name}_${entry.year}_Correction.pdf`)}
                        disabled={!entry.correction_pdf}
                        title={entry.correction_pdf ? 'Download correction' : 'Correction not available'}
                      >
                        <span className="btn-icon">✓</span>
                        <span>Correction</span>
                      </button>
                    </div>

                    {!entry.exam_pdf && !entry.correction_pdf && (
                      <div className="no-files-message">
                        <span>📋 Files coming soon</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentBaccalaureate;
