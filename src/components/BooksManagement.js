import React, { useState, useEffect } from 'react';
import { booksAPI, classesAPI, sectionsAPI } from '../services/api';
import Toast from './Toast';
import '../styles/BooksManagement.css';

const BooksManagement = () => {
  const [books, setBooks] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [formData, setFormData] = useState({
    id: '',
    title: '',
    description: '',
    cover_image_url: '',
    pdf_file_url: '',
    status: 'active',
    class_ids: [],
    section_ids: [],
  });

  const [coverPreview, setCoverPreview] = useState('');
  const [pdfFileName, setPdfFileName] = useState('');

  useEffect(() => {
    fetchBooks();
    fetchClasses();
    fetchSections();
  }, []);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const response = await booksAPI.getAll();
      setBooks(response.data);
    } catch (error) {
      console.error('Error fetching books:', error);
      setToast({ message: 'Failed to fetch books', type: 'error' });
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

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await booksAPI.getAll();
      const filtered = response.data.filter(book =>
        book.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setBooks(filtered);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error searching books:', error);
      setToast({ message: 'Failed to search books', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCheckboxChange = (e, field) => {
    const { value, checked } = e.target;
    const numValue = parseInt(value);
    setFormData(prev => ({
      ...prev,
      [field]: checked
        ? [...prev[field], numValue]
        : prev[field].filter(id => id !== numValue)
    }));
  };

  const handleCoverImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        setToast({ message: 'Cover image must be less than 20MB', type: 'error' });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setFormData({ ...formData, cover_image_url: base64String });
        setCoverPreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePdfFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        setToast({ message: 'PDF file must be less than 50MB', type: 'error' });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setFormData({ ...formData, pdf_file_url: base64String });
        setPdfFileName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const openAddModal = () => {
    setFormData({
      id: '',
      title: '',
      description: '',
      cover_image_url: '',
      pdf_file_url: '',
      status: 'active',
      class_ids: [],
      section_ids: [],
    });
    setCoverPreview('');
    setPdfFileName('');
    setIsEditMode(false);
    setShowModal(true);
  };

  const openEditModal = (book) => {
    const classIds = book.class_ids ? book.class_ids.split(',').map(Number) : [];
    const sectionIds = book.section_ids ? book.section_ids.split(',').map(Number) : [];

    setFormData({
      id: book.id,
      title: book.title,
      description: book.description || '',
      cover_image_url: book.cover_image_url || '',
      pdf_file_url: book.pdf_file_url || '',
      status: book.status,
      class_ids: classIds,
      section_ids: sectionIds,
    });
    setCoverPreview(book.cover_image_url || '');
    setPdfFileName(book.pdf_file_url ? 'Current PDF file' : '');
    setIsEditMode(true);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setToast({ message: 'Please enter a book title', type: 'error' });
      return;
    }

    if (formData.class_ids.length === 0) {
      setToast({ message: 'Please select at least one class', type: 'error' });
      return;
    }

    if (formData.section_ids.length === 0) {
      setToast({ message: 'Please select at least one section', type: 'error' });
      return;
    }

    try {
      if (isEditMode) {
        await booksAPI.update(formData.id, formData);
        setToast({ message: 'Book updated successfully! 📚', type: 'success' });
      } else {
        await booksAPI.create(formData);
        setToast({ message: 'Book created successfully! 📚', type: 'success' });
      }

      setShowModal(false);
      fetchBooks();
    } catch (error) {
      console.error('Error saving book:', error);
      setToast({ 
        message: error.response?.data?.message || 'Failed to save book', 
        type: 'error' 
      });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      try {
        await booksAPI.delete(id);
        setToast({ message: 'Book deleted successfully! 🗑️', type: 'success' });
        fetchBooks();
      } catch (error) {
        console.error('Error deleting book:', error);
        setToast({ message: 'Failed to delete book', type: 'error' });
      }
    }
  };

  // Group classes by level
  const classesByLevel = classes.reduce((acc, cls) => {
    if (!acc[cls.level_name]) {
      acc[cls.level_name] = [];
    }
    acc[cls.level_name].push(cls);
    return acc;
  }, {});

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBooks = books.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(books.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) {
    return <div className="loading">Loading books...</div>;
  }

  return (
    <div className="books-management">
      <div className="books-header">
        <h2>📚 Books Management</h2>
        <p>Manage educational books and resources</p>
      </div>

      <div className="books-controls">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search books by title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-btn">🔍 Search</button>
          <button 
            type="button" 
            className="reset-btn"
            onClick={() => {
              setSearchTerm('');
              fetchBooks();
            }}
          >
            Reset
          </button>
        </form>
        <button onClick={openAddModal} className="add-btn">
          ➕ Add New Book
        </button>
      </div>

      <div className="books-table-container">
        <table className="books-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Cover</th>
              <th>Classe</th>
              <th>Section</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentBooks.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-data">No books found</td>
              </tr>
            ) : (
              currentBooks.map((book) => (
                <tr key={book.id}>
                  <td>{book.title}</td>
                  <td>
                    {book.cover_image_url ? (
                      <img 
                        src={book.cover_image_url} 
                        alt={book.title} 
                        className="book-thumbnail"
                      />
                    ) : (
                      <div className="no-image">No cover</div>
                    )}
                  </td>
                  <td>
                    <div className="badges-container">
                      {book.class_names ? 
                        book.class_names.split(',').map((name, index) => (
                          <span key={index} className="badge badge-class">{name}</span>
                        ))
                        : <span className="badge-none">-</span>
                      }
                    </div>
                  </td>
                  <td>
                    <div className="badges-container">
                      {book.section_names ? 
                        book.section_names.split(',').map((name, index) => (
                          <span key={index} className="badge badge-section">{name}</span>
                        ))
                        : <span className="badge-none">-</span>
                      }
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge status-${book.status}`}>
                      {book.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => openEditModal(book)}
                        className="edit-btn"
                        title="Edit book"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(book.id)}
                        className="delete-btn"
                        title="Delete book"
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
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="page-btn"
          >
            ← Previous
          </button>
          <span className="page-info">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="page-btn"
          >
            Next →
          </button>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{isEditMode ? 'Edit Book' : 'Add New Book'}</h3>
              <button onClick={() => setShowModal(false)} className="close-btn">
                ✖
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter book title"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter book description"
                  rows="4"
                />
              </div>

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
                </select>
              </div>

              <div className="form-group">
                <label>Classes *</label>
                <div className="checkboxes-container">
                  {Object.entries(classesByLevel).map(([levelName, levelClasses]) => (
                    <div key={levelName} className="checkbox-group">
                      <div className="group-label">{levelName}</div>
                      {levelClasses.map((cls) => (
                        <label key={cls.id} className="checkbox-label">
                          <input
                            type="checkbox"
                            value={cls.id}
                            checked={formData.class_ids.includes(cls.id)}
                            onChange={(e) => handleCheckboxChange(e, 'class_ids')}
                          />
                          <span>{cls.name}</span>
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Sections *</label>
                <div className="checkboxes-container">
                  {sections.map((section) => (
                    <label key={section.id} className="checkbox-label">
                      <input
                        type="checkbox"
                        value={section.id}
                        checked={formData.section_ids.includes(section.id)}
                        onChange={(e) => handleCheckboxChange(e, 'section_ids')}
                      />
                      <span>{section.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>PDF File</label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handlePdfFileChange}
                />
                {pdfFileName && (
                  <div className="file-name">📄 {pdfFileName}</div>
                )}
                <small>Max size: 50MB</small>
              </div>

              <div className="form-group">
                <label>Cover Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverImageChange}
                />
                {coverPreview && (
                  <div className="image-preview">
                    <img src={coverPreview} alt="Cover preview" />
                  </div>
                )}
                <small>Max size: 20MB</small>
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowModal(false)} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  {isEditMode ? 'Update Book' : 'Create Book'}
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

export default BooksManagement;
