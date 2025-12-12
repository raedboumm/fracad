import React, { useState, useEffect } from 'react';
import { promoCodesAPI } from '../services/api';
import Notification from './Notification';
import '../styles/PromoCodesManagement.css';

const PromoCodesManagement = () => {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCode, setEditingCode] = useState(null);
  const [notification, setNotification] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  
  const [formData, setFormData] = useState({
    code: '',
    owner_name: ''
  });

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    fetchCodes();
  }, [selectedYear, selectedMonth]);

  const fetchCodes = async () => {
    try {
      setLoading(true);
      const response = await promoCodesAPI.getAll(selectedYear, selectedMonth);
      setCodes(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching promo codes:', error);
      setNotification({ message: 'Error fetching promo codes', type: 'error' });
      setCodes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingCode) {
        await promoCodesAPI.update(editingCode.id, formData);
        setNotification({ message: 'Promo code updated successfully', type: 'success' });
      } else {
        await promoCodesAPI.create(formData);
        setNotification({ message: 'Promo code created successfully', type: 'success' });
      }
      
      setShowModal(false);
      setEditingCode(null);
      setFormData({ code: '', owner_name: '' });
      fetchCodes();
    } catch (error) {
      console.error('Error saving promo code:', error);
      setNotification({ 
        message: error.response?.data?.message || 'Error saving promo code', 
        type: 'error' 
      });
    }
  };

  const handleEdit = (code) => {
    setEditingCode(code);
    setFormData({
      code: code.code,
      owner_name: code.owner_name
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this promo code?')) return;
    
    try {
      await promoCodesAPI.delete(id);
      setNotification({ message: 'Promo code deleted successfully', type: 'success' });
      fetchCodes();
    } catch (error) {
      console.error('Error deleting promo code:', error);
      setNotification({ message: 'Error deleting promo code', type: 'error' });
    }
  };

  const handleAddNew = () => {
    setEditingCode(null);
    setFormData({ code: '', owner_name: '' });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCode(null);
    setFormData({ code: '', owner_name: '' });
  };

  const getYearOptions = () => {
    const years = [];
    for (let i = currentYear; i >= currentYear - 5; i--) {
      years.push(i);
    }
    return years;
  };

  return (
    <div className="promo-codes-management">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="promo-header">
        <h2>📋 Promo Codes Management</h2>
        <button className="btn-add" onClick={handleAddNew}>
          + Create New Code
        </button>
      </div>

      {/* Filters */}
      <div className="promo-filters">
        <div className="filter-group">
          <label>Year</label>
          <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
            {getYearOptions().map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Month</label>
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))}>
            {months.map((month, index) => (
              <option key={index + 1} value={index + 1}>{month}</option>
            ))}
          </select>
        </div>
        <div className="filter-info">
          Showing stats for {months[selectedMonth - 1]} {selectedYear}
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading promo codes...</div>
      ) : (
        <div className="promo-table-container">
          <table className="promo-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Owner Name</th>
                <th>Current Month ({months[currentMonth - 1]} {currentYear})</th>
                <th>Selected Month ({months[selectedMonth - 1]} {selectedYear})</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {codes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="no-data">No promo codes found</td>
                </tr>
              ) : (
                codes.map((code) => (
                  <tr key={code.id}>
                    <td>
                      <span className="code-badge">{code.code}</span>
                    </td>
                    <td>{code.owner_name}</td>
                    <td>
                      <span className="usage-badge current">
                        {code.current_month_usage || 0}
                      </span>
                    </td>
                    <td>
                      <span className="usage-badge selected">
                        {code.selected_month_usage || 0}
                      </span>
                    </td>
                    <td>{new Date(code.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-edit" 
                          onClick={() => handleEdit(code)}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button 
                          className="btn-delete" 
                          onClick={() => handleDelete(code.id)}
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
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content promo-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingCode ? 'Edit Promo Code' : 'Create New Promo Code'}</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="promo-form">
              <div className="form-group">
                <label>Code *</label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  required
                  placeholder="ENTER PROMO CODE"
                  maxLength="50"
                />
                <small>Code will be automatically converted to uppercase</small>
              </div>

              <div className="form-group">
                <label>Owner Name *</label>
                <input
                  type="text"
                  name="owner_name"
                  value={formData.owner_name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter owner name"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-save">
                  {editingCode ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromoCodesManagement;
