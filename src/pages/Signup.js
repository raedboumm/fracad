import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI, levelsAPI, classesAPI, sectionsAPI } from '../services/api';
import '../styles/Auth.css';

const Signup = () => {
  const [selectedRole, setSelectedRole] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    facebookLink: '',
    teacherCode: '',
    academicLevel: '',
    academicYear: '',
    class_id: '',
    section_id: '',
    role: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [levels, setLevels] = useState([]);
  const [loadingLevels, setLoadingLevels] = useState(false);
  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [sections, setSections] = useState([]);
  const [loadingSections, setLoadingSections] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Fetch active levels when component mounts
  useEffect(() => {
    fetchLevels();
  }, []);

  const fetchLevels = async () => {
    try {
      setLoadingLevels(true);
      const response = await levelsAPI.getActive();
      setLevels(response.data);
    } catch (err) {
      console.error('Error fetching levels:', err);
    } finally {
      setLoadingLevels(false);
    }
  };

  const fetchClasses = async (levelId) => {
    try {
      setLoadingClasses(true);
      const response = await classesAPI.getByLevel(levelId);
      setClasses(response.data);
    } catch (err) {
      console.error('Error fetching classes:', err);
      setClasses([]);
    } finally {
      setLoadingClasses(false);
    }
  };

  const fetchSections = async () => {
    try {
      setLoadingSections(true);
      const response = await sectionsAPI.getActive();
      console.log('Sections response:', response);
      // axios.get returns response.data directly
      const sectionsData = Array.isArray(response.data) ? response.data : [];
      console.log('Sections data:', sectionsData);
      setSections(sectionsData);
    } catch (err) {
      console.error('Error fetching sections:', err);
      setSections([]);
    } finally {
      setLoadingSections(false);
    }
  };

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      dateOfBirth: '',
      gender: '',
      facebookLink: '',
      teacherCode: '',
      academicLevel: '',
      academicYear: '',
      class_id: '',
      section_id: '',
      role: role
    });
    setError('');
    setClasses([]);
    setSections([]);
    setSelectedClass(null);
  };

  const handleChange = async (e) => {
    const { name, value } = e.target;
    
    setError('');

    // When academic level changes, fetch classes for that level
    if (name === 'academicLevel') {
      setFormData({
        ...formData,
        [name]: value,
        class_id: '',
        section_id: ''
      });
      const selectedLevel = levels.find(level => level.name === value);
      if (selectedLevel) {
        await fetchClasses(selectedLevel.id);
        setSelectedClass(null);
        setSections([]);
      }
    }
    // When class changes, check if section is required
    else if (name === 'class_id') {
      setFormData({
        ...formData,
        [name]: value,
        section_id: ''
      });
      
      // Fetch classes first to ensure we have the data
      const selectedClassData = classes.find(cls => cls.id === parseInt(value));
      console.log('Selected class:', selectedClassData);
      console.log('Requires section:', selectedClassData?.requires_section);
      setSelectedClass(selectedClassData);
      
      // Check if section is required by database field (1 = yes, 0 = no)
      const needsSection = selectedClassData?.requires_section === 1;
      
      if (needsSection) {
        console.log('Fetching sections...');
        await fetchSections();
      } else {
        console.log('Sections not required');
        setSections([]);
      }
    }
    // For all other fields
    else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.role) {
      setError('Please select your account type');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...signupData } = formData;
      const response = await authAPI.signup(signupData);
      const { user, token } = response.data;
      
      login(user, token);
      
      // Redirect based on role
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-header">
        <h1>Welcome to Tunisie Academy</h1>
        <p>Choose your account type</p>
      </div>

      {!selectedRole ? (
        <div className="role-selection">
          <div 
            className="role-card"
            onClick={() => handleRoleSelect('student')}
          >
            <div className="role-icon">
              <img src="/image/student.png" alt="Student" />
            </div>
            <h3>Student</h3>
            <p>Register as a student to access lessons and resources</p>
          </div>

          <div 
            className="role-card"
            onClick={() => handleRoleSelect('parent')}
          >
            <div className="role-icon">
              <img src="/image/parent.png" alt="Parent" />
            </div>
            <h3>Parent</h3>
            <p>Register to monitor your child's progress</p>
          </div>

          <div 
            className="role-card"
            onClick={() => handleRoleSelect('teacher')}
          >
            <div className="role-icon">
              <img src="/image/teacher.png" alt="Teacher" />
            </div>
            <h3>Teacher</h3>
            <p>Register as a teacher and get admin approval</p>
          </div>
        </div>
      ) : (
        <div className="signup-form-container">
          <div className="signup-box">
            <div className="form-header">
              <button 
                className="back-btn"
                onClick={() => {
                  setSelectedRole('');
                  setFormData({
                    firstName: '',
                    lastName: '',
                    email: '',
                    password: '',
                    confirmPassword: '',
                    phone: '',
                    dateOfBirth: '',
                    gender: '',
                    facebookLink: '',
                    teacherCode: '',
                    academicLevel: '',
                    academicYear: '',
                    role: ''
                  });
                }}
              >
                ← Back
              </button>
              <h2>Create Your Account</h2>
              <p>Registering as: <strong>{selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}</strong></p>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="First Name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Last Name"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="dateOfBirth">Date of Birth</label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="gender">Gender</label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Phone Number"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email Address"
                  required
                />
              </div>

              {/* Parent specific field */}
              {selectedRole === 'parent' && (
                <div className="form-group">
                  <label htmlFor="teacherCode">Student Code</label>
                  <input
                    type="text"
                    id="teacherCode"
                    name="teacherCode"
                    value={formData.teacherCode}
                    onChange={handleChange}
                    placeholder="Enter student code"
                    required
                  />
                </div>
              )}

              {/* Student specific fields */}
              {selectedRole === 'student' && (
                <>
                  <div className="form-group">
                    <label htmlFor="academicLevel">Academic Level</label>
                    <select
                      id="academicLevel"
                      name="academicLevel"
                      value={formData.academicLevel}
                      onChange={handleChange}
                      required
                      disabled={loadingLevels}
                    >
                      <option value="">
                        {loadingLevels ? 'Loading levels...' : 'Select Academic Level'}
                      </option>
                      {levels.map((level) => (
                        <option key={level.id} value={level.name}>
                          {level.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {formData.academicLevel && (
                    <div className="form-group">
                      <label htmlFor="class_id">Class</label>
                      <select
                        id="class_id"
                        name="class_id"
                        value={formData.class_id}
                        onChange={handleChange}
                        required
                        disabled={loadingClasses}
                      >
                        <option value="">
                          {loadingClasses ? 'Loading classes...' : 'Select Class'}
                        </option>
                        {classes.map((cls) => (
                          <option key={cls.id} value={cls.id}>
                            {cls.name} {cls.requires_section === 'yes' ? '(Section required)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {(selectedClass?.requires_section === 'yes' || 
                    (formData.class_id && selectedClass && 
                     (selectedClass.name.includes('2ème') || 
                      selectedClass.name.includes('3ème') || 
                      selectedClass.name.includes('4ème')))) && (
                    <div className="form-group">
                      <label htmlFor="section_id">Section</label>
                      <select
                        id="section_id"
                        name="section_id"
                        value={formData.section_id}
                        onChange={handleChange}
                        required
                        disabled={loadingSections}
                      >
                        <option value="">
                          {loadingSections ? 'Loading sections...' : 'Select Section'}
                        </option>
                        {sections.map((section) => (
                          <option key={section.id} value={section.id}>
                            {section.name}
                          </option>
                        ))}
                      </select>
                      {sections.length === 0 && !loadingSections && (
                        <small style={{color: 'red'}}>No sections available</small>
                      )}
                    </div>
                  )}

                  <div className="form-group">
                    <label htmlFor="academicYear">Academic Year</label>
                    <input
                      type="text"
                      id="academicYear"
                      name="academicYear"
                      value={`${new Date().getFullYear()}-${new Date().getFullYear() + 1}`}
                      readOnly
                      required
                    />
                  </div>
                </>
              )}

              {/* Teacher specific field */}
              {selectedRole === 'teacher' && (
                <div className="form-group">
                  <label htmlFor="facebookLink">Facebook Link (Optional)</label>
                  <input
                    type="url"
                    id="facebookLink"
                    name="facebookLink"
                    value={formData.facebookLink}
                    onChange={handleChange}
                    placeholder="Facebook Profile Link"
                  />
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Password"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm Password"
                    required
                  />
                </div>
              </div>

              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? 'Creating Account...' : 'Sign Up'}
              </button>
            </form>

            <div className="auth-footer">
              <p>Already have an account? <Link to="/login">Sign In</Link></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Signup;
