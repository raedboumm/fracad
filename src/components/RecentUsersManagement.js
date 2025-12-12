import React, { useState, useEffect } from 'react';
import '../styles/UsersManagement.css';

const RecentUsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [filterSection, setFilterSection] = useState('all');

  useEffect(() => {
    fetchRecentUsers();
    
    // Auto-refresh every 30 seconds to show new users
    const interval = setInterval(fetchRecentUsers, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchRecentUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/users/recent', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch recent users');

      const data = await response.json();
      setUsers(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching recent users:', error);
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert('User deleted successfully');
        fetchRecentUsers();
      } else {
        alert('Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.includes(searchTerm);
    
    const matchesClass = filterClass === 'all' || user.class_name === filterClass;
    const matchesSection = filterSection === 'all' || user.section_name === filterSection;

    return matchesSearch && matchesClass && matchesSection;
  });

  const uniqueClasses = [...new Set(users.map(u => u.class_name).filter(Boolean))];
  const uniqueSections = [...new Set(users.map(u => u.section_name).filter(Boolean))];

  if (loading) {
    return (
      <div className="page-content">
        <div className="loading-message">Loading recent users...</div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="users-header">
        <div>
          <h2>New Users (Uncontacted)</h2>
          <p className="subtitle">{users.length} user{users.length !== 1 ? 's' : ''} without subscription in the last 2 days</p>
        </div>
        <button className="btn-refresh" onClick={fetchRecentUsers}>
          🔄 Refresh
        </button>
      </div>

      <div className="users-controls">
        <div className="search-filter-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select 
            className="filter-select"
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
          >
            <option value="all">All Classes</option>
            {uniqueClasses.map(className => (
              <option key={className} value={className}>{className}</option>
            ))}
          </select>

          <select 
            className="filter-select"
            value={filterSection}
            onChange={(e) => setFilterSection(e.target.value)}
          >
            <option value="all">All Sections</option>
            {uniqueSections.map(sectionName => (
              <option key={sectionName} value={sectionName}>{sectionName}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>No New Users</h3>
          <p>No users without subscription in the last 48 hours</p>
        </div>
      ) : (
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Class</th>
                <th>Section</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="user-name-cell">
                      {user.first_name} {user.last_name}
                    </div>
                  </td>
                  <td>{user.phone || '-'}</td>
                  <td>{user.class_name || '-'}</td>
                  <td>{user.section_name || '-'}</td>
                  <td>
                    <button 
                      className="btn-delete-small"
                      onClick={() => handleDeleteUser(user.id)}
                      title="Delete user"
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
  );
};

export default RecentUsersManagement;
