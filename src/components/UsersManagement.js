import React, { useState, useEffect } from 'react';
import { usersAPI, levelsAPI, classesAPI, sectionsAPI } from '../services/api';
import '../styles/UsersManagement.css';

const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [levels, setLevels] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(5);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    role: 'student',
    facebookLink: '',
    academicLevel: '',
    academicYear: '2025-2026',
    class_id: '',
    section_id: '',
    status: 'active'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersResponse, levelsResponse, classesResponse, sectionsResponse] = await Promise.all([
        usersAPI.getAll(),
        levelsAPI.getAll(),
        classesAPI.getAll(),
        sectionsAPI.getAll()
      ]);
      setUsers(usersResponse.data);
      setLevels(levelsResponse.data);
      setClasses(classesResponse.data);
      setSections(sectionsResponse.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateUniqueCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        email: user.email || '',
        password: '',
        phone: user.phone || '',
        dateOfBirth: user.date_of_birth ? user.date_of_birth.split('T')[0] : '',
        gender: user.gender || '',
        role: user.role || 'student',
        facebookLink: user.facebook_link || '',
        academicLevel: user.academic_level || '',
        academicYear: user.academic_year || '2025-2026',
        class_id: user.class_id || '',
        section_id: user.section_id || '',
        status: user.status || 'active'
      });
    } else {
      setEditingUser(null);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phone: '',
        dateOfBirth: '',
        gender: '',
        role: 'student',
        facebookLink: '',
        academicLevel: '',
        academicYear: '2025-2026',
        class_id: '',
        section_id: '',
        status: 'active'
      });
    }
    setShowModal(true);
  };

  const handleViewUser = (user) => {
    setViewingUser(user);
    setShowViewModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setShowViewModal(false);
    setEditingUser(null);
    setViewingUser(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phone: '',
      dateOfBirth: '',
      gender: '',
      role: 'student',
      facebookLink: '',
      academicLevel: '',
      academicYear: '2025-2026',
      class_id: '',
      section_id: '',
      status: 'active'
    });
    setError('');
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      setError('First name, last name, and email are required');
      return;
    }

    if (!editingUser && !formData.password) {
      setError('Password is required for new users');
      return;
    }

    try {
      const submitData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        date_of_birth: formData.dateOfBirth,
        gender: formData.gender,
        role: formData.role,
        facebook_link: formData.facebookLink,
        academic_level: formData.academicLevel,
        academic_year: formData.academicYear,
        class_id: formData.class_id || null,
        section_id: formData.section_id || null,
        status: formData.status
      };

      if (formData.password) {
        submitData.password = formData.password;
      }

      if (editingUser) {
        await usersAPI.update(editingUser.id, submitData);
      } else {
        await usersAPI.create(submitData);
      }
      
      await fetchData();
      handleCloseModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save user');
      console.error('Error saving user:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      await usersAPI.delete(id);
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
      console.error('Error deleting user:', err);
    }
  };

  const handleStatusToggle = async (user) => {
    try {
      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      await usersAPI.update(user.id, { status: newStatus });
      await fetchData();
    } catch (err) {
      alert('Failed to update user status');
      console.error('Error updating status:', err);
    }
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      (user.first_name && user.first_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.last_name && user.last_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.phone && user.phone.includes(searchQuery)) ||
      (user.special_code && user.special_code.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) {
    return <div className="users-loading">Loading users...</div>;
  }

  return (
    <div className="users-management">
      <div className="users-container">
        <div className="users-header">
          <h2>Users Management</h2>
          <button className="add-user-btn" onClick={() => handleOpenModal()}>
            Add User
          </button>
        </div>

        <div className="users-controls">
          <div className="search-filter-section">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="filter-group">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Roles</option>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="parent">Parent</option>
                <option value="admin">Admin</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </div>

      {error && !showModal && <div className="error-message">{error}</div>}

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Profile</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Code</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.length === 0 ? (
              <tr>
                <td colSpan="8" className="no-data">
                  {searchQuery || roleFilter !== 'all' || statusFilter !== 'all' 
                    ? 'No users found matching your filters' 
                    : 'No users available. Add your first user!'}
                </td>
              </tr>
            ) : (
              currentUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <img 
                      src={user.gender === 'female' 
                        ? 'https://cdn-icons-png.flaticon.com/512/4140/4140047.png'
                        : 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png'
                      } 
                      alt={`${user.first_name} ${user.last_name}`}
                      className="user-avatar"
                    />
                  </td>
                  <td className="user-name">
                    {user.first_name} {user.last_name}
                  </td>
                  <td className="user-email">{user.email}</td>
                  <td>{user.phone || '-'}</td>
                  <td>
                    <span className={`role-badge ${user.role}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="user-code">{user.special_code || '-'}</td>
                  <td>
                    <span 
                      className={`status-badge ${user.status}`}
                      onClick={() => handleStatusToggle(user)}
                      style={{ cursor: 'pointer' }}
                      title="Click to toggle status"
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button
                      className="btn-view"
                      onClick={() => handleViewUser(user)}
                      title="View Details"
                    >
                      <span>👁️</span>
                    </button>
                    <button
                      className="btn-edit"
                      onClick={() => handleOpenModal(user)}
                      title="Edit"
                    >
                      <span>✏️</span>
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(user.id)}
                      title="Delete"
                    >
                      <span>🗑️</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            ‹
          </button>
          
          <span className="pagination-info">
            {currentPage} / {totalPages}
          </span>
          
          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            ›
          </button>
        </div>
      )}

      {/* Add/Edit User Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingUser ? 'Edit User' : 'Add New User'}</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                ✕
              </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            {!editingUser && (
              <div className="special-code-display">
                <label>Special Code</label>
                <div className="code-value">{generateUniqueCode()}</div>
                <small>Auto-generated unique identifier code</small>
              </div>
            )}

            <form onSubmit={handleSubmit} className="user-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name *</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="lastName">Last Name *</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="password">
                    Password {!editingUser && '*'}
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required={!editingUser}
                    placeholder={editingUser ? 'Leave blank to keep current' : ''}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="facebookLink">Facebook URL</label>
                  <input
                    type="url"
                    id="facebookLink"
                    name="facebookLink"
                    value={formData.facebookLink}
                    onChange={handleChange}
                    placeholder="https://facebook.com/username"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="role">Role *</label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    required
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="parent">Parent</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="gender">Gender</label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="dateOfBirth">Birthdate</label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="academicYear">Academic Year</label>
                  <input
                    type="text"
                    id="academicYear"
                    name="academicYear"
                    value={formData.academicYear}
                    onChange={handleChange}
                    readOnly
                  />
                </div>
              </div>

              {formData.role === 'student' && (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="academicLevel">Level</label>
                      <select
                        id="academicLevel"
                        name="academicLevel"
                        value={formData.academicLevel}
                        onChange={handleChange}
                      >
                        <option value="">Select Level</option>
                        {levels.map((level) => (
                          <option key={level.id} value={level.name}>
                            {level.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="class_id">Class</label>
                      <select
                        id="class_id"
                        name="class_id"
                        value={formData.class_id}
                        onChange={handleChange}
                      >
                        <option value="">Select Class</option>
                        {classes.map((classItem) => (
                          <option key={classItem.id} value={classItem.id}>
                            {classItem.name} - {classItem.level_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="section_id">Section (if applicable)</label>
                    <select
                      id="section_id"
                      name="section_id"
                      value={formData.section_id}
                      onChange={handleChange}
                    >
                      <option value="">Select Section</option>
                      {sections.map((section) => (
                        <option key={section.id} value={section.id}>
                          {section.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div className="form-group">
                <label htmlFor="status">Status *</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-save">
                  {editingUser ? 'Update User' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View User Modal */}
      {showViewModal && viewingUser && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content view-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>User Details</h3>
              <button className="close-btn" onClick={handleCloseModal}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="user-view-header">
                <img 
                  src={viewingUser.gender === 'female' 
                    ? 'https://cdn-icons-png.flaticon.com/512/4140/4140047.png'
                    : 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png'
                  } 
                  alt="User Avatar"
                  className="user-avatar"
                />
                <h3>{viewingUser.first_name} {viewingUser.last_name}</h3>
                <p>{viewingUser.email}</p>
              </div>

              <div className="user-view-section">
                <h4>Personal Information</h4>
                <div className="user-view-grid">
                  <div className="user-view-item">
                    <label>Phone</label>
                    <p>{viewingUser.phone || '-'}</p>
                  </div>
                  <div className="user-view-item">
                    <label>Role</label>
                    <p><span className={`role-badge ${viewingUser.role}`}>{viewingUser.role}</span></p>
                  </div>
                  <div className="user-view-item">
                    <label>Special Code</label>
                    <p>{viewingUser.special_code || '-'}</p>
                  </div>
                  <div className="user-view-item">
                    <label>Status</label>
                    <p><span className={`status-badge ${viewingUser.status}`}>{viewingUser.status}</span></p>
                  </div>
                  <div className="user-view-item">
                    <label>Gender</label>
                    <p>{viewingUser.gender || '-'}</p>
                  </div>
                  <div className="user-view-item">
                    <label>Birth Date</label>
                    <p>{viewingUser.date_of_birth ? new Date(viewingUser.date_of_birth).toLocaleDateString() : '-'}</p>
                  </div>
                  {viewingUser.facebook_link && (
                    <div className="user-view-item full-width">
                      <label>Facebook</label>
                      <p><a href={viewingUser.facebook_link} target="_blank" rel="noopener noreferrer">{viewingUser.facebook_link}</a></p>
                    </div>
                  )}
                </div>
              </div>

              {viewingUser.role === 'student' && (
                <div className="user-view-section">
                  <h4>Academic Information</h4>
                  <div className="user-view-grid">
                    <div className="user-view-item">
                      <label>Academic Level</label>
                      <p>{viewingUser.academic_level || '-'}</p>
                    </div>
                    <div className="user-view-item">
                      <label>Academic Year</label>
                      <p>{viewingUser.academic_year || '-'}</p>
                    </div>
                    <div className="user-view-item">
                      <label>Class</label>
                      <p>{classes.find(c => c.id === viewingUser.class_id)?.name || '-'}</p>
                    </div>
                    <div className="user-view-item">
                      <label>Section</label>
                      <p>{sections.find(s => s.id === viewingUser.section_id)?.name || '-'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default UsersManagement;
