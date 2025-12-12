import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { booksAPI } from '../services/api';
import '../styles/StudentBooks.css';

const StudentBooks = () => {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const response = await booksAPI.getActive();
      setBooks(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching books:', err);
      setError('Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (book) => {
    if (book.pdf_file_url) {
      const link = document.createElement('a');
      link.href = book.pdf_file_url;
      link.download = `${book.title}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert('PDF file not available for this book');
    }
  };

  // Get unique subjects for filtering
  const subjects = ['all', ...new Set(books.map(book => book.subject_name).filter(Boolean))];

  const filteredBooks = selectedSubject === 'all' 
    ? books 
    : books.filter(book => book.subject_name === selectedSubject);

  return (
    <div className="student-books-container">
      <div className="books-header">
        <button className="back-button" onClick={() => navigate('/student/dashboard')}>
          ← Back to Dashboard
        </button>
        <h1>📚 My Books</h1>
        <p className="books-subtitle">Access your course materials and study resources</p>
      </div>

      {error && (
        <div className="error-message">
          <span>⚠️ {error}</span>
        </div>
      )}

      {!loading && books.length > 0 && (
        <div className="books-filters">
          <label>Filter by Subject:</label>
          <div className="filter-buttons">
            {subjects.map(subject => (
              <button
                key={subject}
                className={`filter-btn ${selectedSubject === subject ? 'active' : ''}`}
                onClick={() => setSelectedSubject(subject)}
              >
                {subject === 'all' ? 'All Subjects' : subject}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading books...</p>
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="no-books">
          <div className="no-books-icon">📚</div>
          <h3>No Books Available</h3>
          <p>{selectedSubject === 'all' 
            ? 'No books have been assigned to your class yet.' 
            : `No books available for ${selectedSubject}.`}</p>
        </div>
      ) : (
        <div className="books-grid">
          {filteredBooks.map((book) => (
            <div key={book.id} className="book-card">
              <div className="book-cover">
                {book.cover_image_url ? (
                  <img src={book.cover_image_url} alt={book.title} />
                ) : (
                  <div className="book-placeholder">
                    <span className="book-icon">📖</span>
                  </div>
                )}
              </div>
              
              <div className="book-info">
                <h3 className="book-title">{book.title}</h3>
                
                {book.subject_name && (
                  <div className="book-subject">
                    <span className="subject-icon">📚</span>
                    {book.subject_name}
                  </div>
                )}
                
                {book.description && (
                  <p className="book-description">{book.description}</p>
                )}
                
                <button 
                  className="download-btn"
                  onClick={() => handleDownload(book)}
                >
                  <span className="download-icon">📥</span>
                  Download Book
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentBooks;
