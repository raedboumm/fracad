import React, { useState, useEffect } from 'react';
import { subscriptionsAPI } from '../services/api';
import Toast from './Toast';
import '../styles/SubscriptionsManagement.css';

const SubscriptionsManagement = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('student'); // 'student' or 'teacher'
  const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'student', 'teacher'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'new', 'review', 'approved', 'rejected'
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [showImageFullscreen, setShowImageFullscreen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [subscriptionToDelete, setSubscriptionToDelete] = useState(null);
  const subscriptionsPerPage = 10;

  useEffect(() => {
    fetchSubscriptions();
  }, [typeFilter, statusFilter]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const params = {};
      if (typeFilter !== 'all') params.type = typeFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      
      const response = await subscriptionsAPI.getAll(params);
      setSubscriptions(response.data);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      setToast({ message: 'Failed to load subscriptions', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      const response = await subscriptionsAPI.updateStatus(id, newStatus);
      console.log('Status update response:', response.data);
      setToast({ message: `Subscription ${newStatus} successfully!`, type: 'success' });
      fetchSubscriptions();
      if (showDetailsModal && selectedSubscription?.id === id) {
        setShowDetailsModal(false);
        setSelectedSubscription(null);
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
      setToast({ message: 'Failed to update subscription status', type: 'error' });
    }
  };

  const handleDelete = (id) => {
    setSubscriptionToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await subscriptionsAPI.delete(subscriptionToDelete);
      setToast({ message: 'Subscription deleted successfully!', type: 'success' });
      fetchSubscriptions();
      if (showDetailsModal && selectedSubscription?.id === subscriptionToDelete) {
        setShowDetailsModal(false);
        setSelectedSubscription(null);
      }
      setShowDeleteModal(false);
      setSubscriptionToDelete(null);
    } catch (error) {
      console.error('Error deleting subscription:', error);
      setToast({ message: 'Failed to delete subscription', type: 'error' });
      setShowDeleteModal(false);
      setSubscriptionToDelete(null);
    }
  };

  const handleViewDetails = async (subscriptionId) => {
    try {
      const response = await subscriptionsAPI.getById(subscriptionId);
      setSelectedSubscription(response.data);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error fetching subscription details:', error);
      setToast({ message: 'Failed to load subscription details', type: 'error' });
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'new': return 'status-badge status-new';
      case 'review': return 'status-badge status-review';
      case 'approved': return 'status-badge status-approved';
      case 'rejected': return 'status-badge status-rejected';
      default: return 'status-badge';
    }
  };

  const getTypeBadgeClass = (type) => {
    return type === 'student' ? 'type-badge type-student' : 'type-badge type-teacher';
  };

  // Filter subscriptions by search term
  const filteredSubscriptions = subscriptions.filter(sub => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      sub.user_name?.toLowerCase().includes(search) ||
      sub.user_email?.toLowerCase().includes(search) ||
      sub.package_name?.toLowerCase().includes(search) ||
      sub.class_name?.toLowerCase().includes(search) ||
      sub.section_name?.toLowerCase().includes(search)
    );
  });

  // Pagination
  const indexOfLastSubscription = currentPage * subscriptionsPerPage;
  const indexOfFirstSubscription = indexOfLastSubscription - subscriptionsPerPage;
  const currentSubscriptions = filteredSubscriptions.slice(indexOfFirstSubscription, indexOfLastSubscription);
  const totalPages = Math.ceil(filteredSubscriptions.length / subscriptionsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  if (loading) {
    return <div className="loading">Loading subscriptions...</div>;
  }

  return (
    <div className="subscriptions-management">
      <div className="subscriptions-header">
        <h1>Subscriptions Management</h1>
        <input
          type="text"
          className="search-input"
          placeholder="Search subscriptions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="tabs-container">
        <button 
          className={`tab-button ${activeTab === 'student' ? 'active' : ''}`}
          onClick={() => setActiveTab('student')}
        >
          <span className="tab-icon">👨‍🎓</span> Students
        </button>
        <button 
          className={`tab-button ${activeTab === 'teacher' ? 'active' : ''}`}
          onClick={() => setActiveTab('teacher')}
        >
          <span className="tab-icon">👨‍🏫</span> Teachers
        </button>
      </div>

      <div className="filters-container">
        <div className="filter-group">
          <label>Type</label>
          <select 
            value={typeFilter} 
            onChange={(e) => setTypeFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All types</option>
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Status</label>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All status</option>
            <option value="new">New</option>
            <option value="review">Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="subscriptions-table-container">
        <table className="subscriptions-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>User</th>
              <th>Package</th>
              <th>Class</th>
              <th>Section</th>
              <th>Price</th>
              <th>Type</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentSubscriptions.length === 0 ? (
              <tr>
                <td colSpan="9" className="no-data">No subscriptions found</td>
              </tr>
            ) : (
              currentSubscriptions.map((subscription) => (
                <tr key={subscription.id}>
                  <td>{formatDate(subscription.created_at)}</td>
                  <td>
                    <div className="user-info">
                      <div className="user-name">{subscription.full_name}</div>
                      <div className="user-email">{subscription.email}</div>
                      <div className="user-phone">{subscription.phone}</div>
                    </div>
                  </td>
                  <td>{subscription.package_name}</td>
                  <td>{subscription.class_name}</td>
                  <td>{subscription.section_name}</td>
                  <td className="price-cell">{subscription.price} DT</td>
                  <td>
                    <span className={getTypeBadgeClass(subscription.type)}>
                      {subscription.type}
                    </span>
                  </td>
                  <td>
                    <span className={getStatusBadgeClass(subscription.status)}>
                      {subscription.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-view"
                        onClick={() => handleViewDetails(subscription.id)}
                        title="View Details"
                      >
                        👁️
                      </button>
                      <button 
                        className="btn-approve"
                        onClick={() => handleStatusUpdate(subscription.id, 'approved')}
                        title="Approve"
                        disabled={subscription.status === 'approved'}
                      >
                        ✓
                      </button>
                      <button 
                        className="btn-delete"
                        onClick={() => handleDelete(subscription.id)}
                        title="Delete"
                      >
                        ✕
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
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="pagination-arrow"
          >
            ‹
          </button>
          <span className="pagination-info">
            {currentPage} / {totalPages}
          </span>
          <button 
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="pagination-arrow"
          >
            ›
          </button>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedSubscription && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content subscription-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Subscription Details - {selectedSubscription.full_name}</h2>
              <button className="modal-close" onClick={() => setShowDetailsModal(false)}>✕</button>
            </div>
            
            <div className="modal-body">
              <div className="details-section">
                <h3>User Information</h3>
                <div className="details-grid">
                  <div className="detail-item">
                    <label>Full Name</label>
                    <div>{selectedSubscription.full_name || 'N/A'}</div>
                  </div>
                  <div className="detail-item">
                    <label>Email</label>
                    <div>{selectedSubscription.email || 'N/A'}</div>
                  </div>
                  <div className="detail-item">
                    <label>Phone</label>
                    <div>{selectedSubscription.phone || 'N/A'}</div>
                  </div>
                  <div className="detail-item">
                    <label>Class</label>
                    <div>{selectedSubscription.class_name || 'N/A'}</div>
                  </div>
                  <div className="detail-item">
                    <label>Section</label>
                    <div>{selectedSubscription.section_name || 'N/A'}</div>
                  </div>
                  <div className="detail-item">
                    <label>Package</label>
                    <div>{selectedSubscription.package_name}</div>
                  </div>
                  <div className="detail-item">
                    <label>Price</label>
                    <div>{selectedSubscription.price} DT</div>
                  </div>
                  <div className="detail-item">
                    <label>Date</label>
                    <div>{formatDateTime(selectedSubscription.created_at)}</div>
                  </div>
                </div>
              </div>

              <div className="details-section">
                <h3>Bank Receipt</h3>
                {selectedSubscription.receipt_image_url ? (
                  <div className="receipt-image-container">
                    <img 
                      src={`http://localhost:5000${selectedSubscription.receipt_image_url}`}
                      alt="Bank Receipt"
                      className="receipt-image"
                      onClick={() => setShowImageFullscreen(true)}
                      style={{ cursor: 'pointer' }}
                      onError={(e) => {
                        console.error('Image load error:', selectedSubscription.receipt_image_url);
                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Ctext x="50%25" y="50%25" text-anchor="middle"%3EImage not found%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  </div>
                ) : (
                  <p className="no-receipt">No receipt uploaded</p>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowDetailsModal(false)}
              >
                Close
              </button>
              {selectedSubscription.status !== 'approved' && (
                <button 
                  className="btn-success"
                  onClick={() => handleStatusUpdate(selectedSubscription.id, 'approved')}
                >
                  Approve
                </button>
              )}
              {selectedSubscription.status !== 'rejected' && (
                <button 
                  className="btn-danger"
                  onClick={() => handleStatusUpdate(selectedSubscription.id, 'rejected')}
                >
                  Suspend
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>⚠️ Confirm Deletion</h2>
              <button className="close-btn" onClick={() => setShowDeleteModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this subscription?</p>
              <p className="warning-text">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-danger" 
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Image Modal */}
      {showImageFullscreen && selectedSubscription?.receipt_image_url && (
        <div className="fullscreen-image-overlay" onClick={() => setShowImageFullscreen(false)}>
          <div className="fullscreen-image-container">
            <button className="fullscreen-close" onClick={() => setShowImageFullscreen(false)}>✕</button>
            <img 
              src={`http://localhost:5000${selectedSubscription.receipt_image_url}`}
              alt="Bank Receipt - Full Size"
              className="fullscreen-image"
              onClick={(e) => e.stopPropagation()}
            />
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

export default SubscriptionsManagement;
