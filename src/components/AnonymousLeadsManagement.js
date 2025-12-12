import React, { useState, useEffect } from 'react';
import Notification from './Notification';
import '../styles/AnonymousLeads.css';

const AnonymousLeadsManagement = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/anonymous-leads', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch leads');

      const data = await response.json();
      setLeads(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching leads:', error);
      setLoading(false);
    }
  };

  const handleMarkContacted = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/anonymous-leads/${id}/contact`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchLeads();
      }
    } catch (error) {
      console.error('Error marking as contacted:', error);
    }
  };

  const handleDelete = async (id) => {
    setDeleteConfirm(id);
  };

  const confirmDelete = async () => {
    const id = deleteConfirm;
    setDeleteConfirm(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/anonymous-leads/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setNotification({
          message: 'Lead deleted successfully',
          type: 'success'
        });
        fetchLeads();
      } else {
        setNotification({
          message: 'Failed to delete lead',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error deleting lead:', error);
      setNotification({
        message: 'An error occurred while deleting',
        type: 'error'
      });
    }
  };

  const filteredLeads = leads.filter(lead => 
    lead.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.phone?.includes(searchTerm) ||
    lead.class_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="page-content">
        <div className="loading-message">Loading leads...</div>
      </div>
    );
  }

  return (
    <div className="page-content">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      {deleteConfirm && (
        <div className="delete-confirm-overlay">
          <div className="delete-confirm-modal">
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete this lead?</p>
            <div className="delete-confirm-actions">
              <button className="btn-cancel" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn-confirm-delete" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
      <div className="leads-header">
        <h2>Anonymous Leads</h2>
      </div>

      <div className="leads-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredLeads.length === 0 ? (
        <div className="empty-state">
          <h3>No Leads Found</h3>
          <p>No anonymous leads available</p>
        </div>
      ) : (
        <div className="leads-table-container">
          <table className="leads-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Class</th>
                <th>Last-year Avg.</th>
                <th>Package</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className={lead.contacted ? 'contacted' : ''}>
                  <td>{formatDate(lead.created_at)}</td>
                  <td>{lead.first_name} {lead.last_name}</td>
                  <td>{lead.email}</td>
                  <td>{lead.phone}</td>
                  <td>{lead.class_name || '-'}</td>
                  <td>{lead.last_year_average || '-'}</td>
                  <td>{lead.package_name}</td>
                  <td>
                    <div className="action-buttons">
                      {!lead.contacted && (
                        <button 
                          className="btn-mark-contacted"
                          onClick={() => handleMarkContacted(lead.id)}
                          title="Mark Contacted"
                        >
                          ✓ Mark Contacted
                        </button>
                      )}
                      <button 
                        className="btn-delete-lead"
                        onClick={() => handleDelete(lead.id)}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AnonymousLeadsManagement;
