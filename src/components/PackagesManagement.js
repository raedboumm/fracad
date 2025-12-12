import React, { useState, useEffect } from 'react';
import { packagesAPI, subjectsAPI, levelsAPI, classesAPI, sectionsAPI } from '../services/api';
import Toast from './Toast';
import '../styles/PackagesManagement.css';

const PackagesManagement = () => {
  const [packages, setPackages] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [levels, setLevels] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentPackage, setCurrentPackage] = useState(null);
  const [toast, setToast] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const packagesPerPage = 5;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    type: 'full_package',
    package_image_url: '',
    is_active: true,
    level_ids: [],
    class_ids: [],
    section_ids: [],
    subject_ids: []
  });

  const [packageImage, setPackageImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [packagesRes, subjectsRes, levelsRes, classesRes, sectionsRes] = await Promise.all([
        packagesAPI.getAll(),
        subjectsAPI.getAll(),
        levelsAPI.getAll(),
        classesAPI.getAll(),
        sectionsAPI.getAll()
      ]);
      setPackages(packagesRes.data);
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
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setToast({ message: 'Please upload an image file', type: 'warning' });
        return;
      }
      
      if (file.size > 2 * 1024 * 1024) {
        setToast({ message: 'Image size should be less than 2MB', type: 'warning' });
        return;
      }
      
      setPackageImage(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setFormData({ ...formData, package_image_url: reader.result });
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
    
    if (!formData.name || !formData.price || !formData.duration) {
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

    if (formData.section_ids.length === 0) {
      setToast({ message: 'Please select at least one section', type: 'warning' });
      return;
    }

    try {
      if (currentPackage) {
        await packagesAPI.update(currentPackage.id, formData);
        setToast({ message: 'Package updated successfully!', type: 'success' });
      } else {
        await packagesAPI.create(formData);
        setToast({ message: 'Package created successfully!', type: 'success' });
      }
      closeModal();
      fetchData();
    } catch (error) {
      console.error('Error saving package:', error);
      setToast({ message: 'Failed to save package', type: 'error' });
    }
  };

  const handleEdit = (pkg) => {
    setCurrentPackage(pkg);
    setFormData({
      name: pkg.name,
      description: pkg.description || '',
      price: pkg.price,
      duration: pkg.duration,
      type: pkg.type,
      package_image_url: pkg.package_image_url || '',
      is_active: pkg.is_active,
      level_ids: pkg.level_ids ? pkg.level_ids.split(',').map(Number) : [],
      class_ids: pkg.class_ids ? pkg.class_ids.split(',').map(Number) : [],
      section_ids: pkg.section_ids ? pkg.section_ids.split(',').map(Number) : [],
      subject_ids: pkg.subject_ids ? pkg.subject_ids.split(',').map(Number) : []
    });
    setImagePreview(pkg.package_image_url || '');
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this package?')) {
      try {
        await packagesAPI.delete(id);
        setToast({ message: 'Package deleted successfully!', type: 'success' });
        fetchData();
      } catch (error) {
        console.error('Error deleting package:', error);
        setToast({ message: 'Failed to delete package', type: 'error' });
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setCurrentPackage(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      duration: '',
      type: 'full_package',
      package_image_url: '',
      is_active: true,
      level_ids: [],
      class_ids: [],
      section_ids: [],
      subject_ids: []
    });
    setPackageImage(null);
    setImagePreview('');
  };

  const getClassesByLevel = (levelId) => {
    return classes.filter(c => c.level_id === levelId);
  };

  // Pagination
  const indexOfLastPackage = currentPage * packagesPerPage;
  const indexOfFirstPackage = indexOfLastPackage - packagesPerPage;
  const currentPackages = packages.slice(indexOfFirstPackage, indexOfLastPackage);
  const totalPages = Math.ceil(packages.length / packagesPerPage);

  if (loading) {
    return <div className="loading">Loading packages...</div>;
  }

  return (
    <div className="packages-management">
      <div className="packages-header">
        <h2>Packages Management</h2>
        <button onClick={() => setShowModal(true)} className="btn-add">
          + Add Package
        </button>
      </div>

      <div className="packages-table-container">
        <table className="packages-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Price</th>
              <th>Duration</th>
              <th>Type</th>
              <th>Level</th>
              <th>Class</th>
              <th>Section</th>
              <th>Subject</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentPackages.map((pkg) => (
              <tr key={pkg.id}>
                <td>
                  {pkg.package_image_url ? (
                    <img src={pkg.package_image_url} alt={pkg.name} className="package-thumbnail" />
                  ) : (
                    <div className="no-image">No Image</div>
                  )}
                </td>
                <td>{pkg.name}</td>
                <td>{pkg.price} DT</td>
                <td>{pkg.duration} {pkg.duration === 1 ? 'month' : 'months'}</td>
                <td>
                  <span className={`type-badge type-${pkg.type}`}>
                    {pkg.type === 'full_package' ? 'Full Package' : 'Subject Package'}
                  </span>
                </td>
                <td>
                  {pkg.level_names ? pkg.level_names.split(',').map((level, idx) => (
                    <span key={idx} className="badge level-badge">{level}</span>
                  )) : 'N/A'}
                </td>
                <td>
                  {pkg.class_names ? pkg.class_names.split(',').map((className, idx) => (
                    <span key={idx} className="badge class-badge">{className}</span>
                  )) : 'N/A'}
                </td>
                <td>
                  {pkg.section_names ? pkg.section_names.split(',').map((section, idx) => (
                    <span key={idx} className="badge section-badge">{section}</span>
                  )) : 'N/A'}
                </td>
                <td>
                  {pkg.subject_names ? (
                    <div className="subject-list">
                      {pkg.subject_names.split(',').slice(0, 3).map((subject, idx) => (
                        <span key={idx} className="subject-item">{subject}</span>
                      ))}
                      {pkg.subject_names.split(',').length > 3 && (
                        <span className="more-subjects">+{pkg.subject_names.split(',').length - 3} more</span>
                      )}
                    </div>
                  ) : 'N/A'}
                </td>
                <td>
                  <div className="action-buttons">
                    <button onClick={() => handleEdit(pkg)} className="btn-action btn-edit" title="Edit">
                      ✏️
                    </button>
                    <button onClick={() => handleDelete(pkg.id)} className="btn-action btn-delete" title="Delete">
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

      {/* Add/Edit Package Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{currentPackage ? 'Edit Package' : 'Add New Package'}</h3>
              <button onClick={closeModal} className="btn-close">×</button>
            </div>
            <form onSubmit={handleSubmit} className="package-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Price (DT) *</label>
                  <input
                    type="number"
                    name="price"
                    step="0.01"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                  />
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
                  <label>Duration (Months) *</label>
                  <input
                    type="number"
                    name="duration"
                    min="1"
                    value={formData.duration}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Type *</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="full_package">Full Package</option>
                    <option value="subject_package">Subject Package</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="checkbox-label-inline">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                  />
                  <span>Active (visible to users)</span>
                </label>
              </div>

              <div className="form-group">
                <label>Package Image</label>
                <div className="file-input-wrapper">
                  <input
                    type="file"
                    id="packageImage"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="file-input"
                  />
                  <label htmlFor="packageImage" className="file-input-label">
                    Choose image
                  </label>
                </div>
                {imagePreview && (
                  <div className="image-preview-container">
                    <img src={imagePreview} alt="Preview" className="image-preview" />
                  </div>
                )}
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

              <div className="form-group">
                <label>Sections *</label>
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
              </div>

              <div className="form-group">
                <label>Subjects (optional for full package)</label>
                <div className="checkbox-group checkbox-group-scrollable">
                  {subjects.map(subject => (
                    <label key={subject.id} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.subject_ids.includes(subject.id)}
                        onChange={() => handleCheckboxChange('subject_ids', subject.id)}
                      />
                      {subject.name}
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={closeModal} className="btn-cancel">
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  {currentPackage ? 'Update Package' : 'Create Package'}
                </button>
              </div>
            </form>
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

export default PackagesManagement;
