import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/SheetManagement.css';

const SheetManagement = () => {
  const [sheets, setSheets] = useState([]);
  const [filteredSheets, setFilteredSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [filterPackage, setFilterPackage] = useState('');
  const [filterStatus, setFilterStatus] = useState('active');
  
  // Modals
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTrancheModal, setShowTrancheModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showEditTrancheModal, setShowEditTrancheModal] = useState(false);
  const [showDeleteTrancheModal, setShowDeleteTrancheModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedSheet, setSelectedSheet] = useState(null);
  const [selectedTranche, setSelectedTranche] = useState(null);
  
  // Filter options
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [packages, setPackages] = useState([]);
  
  // Tranche data
  const [tranches, setTranches] = useState([]);
  const [newTranche, setNewTranche] = useState({
    label: '',
    month: '',
    amount: ''
  });
  const [editTranche, setEditTranche] = useState({
    id: null,
    label: '',
    month: '',
    amount: ''
  });
  
  // Stats
  const [stats, setStats] = useState({
    monthTotal: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    fetchSheets();
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [sheets, searchTerm, filterClass, filterSection, filterPackage, filterStatus]);

  const fetchSheets = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/subscriptions/sheet/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSheets(response.data.sheets || []);
      setStats(response.data.stats || { monthTotal: 0, totalRevenue: 0 });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching sheets:', error);
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const token = localStorage.getItem('token');
      const [classesRes, sectionsRes, packagesRes] = await Promise.all([
        axios.get('http://localhost:5000/api/classes', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://localhost:5000/api/sections', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://localhost:5000/api/packages', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setClasses(classesRes.data || []);
      setSections(sectionsRes.data || []);
      setPackages(packagesRes.data || []);
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...sheets];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(sheet =>
        sheet.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sheet.phone?.includes(searchTerm)
      );
    }

    // Class filter
    if (filterClass) {
      filtered = filtered.filter(sheet => sheet.class_id == filterClass);
    }

    // Section filter
    if (filterSection) {
      filtered = filtered.filter(sheet => sheet.section_id == filterSection);
    }

    // Package filter
    if (filterPackage) {
      filtered = filtered.filter(sheet => sheet.package_id == filterPackage);
    }

    // Status filter
    if (filterStatus === 'active') {
      filtered = filtered.filter(sheet => {
        if (!sheet.subscription_end_date) return false;
        const endDate = new Date(sheet.subscription_end_date);
        return endDate >= new Date();
      });
    } else if (filterStatus === 'expired') {
      filtered = filtered.filter(sheet => {
        if (!sheet.subscription_end_date) return false;
        const endDate = new Date(sheet.subscription_end_date);
        return endDate < new Date();
      });
    }

    setFilteredSheets(filtered);
  };

  const handleViewDetails = async (sheet) => {
    setSelectedSheet(sheet);
    // Fetch tranches for this student
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/subscriptions/sheet/${sheet.user_id}/tranches`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTranches(response.data || []);
    } catch (error) {
      console.error('Error fetching tranches:', error);
      setTranches([]);
    }
    setShowViewModal(true);
  };

  const handleEdit = (sheet) => {
    setSelectedSheet({
      ...sheet,
      edit_start_date: sheet.subscription_start_date ? formatDateForInput(sheet.subscription_start_date) : '',
      edit_end_date: sheet.subscription_end_date ? formatDateForInput(sheet.subscription_end_date) : '',
      edit_comptant: sheet.comptant || false,
      edit_show_pc: sheet.pc_delivery ? true : false,
      edit_pc_delivery: sheet.pc_delivery || '',
      edit_details: sheet.details || ''
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // If comptant is checked, add package price to revenue
      const updateData = {
        start_date: selectedSheet.edit_start_date,
        end_date: selectedSheet.edit_end_date,
        comptant: selectedSheet.edit_comptant,
        pc_delivery: selectedSheet.edit_show_pc ? selectedSheet.edit_pc_delivery : null,
        details: selectedSheet.edit_details,
        package_price: selectedSheet.package_price // Send package price for comptant calculation
      };

      await axios.put(`http://localhost:5000/api/subscriptions/sheet/${selectedSheet.user_id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccessMessage('Subscription updated successfully!');
      setShowSuccessModal(true);
      setShowEditModal(false);
      fetchSheets();
    } catch (error) {
      console.error('Error updating subscription:', error);
      setSuccessMessage('Error updating subscription');
      setShowSuccessModal(true);
    }
  };

  const handleAddTranche = (sheet) => {
    setSelectedSheet(sheet);
    setNewTranche({ label: '', month: '', amount: '' });
    // Fetch existing tranches
    fetchTranchesByUser(sheet.user_id);
    setShowTrancheModal(true);
  };

  const fetchTranchesByUser = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/subscriptions/sheet/${userId}/tranches`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTranches(response.data || []);
    } catch (error) {
      console.error('Error fetching tranches:', error);
      setTranches([]);
    }
  };

  const handleSaveTranche = async () => {
    if (!newTranche.label || !newTranche.amount) {
      setSuccessMessage('Please fill label and amount');
      setShowSuccessModal(true);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/subscriptions/sheet/${selectedSheet.user_id}/tranche`, newTranche, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccessMessage('Tranche added successfully!');
      setShowSuccessModal(true);
      setNewTranche({ label: '', month: '', amount: '' });
      fetchTranchesByUser(selectedSheet.user_id);
      fetchSheets(); // Refresh to update paid amount
    } catch (error) {
      console.error('Error adding tranche:', error);
      setSuccessMessage('Error adding tranche');
      setShowSuccessModal(true);
    }
  };

  const handleDeleteSheet = (sheet) => {
    setSelectedSheet(sheet);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/subscriptions/sheet/${selectedSheet.user_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccessMessage('Subscription deleted successfully!');
      setShowSuccessModal(true);
      setShowDeleteModal(false);
      fetchSheets();
    } catch (error) {
      console.error('Error deleting subscription:', error);
      setSuccessMessage('Error deleting subscription');
      setShowSuccessModal(true);
    }
  };

  const handleEditTranche = (tranche) => {
    setEditTranche({
      id: tranche.id,
      label: tranche.label,
      month: tranche.month || '',
      amount: tranche.amount
    });
    setShowEditTrancheModal(true);
  };

  const handleSaveEditTranche = async () => {
    if (!editTranche.label || !editTranche.amount) {
      setSuccessMessage('Please fill label and amount');
      setShowSuccessModal(true);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/subscriptions/tranche/${editTranche.id}`, {
        label: editTranche.label,
        month: editTranche.month,
        amount: editTranche.amount
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccessMessage('Tranche updated successfully!');
      setShowSuccessModal(true);
      setShowEditTrancheModal(false);
      fetchTranchesByUser(selectedSheet.user_id);
      fetchSheets();
    } catch (error) {
      console.error('Error updating tranche:', error);
      setSuccessMessage('Error updating tranche');
      setShowSuccessModal(true);
    }
  };

  const handleDeleteTranche = (tranche) => {
    setSelectedTranche(tranche);
    setShowDeleteTrancheModal(true);
  };

  const confirmDeleteTranche = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/subscriptions/tranche/${selectedTranche.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccessMessage('Tranche deleted successfully!');
      setShowSuccessModal(true);
      setShowDeleteTrancheModal(false);
      fetchTranchesByUser(selectedSheet.user_id);
      fetchSheets();
    } catch (error) {
      console.error('Error deleting tranche:', error);
      setSuccessMessage('Error deleting tranche');
      setShowSuccessModal(true);
    }
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  };

  const calculateRemaining = (packagePrice, paid) => {
    return (packagePrice || 0) - (paid || 0);
  };

  const exportToPDF = () => {
    alert('PDF export functionality coming soon!');
  };

  if (loading) {
    return <div className="loading">Loading sheets...</div>;
  }

  return (
    <div className="sheet-management">
      {/* Header */}
      <div className="sheet-header">
        <h2>Sheet</h2>
        <div className="header-actions">
          <button className="btn-download-pdf" onClick={exportToPDF}>
            📥 Download PDF
          </button>
          <button className="btn-add-row" onClick={() => alert('Add new student functionality')}>
            Add Row
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="sheet-stats">
        <div className="stat-card">
          <span className="stat-label">Month total:</span>
          <span className="stat-value">{Number(stats.monthTotal || 0).toFixed(2)} DT</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total revenue:</span>
          <span className="stat-value">{Number(stats.totalRevenue || 0).toFixed(2)} DT</span>
        </div>
      </div>

      {/* Filters */}
      <div className="sheet-filters">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Search name/phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="filter-select">
          <option value="">All Classes</option>
          {classes.map(cls => (
            <option key={cls.id} value={cls.id}>{cls.name}</option>
          ))}
        </select>

        <select value={filterSection} onChange={(e) => setFilterSection(e.target.value)} className="filter-select">
          <option value="">All Sections</option>
          {sections.map(sec => (
            <option key={sec.id} value={sec.id}>{sec.name}</option>
          ))}
        </select>

        <select value={filterPackage} onChange={(e) => setFilterPackage(e.target.value)} className="filter-select">
          <option value="">All Packages</option>
          {packages.map(pkg => (
            <option key={pkg.id} value={pkg.id}>{pkg.name}</option>
          ))}
        </select>

        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="filter-select">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {/* Table */}
      <div className="sheet-table-container">
        <table className="sheet-table">
          <thead>
            <tr>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Phone</th>
              <th>Class</th>
              <th>Section</th>
              <th>Package</th>
              <th>Tranche</th>
              <th>Comptant</th>
              <th>+PC</th>
              <th>Start</th>
              <th>Expiry</th>
              <th>Details</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSheets.length === 0 ? (
              <tr>
                <td colSpan="13" className="no-data">No subscriptions found</td>
              </tr>
            ) : (
              filteredSheets.map((sheet, index) => (
                <tr key={sheet.user_id || index} className={index % 2 === 0 ? 'row-even' : 'row-odd'}>
                  <td>
                    {sheet.first_name || '—'}
                    {sheet.is_nouveau && <span className="badge-nouveau">Nouveau</span>}
                  </td>
                  <td>{sheet.last_name || '—'}</td>
                  <td>{sheet.phone || '—'}</td>
                  <td>{sheet.class_name || '—'}</td>
                  <td>{sheet.section_name || '—'}</td>
                  <td>{sheet.package_name || '—'}</td>
                  <td>{sheet.tranche_info || '—'}</td>
                  <td>
                    <span className={`status-badge ${sheet.comptant ? 'yes' : 'no'}`}>
                      {sheet.comptant ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td>{sheet.pc_delivery || '—'}</td>
                  <td>{formatDate(sheet.subscription_start_date)}</td>
                  <td>{formatDate(sheet.subscription_end_date)}</td>
                  <td>{sheet.details || '—'}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-action btn-view" onClick={() => handleViewDetails(sheet)} title="View">
                        👁️
                      </button>
                      <button className="btn-action btn-add" onClick={() => handleAddTranche(sheet)} title="Add Tranche">
                        ➕
                      </button>
                      <button className="btn-action btn-edit" onClick={() => handleEdit(sheet)} title="Edit">
                        ✏️
                      </button>
                      <button className="btn-action btn-delete" onClick={() => handleDeleteSheet(sheet)} title="Delete">
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

      {/* Pagination */}
      <div className="sheet-pagination">
        <button className="btn-page">‹</button>
        <span className="page-info">1 / {Math.ceil(filteredSheets.length / 10)}</span>
        <button className="btn-page">›</button>
      </div>

      {/* View Details Modal */}
      {showViewModal && selectedSheet && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-content-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-sheet">
              <h3>View Sheet Entry Details</h3>
              <button className="close-btn" onClick={() => setShowViewModal(false)}>×</button>
            </div>
            <div className="modal-body-sheet">
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label-sheet">Student</span>
                  <span className="detail-value-sheet">{selectedSheet.full_name}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label-sheet">Phone</span>
                  <span className="detail-value-sheet">{selectedSheet.phone}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label-sheet">Class</span>
                  <span className="detail-value-sheet">{selectedSheet.class_name || '—'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label-sheet">Section</span>
                  <span className="detail-value-sheet">{selectedSheet.section_name || '—'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label-sheet">Package</span>
                  <span className="detail-value-sheet">{selectedSheet.package_name}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label-sheet">Package Price</span>
                  <span className="detail-value-sheet">{selectedSheet.package_price} DT</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label-sheet">Start</span>
                  <span className="detail-value-sheet">{formatDate(selectedSheet.subscription_start_date)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label-sheet">Expiry</span>
                  <span className="detail-value-sheet">{formatDate(selectedSheet.subscription_end_date)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label-sheet">Payment Type</span>
                  <span className="detail-value-sheet">{selectedSheet.tranche_info || 'Tranches (Installments)'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label-sheet">PC Delivery</span>
                  <span className="detail-value-sheet">{selectedSheet.pc_delivery || 'No PC delivery'}</span>
                </div>
                <div className="detail-item full-width">
                  <span className="detail-label-sheet">Details</span>
                  <span className="detail-value-sheet">{selectedSheet.details || '—'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label-sheet">Total Revenue</span>
                  <span className="detail-value-sheet">{selectedSheet.paid_amount || 0} DT</span>
                </div>
              </div>

              {/* Payment Tranches */}
              {tranches.length > 0 && (
                <div className="tranches-section">
                  <h4>Payment Tranches</h4>
                  <table className="tranches-table">
                    <thead>
                      <tr>
                        <th>Label</th>
                        <th>Month</th>
                        <th>Amount</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tranches.map((tranche, idx) => (
                        <tr key={idx}>
                          <td>{tranche.label}</td>
                          <td>{tranche.month || '—'}</td>
                          <td>{tranche.amount} DT</td>
                          <td>{formatDate(tranche.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-close-modal" onClick={() => setShowViewModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedSheet && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-sheet">
              <h3>Edit entry - {selectedSheet.first_name}</h3>
              <button className="close-btn" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <div className="modal-body-sheet">
              <div className="form-grid">
                <div className="form-group-sheet">
                  <label>First name</label>
                  <input type="text" value={selectedSheet.first_name} disabled />
                </div>
                <div className="form-group-sheet">
                  <label>Last name</label>
                  <input type="text" value={selectedSheet.last_name} disabled />
                </div>
                <div className="form-group-sheet">
                  <label>Phone</label>
                  <input type="text" value={selectedSheet.phone} disabled />
                </div>
                <div className="form-group-sheet">
                  <label>Package</label>
                  <input type="text" value={selectedSheet.package_name} disabled />
                </div>
                <div className="form-group-sheet">
                  <label>Start</label>
                  <input
                    type="date"
                    value={selectedSheet.edit_start_date}
                    onChange={(e) => setSelectedSheet({ ...selectedSheet, edit_start_date: e.target.value })}
                  />
                </div>
                <div className="form-group-sheet">
                  <label>Expiry</label>
                  <input
                    type="date"
                    value={selectedSheet.edit_end_date}
                    onChange={(e) => setSelectedSheet({ ...selectedSheet, edit_end_date: e.target.value })}
                  />
                </div>
                <div className="form-group-sheet checkbox-group-sheet">
                  <label>
                    <input
                      type="checkbox"
                      checked={selectedSheet.edit_comptant}
                      onChange={(e) => setSelectedSheet({ ...selectedSheet, edit_comptant: e.target.checked })}
                    />
                    Comptant (Paid in full)
                  </label>
                </div>
                <div className="form-group-sheet checkbox-group-sheet">
                  <label>
                    <input
                      type="checkbox"
                      checked={selectedSheet.edit_show_pc}
                      onChange={(e) => setSelectedSheet({ ...selectedSheet, edit_show_pc: e.target.checked })}
                    />
                    +PC (Includes PC)
                  </label>
                </div>
                {selectedSheet.edit_show_pc && (
                  <div className="form-group-sheet">
                    <label>PC Delivery Status</label>
                    <select
                      value={selectedSheet.edit_pc_delivery}
                      onChange={(e) => setSelectedSheet({ ...selectedSheet, edit_pc_delivery: e.target.value })}
                    >
                      <option value="">Select status...</option>
                      <option value="Délivrée">Délivrée</option>
                      <option value="En cours">En cours</option>
                      <option value="Sera livré à la fin de l'année">Sera livré à la fin de l'année</option>
                    </select>
                  </div>
                )}
                <div className="form-group-sheet full-width">
                  <label>Details</label>
                  <textarea
                    rows="3"
                    placeholder="Enter any additional details, notes, or comments about this sheet entry..."
                    value={selectedSheet.edit_details || ''}
                    onChange={(e) => setSelectedSheet({ ...selectedSheet, edit_details: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-close-modal" onClick={() => setShowEditModal(false)}>Close</button>
              <button className="btn-save-modal" onClick={handleSaveEdit}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Tranche Modal */}
      {showTrancheModal && selectedSheet && (
        <div className="modal-overlay" onClick={() => setShowTrancheModal(false)}>
          <div className="modal-content-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-sheet">
              <h3>Add tranche - {selectedSheet.first_name}</h3>
              <button className="close-btn" onClick={() => setShowTrancheModal(false)}>×</button>
            </div>
            <div className="modal-body-sheet">
              <div className="tranche-summary">
                <p><strong>Payé:</strong> {selectedSheet.paid_amount || 0} DT</p>
                <p><strong>Reste:</strong> {calculateRemaining(selectedSheet.package_price, selectedSheet.paid_amount)} DT</p>
              </div>

              <div className="form-grid">
                <div className="form-group-sheet">
                  <label>Label</label>
                  <input
                    type="text"
                    placeholder="T1/T2"
                    value={newTranche.label}
                    onChange={(e) => setNewTranche({ ...newTranche, label: e.target.value })}
                  />
                </div>
                <div className="form-group-sheet">
                  <label>Mois</label>
                  <select
                    value={newTranche.month}
                    onChange={(e) => setNewTranche({ ...newTranche, month: e.target.value })}
                  >
                    <option value="">—</option>
                    <option value="Janvier">Janvier</option>
                    <option value="Février">Février</option>
                    <option value="Mars">Mars</option>
                    <option value="Avril">Avril</option>
                    <option value="Mai">Mai</option>
                    <option value="Juin">Juin</option>
                    <option value="Juillet">Juillet</option>
                    <option value="Août">Août</option>
                    <option value="Septembre">Septembre</option>
                    <option value="Octobre">Octobre</option>
                    <option value="Novembre">Novembre</option>
                    <option value="Décembre">Décembre</option>
                  </select>
                </div>
                <div className="form-group-sheet full-width">
                  <label>Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Amount in DT"
                    value={newTranche.amount}
                    onChange={(e) => setNewTranche({ ...newTranche, amount: e.target.value })}
                  />
                </div>
              </div>

              {/* Existing Tranches */}
              {tranches.length > 0 && (
                <div className="existing-tranches">
                  <h4>Existing Tranches</h4>
                  <table className="tranches-table">
                    <thead>
                      <tr>
                        <th>Label</th>
                        <th>Month</th>
                        <th>Amount</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tranches.map((tranche, idx) => (
                        <tr key={idx}>
                          <td>{tranche.label}</td>
                          <td>{tranche.month || '—'}</td>
                          <td>{tranche.amount} DT</td>
                          <td>
                            <button 
                              className="btn-edit-tranche" 
                              onClick={() => handleEditTranche(tranche)}
                              title="Edit Tranche"
                            >
                              ✏️
                            </button>
                            <button 
                              className="btn-delete-tranche" 
                              onClick={() => handleDeleteTranche(tranche)}
                              title="Delete Tranche"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-cancel-modal" onClick={() => setShowTrancheModal(false)}>Cancel</button>
              <button className="btn-save-modal" onClick={handleSaveTranche}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedSheet && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-sheet" style={{ background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)' }}>
              <h3>Confirm Deletion</h3>
              <button className="close-btn" onClick={() => setShowDeleteModal(false)}>×</button>
            </div>
            <div className="modal-body-sheet">
              <div className="delete-confirmation-content">
                <div className="warning-icon">⚠️</div>
                <p className="delete-message">
                  Are you sure you want to delete the subscription for <strong>{selectedSheet.full_name}</strong>?
                </p>
                <p className="delete-warning">This action cannot be undone!</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel-modal" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="btn-delete-confirm" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Success/Error Modal */}
      {showSuccessModal && (
        <div className="modal-overlay" onClick={() => setShowSuccessModal(false)}>
          <div className="modal-content-success" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-sheet" style={{ background: successMessage.includes('Error') ? 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)' : 'linear-gradient(135deg, #28a745 0%, #218838 100%)' }}>
              <h3>{successMessage.includes('Error') ? 'Error' : 'Success'}</h3>
              <button className="close-btn" onClick={() => setShowSuccessModal(false)}>×</button>
            </div>
            <div className="modal-body-sheet">
              <div className="success-content">
                <div className="success-icon">{successMessage.includes('Error') ? '❌' : '✅'}</div>
                <p className="success-message">{successMessage}</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-save-modal" onClick={() => setShowSuccessModal(false)}>OK</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Tranche Modal */}
      {showEditTrancheModal && editTranche && (
        <div className="modal-overlay" onClick={() => setShowEditTrancheModal(false)}>
          <div className="modal-content-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-sheet">
              <h3>Edit Tranche</h3>
              <button className="close-btn" onClick={() => setShowEditTrancheModal(false)}>×</button>
            </div>
            <div className="modal-body-sheet">
              <div className="form-group">
                <label>Label</label>
                <input
                  type="text"
                  value={editTranche.label}
                  onChange={(e) => setEditTranche({...editTranche, label: e.target.value})}
                  placeholder="e.g., Avance, Tranche 1"
                />
              </div>
              <div className="form-group">
                <label>Month (Optional)</label>
                <select
                  value={editTranche.month || ''}
                  onChange={(e) => setEditTranche({...editTranche, month: e.target.value})}
                >
                  <option value="">Select Month</option>
                  <option value="September">September</option>
                  <option value="October">October</option>
                  <option value="November">November</option>
                  <option value="December">December</option>
                  <option value="January">January</option>
                  <option value="February">February</option>
                  <option value="March">March</option>
                  <option value="April">April</option>
                  <option value="May">May</option>
                  <option value="June">June</option>
                  <option value="July">July</option>
                  <option value="August">August</option>
                </select>
              </div>
              <div className="form-group">
                <label>Amount (DT)</label>
                <input
                  type="number"
                  value={editTranche.amount}
                  onChange={(e) => setEditTranche({...editTranche, amount: e.target.value})}
                  placeholder="Amount in DT"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel-modal" onClick={() => setShowEditTrancheModal(false)}>Cancel</button>
              <button className="btn-save-modal" onClick={handleSaveEditTranche}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Tranche Confirmation Modal */}
      {showDeleteTrancheModal && selectedTranche && (
        <div className="modal-overlay" onClick={() => setShowDeleteTrancheModal(false)}>
          <div className="modal-content-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-sheet" style={{ background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)' }}>
              <h3>Confirm Tranche Deletion</h3>
              <button className="close-btn" onClick={() => setShowDeleteTrancheModal(false)}>×</button>
            </div>
            <div className="modal-body-sheet">
              <div className="delete-confirmation-content">
                <div className="warning-icon">⚠️</div>
                <p className="delete-message">
                  Are you sure you want to delete this tranche?
                </p>
                <div className="tranche-details">
                  <p><strong>Label:</strong> {selectedTranche.label}</p>
                  <p><strong>Month:</strong> {selectedTranche.month || '—'}</p>
                  <p><strong>Amount:</strong> {selectedTranche.amount} DT</p>
                </div>
                <p className="delete-warning">This will affect the Payé and Reste calculations!</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel-modal" onClick={() => setShowDeleteTrancheModal(false)}>Cancel</button>
              <button className="btn-delete-confirm" onClick={confirmDeleteTranche}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SheetManagement;
