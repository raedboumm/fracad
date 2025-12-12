import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { coursesAPI, progressAPI, booksAPI, bacAPI, telegramAPI, packagesAPI, subscriptionsAPI, promoCodesAPI, resourcesAPI, dashboardAPI } from '../services/api';
import StudentCalendar from '../components/StudentCalendar';
import LiveSessions from '../components/LiveSessions';
import NotificationBell from '../components/NotificationBell';
import '../styles/StudentDashboard.css';

const StudentDashboard = () => {
  const { user, logout, login } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(() => {
    return searchParams.get('section') || 'dashboard';
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [subjectsOpen, setSubjectsOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedPdfSubject, setSelectedPdfSubject] = useState(null);
  const [profileTab, setProfileTab] = useState('details');
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordMessage, setPasswordMessage] = useState(null);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [exams, setExams] = useState([]);
  const [loadingExams, setLoadingExams] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [submissionFile, setSubmissionFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState(null);
  const [className, setClassName] = useState('');
  const [sectionName, setSectionName] = useState('');
  const [books, setBooks] = useState([]);
  const [bacEntries, setBacEntries] = useState([]);
  const [loadingBac, setLoadingBac] = useState(false);
  const [selectedBacYear, setSelectedBacYear] = useState('all');
  const [selectedBacSection, setSelectedBacSection] = useState('all');
  const [selectedBacSubject, setSelectedBacSubject] = useState('all');
  const [telegramLinks, setTelegramLinks] = useState([]);
  const [loadingTelegram, setLoadingTelegram] = useState(false);
  const [packages, setPackages] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [selectedPackageLevel, setSelectedPackageLevel] = useState('all');
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);
  const [subscribing, setSubscribing] = useState(false);
  const [subscribeMessage, setSubscribeMessage] = useState(null);
  const [showPromoCodeInput, setShowPromoCodeInput] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoCodeValidated, setPromoCodeValidated] = useState(false);
  const [promoCodeMessage, setPromoCodeMessage] = useState(null);
  const [videos, setVideos] = useState([]);
  const [pdfs, setPdfs] = useState([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [showEmploiFullscreen, setShowEmploiFullscreen] = useState(false);
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = 'warning') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleSubjects = () => {
    setSubjectsOpen(!subjectsOpen);
  };

  const handleSectionChange = (section) => {
    if (section === 'subjects') {
      toggleSubjects();
      return;
    }
    
    setActiveSection(section);
    setSearchParams({ section: section });
    setSidebarOpen(false);
  };

  useEffect(() => {
    const section = searchParams.get('section');
    if (section) {
      setActiveSection(section);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchDashboardData();
    fetchUserAcademicInfo();
    refreshUserData();
    fetchDashboardStats();
  }, []);

  // Auto-refresh subscription status every 30 seconds to detect admin changes
  useEffect(() => {
    const subscriptionCheckInterval = setInterval(() => {
      console.log('🔄 Auto-refreshing subscription status...');
      fetchDashboardStats();
      refreshUserData();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(subscriptionCheckInterval);
  }, []);

  // Refresh user data when switching to dashboard
  useEffect(() => {
    if (activeSection === 'dashboard') {
      refreshUserData();
      fetchDashboardStats();
    } else if (activeSection === 'videos') {
      fetchVideos();
    } else if (activeSection === 'pdf') {
      fetchPdfs();
    }
  }, [activeSection]);

  const refreshUserData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Refreshed user data:', data.user);
        console.log('Subscription dates:', {
          start: data.user.subscription_start_date,
          end: data.user.subscription_end_date,
          duration: data.user.subscription_duration
        });
        login(data.user, localStorage.getItem('token'));
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }
    
    try {
      setUpdatingPassword(true);
      const response = await fetch('http://localhost:5000/api/users/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          oldPassword: passwordData.oldPassword,
          newPassword: passwordData.newPassword
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setPasswordMessage({ type: 'success', text: 'Password updated successfully!' });
        setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setPasswordMessage({ type: 'error', text: data.message || 'Failed to update password' });
      }
    } catch (error) {
      setPasswordMessage({ type: 'error', text: 'Failed to update password' });
    } finally {
      setUpdatingPassword(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const [coursesRes, progressRes] = await Promise.all([
        coursesAPI.getEnrolled(),
        progressAPI.getByUser()
      ]);
      
      setEnrolledCourses(coursesRes.data);
      setProgress(progressRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      setLoadingStats(true);
      const response = await dashboardAPI.getStudentStats();
      console.log('Dashboard Stats Response:', response.data);
      console.log('Subscription Status:', response.data?.subscription);
      setDashboardStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchVideos = async () => {
    try {
      setLoadingResources(true);
      const response = await resourcesAPI.getForStudent('video');
      const data = response.data || response;
      setVideos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching videos:', error);
      setVideos([]);
    } finally {
      setLoadingResources(false);
    }
  };

  const fetchPdfs = async () => {
    try {
      setLoadingResources(true);
      const response = await resourcesAPI.getForStudent('pdf');
      const data = response.data || response;
      setPdfs(Array.isArray(data) ? data : []);
    } catch (error) {
      setPdfs([]);
      console.error('Error fetching PDFs:', error);
    } finally {
      setLoadingResources(false);
    }
  };

  const fetchUserAcademicInfo = async () => {
    try {
      console.log('=== FETCHING ACADEMIC INFO ===');
      console.log('User data:', user);
      console.log('User class_id:', user?.class_id, 'Type:', typeof user?.class_id);
      console.log('User section_id:', user?.section_id, 'Type:', typeof user?.section_id);
      
      if (user?.class_id) {
        const classRes = await fetch(`http://localhost:5000/api/classes/active`);
        const classes = await classRes.json();
        console.log('All classes:', classes);
        const userClass = classes.find(c => {
          console.log('Comparing class:', c.id, 'with user class_id:', user.class_id, 'Match:', c.id == user.class_id);
          return c.id == user.class_id; // Use == for type coercion
        });
        console.log('Found user class:', userClass);
        if (userClass) {
          setClassName(userClass.name);
          console.log('Set class name to:', userClass.name);
        }
      }
      
      if (user?.section_id) {
        const sectionRes = await fetch(`http://localhost:5000/api/sections/active`);
        const sections = await sectionRes.json();
        console.log('All sections:', sections);
        const userSection = sections.find(s => {
          console.log('Comparing section:', s.id, 'with user section_id:', user.section_id, 'Match:', s.id == user.section_id);
          return s.id == user.section_id; // Use == for type coercion
        });
        console.log('Found user section:', userSection);
        if (userSection) {
          setSectionName(userSection.name);
          console.log('Set section name to:', userSection.name);
        }
      }
      console.log('=== DONE FETCHING ACADEMIC INFO ===');
    } catch (error) {
      console.error('Error fetching academic info:', error);
    }
  };

  const fetchExams = async () => {
    try {
      setLoadingExams(true);
      const response = await fetch('http://localhost:5000/api/exams/student/my-exams', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setExams(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching exams:', error);
      setExams([]);
    } finally {
      setLoadingExams(false);
    }
  };

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const response = await booksAPI.getActive();
      setBooks(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching books:', error);
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBacEntries = async () => {
    try {
      setLoadingBac(true);
      const response = await bacAPI.getStudent();
      setBacEntries(response.data.data || []);
    } catch (error) {
      console.error('Error fetching bac entries:', error);
      setBacEntries([]);
    } finally {
      setLoadingBac(false);
    }
  };

  const handleDownloadBac = (pdfData, filename) => {
    const isBacSubscriptionActive = dashboardStats?.subscription?.isActive || false;
    if (!isBacSubscriptionActive) {
      showNotification('🔒 Subscription required to download exams! Check Offers to unlock.');
      return;
    }
    if (pdfData) {
      const link = document.createElement('a');
      link.href = pdfData;
      link.download = filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert('PDF file not available');
    }
  };

  const fetchTelegramLinks = async () => {
    try {
      setLoadingTelegram(true);
      const response = await telegramAPI.getStudent();
      setTelegramLinks(response.data.data || []);
    } catch (error) {
      console.error('Error fetching telegram links:', error);
      setTelegramLinks([]);
    } finally {
      setLoadingTelegram(false);
    }
  };

  const fetchPackages = async () => {
    try {
      setLoadingPackages(true);
      const response = await packagesAPI.getActive();
      setPackages(response.data || []);
    } catch (error) {
      console.error('Error fetching packages:', error);
      setPackages([]);
    } finally {
      setLoadingPackages(false);
    }
  };

  const handleReceiptChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setReceiptFile(file);
        setSubscribeMessage(null);
      } else {
        setSubscribeMessage({ type: 'error', text: 'Please upload an image file (PNG, JPG, etc.)' });
      }
    }
  };

  const handlePromoCodeValidation = async () => {
    if (!promoCode.trim()) {
      setPromoCodeMessage({ type: 'error', text: 'Please enter a promo code' });
      return;
    }

    try {
      const response = await promoCodesAPI.validate(promoCode.trim());
      setPromoCodeValidated(true);
      setPromoCodeMessage({ 
        type: 'success', 
        text: `✓ Promo code "${promoCode.toUpperCase()}" is valid!` 
      });
    } catch (error) {
      setPromoCodeValidated(false);
      setPromoCodeMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Invalid promo code' 
      });
    }
  };

  const handleSubscribeSubmit = async () => {
    if (!receiptFile) {
      setSubscribeMessage({ type: 'error', text: 'Please upload your payment receipt' });
      return;
    }

    // If promo code is entered but not validated, check it first
    if (showPromoCodeInput && promoCode.trim() && !promoCodeValidated) {
      setSubscribeMessage({ 
        type: 'error', 
        text: 'Please validate your promo code first, or remove it to continue without a code' 
      });
      return;
    }

    try {
      setSubscribing(true);
      const formData = new FormData();
      formData.append('receipt', receiptFile);
      formData.append('package_id', selectedPackage.id);
      
      // Include promo code only if it was validated
      if (promoCodeValidated && promoCode.trim()) {
        formData.append('promo_code', promoCode.trim().toUpperCase());
      }

      await subscriptionsAPI.create(formData);
      
      setSubscribeMessage({ 
        type: 'success', 
        text: 'Thanks for subscribing! Your account will be active soon.' 
      });
      
      setTimeout(() => {
        setShowSubscribeModal(false);
        setReceiptFile(null);
        setSubscribeMessage(null);
        setSelectedPackage(null);
      }, 3000);
      
    } catch (error) {
      console.error('Error submitting subscription:', error);
      setSubscribeMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to submit subscription. Please try again.' 
      });
    } finally {
      setSubscribing(false);
    }
  };

  const handleViewExam = (exam) => {
    const now = new Date();
    const startTime = new Date(exam.start_time);
    
    if (now < startTime) {
      alert('This exam is not yet available. It will start on ' + new Date(exam.start_time).toLocaleString());
      return;
    }

    if (exam.exam_file_url) {
      // Download the PDF
      const link = document.createElement('a');
      link.href = exam.exam_file_url;
      link.download = `${exam.title}_exam.pdf`;
      link.click();
    } else {
      alert('No exam file available');
    }
  };

  const openSubmitModal = (exam) => {
    const now = new Date();
    const startTime = new Date(exam.start_time);
    const endTime = new Date(exam.end_time);
    
    if (now < startTime) {
      alert('This exam has not started yet');
      return;
    }
    
    if (now > endTime) {
      alert('The submission deadline for this exam has passed');
      return;
    }
    
    setSelectedExam(exam);
    setShowSubmitModal(true);
    setSubmitMessage(null);
  };

  const handleSubmitExam = async (e) => {
    e.preventDefault();
    
    if (!submissionFile) {
      setSubmitMessage({ type: 'error', text: 'Please select a file to submit' });
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(submissionFile);
      reader.onload = async () => {
        const response = await fetch('http://localhost:5000/api/exams/student/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            exam_id: selectedExam.id,
            submission_file_url: reader.result
          })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          setSubmitMessage({ type: 'success', text: 'Exam submitted successfully!' });
          setSubmissionFile(null);
          fetchExams(); // Refresh exams list
          setTimeout(() => {
            setShowSubmitModal(false);
            setSubmitMessage(null);
          }, 2000);
        } else {
          setSubmitMessage({ type: 'error', text: data.message || 'Failed to submit exam' });
        }
      };
      
      reader.onerror = () => {
        setSubmitMessage({ type: 'error', text: 'Failed to read file' });
      };
    } catch (error) {
      setSubmitMessage({ type: 'error', text: 'Failed to submit exam' });
    } finally {
      setSubmitting(false);
    }
  };

  const getExamStatus = (exam) => {
    const now = new Date();
    const startTime = new Date(exam.start_time);
    const endTime = new Date(exam.end_time);
    const twentyFourHoursBefore = new Date(startTime.getTime() - (24 * 60 * 60 * 1000));
    
    // If student already submitted
    if (exam.has_submitted > 0) {
      return { status: 'submitted', color: '#10b981' };
    }
    
    // If exam hasn't appeared yet (more than 24h before start)
    if (now < twentyFourHoursBefore) {
      return { status: 'upcoming', color: '#6b7280', hide: true }; // Hidden
    }
    
    // If within 24h before start - show as locked
    if (now < startTime) {
      return { status: 'locked', color: '#f59e0b' };
    }
    
    // If past end time - expired
    if (now > endTime) {
      return { status: 'expired', color: '#ef4444' };
    }
    
    // Currently available
    return { status: 'available', color: '#3b82f6' };
  };

  const getTimeRemaining = (exam) => {
    const now = new Date();
    const startTime = new Date(exam.start_time);
    const endTime = new Date(exam.end_time);
    const twentyFourHoursBefore = new Date(startTime.getTime() - (24 * 60 * 60 * 1000));
    
    // If more than 24h before start
    if (now < twentyFourHoursBefore) {
      return 'Not visible yet';
    }
    
    // If within 24h before start
    if (now < startTime) {
      const diff = startTime - now;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `Unlocks in: ${hours}h ${minutes}m`;
    }
    
    // If currently available
    if (now < endTime) {
      const diff = endTime - now;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `Time left: ${hours}h ${minutes}m`;
    }
    
    return 'Expired';
  };

  useEffect(() => {
    if (activeSection === 'exams') {
      fetchExams();
      // Refresh every minute to update timers
      const interval = setInterval(fetchExams, 60000);
      return () => clearInterval(interval);
    } else if (activeSection === 'books') {
      fetchBooks();
    } else if (activeSection === 'baccalaureate') {
      fetchBacEntries();
    } else if (activeSection === 'telegram') {
      fetchTelegramLinks();
    } else if (activeSection === 'offers') {
      fetchPackages();
    }
  }, [activeSection]);

  const renderContent = () => {
    switch(activeSection) {
      case 'home':
        return <div className="page-content"><h2>Home</h2><p>Welcome to your learning hub...</p></div>;
      case 'dashboard':
        // Calculate days left in subscription
        const calculateDaysLeft = () => {
          if (!user?.subscription_end_date) return null;
          
          const endDate = new Date(user.subscription_end_date);
          const today = new Date();
          const diffTime = endDate - today;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays < 0) return null; // Subscription expired
          
          return diffDays;
        };
        
        const daysLeft = calculateDaysLeft();
        const formatDate = (dateString) => {
          if (!dateString) return '';
          const date = new Date(dateString);
          return date.toLocaleDateString('en-GB');
        };
        
        const isSubscriptionActive = dashboardStats?.subscription?.isActive || false;
        
        return (
          <div className="page-content">
            {/* SUBSCRIPTION BOX - Dynamic Data */}
            {user?.subscription_end_date && daysLeft !== null && daysLeft >= 0 ? (
              <>
                {/* Red Warning Alert for Expiring Subscription */}
                {daysLeft <= 7 && (
                  <div className="subscription-warning-alert">
                    <span className="alert-icon">⚠️</span>
                    <span className="alert-text">
                      Your subscription will end soon! Only {daysLeft} {daysLeft === 1 ? 'day' : 'days'} remaining.
                    </span>
                  </div>
                )}
                
                <div className={`subscription-info-box ${daysLeft <= 7 ? 'expiring-box' : ''}`}>
                  <div className="subscription-status">
                    <span className="status-label">Active Subscription</span>
                    <span className={`status-badge ${daysLeft <= 7 ? 'expiring' : 'active'}`}>
                      {daysLeft <= 7 ? '⚠️ Expiring Soon' : '✓ Active'}
                    </span>
                  </div>
                  <div className="subscription-details">
                    <div className="subscription-detail-item">
                      <span className="detail-label">Days left:</span>
                      <span className={`detail-value days-count ${daysLeft <= 7 ? 'expiring-count' : ''}`}>{daysLeft}</span>
                    </div>
                  {user?.subscription_duration && (
                    <div className="subscription-detail-item">
                      <span className="detail-label">Duration:</span>
                      <span className="detail-value duration-value">
                        {user.subscription_duration} {user.subscription_duration === 1 ? 'Month' : 'Months'}
                      </span>
                    </div>
                  )}
                  <div className="subscription-dates">
                    <div className="date-item">
                      <span className="date-label">Started:</span>
                      <span className="date-value">{formatDate(user.subscription_start_date)}</span>
                    </div>
                    <div className="date-item">
                      <span className="date-label">Expires:</span>
                      <span className="date-value">{formatDate(user.subscription_end_date)}</span>
                    </div>
                  </div>
                </div>
              </div>
              </>
            ) : (
              <div className="no-subscription-box">
                <div className="no-subscription-icon">📦</div>
                <h3>No Active Subscription</h3>
                <p>Subscribe to unlock all premium features and content!</p>
                <button 
                  className="subscribe-now-btn"
                  onClick={() => setActiveSection('offers')}
                >
                  View Packages
                </button>
              </div>
            )}

            <h1>Dashboard Overview</h1>
            <p className="dashboard-subtitle">Track your learning progress and achievements</p>
            
            {!isSubscriptionActive && (
              <div className="subscription-notice">
                <span className="notice-icon">🔒</span>
                <span className="notice-text">You can browse content but need an active subscription to interact. </span>
                <button className="notice-btn" onClick={() => setActiveSection('offers')}>Check Offers</button>
              </div>
            )}
            
            {loadingStats || loading ? (
              <div className="loading-state">Loading your data...</div>
            ) : (
              <>
                {/* DYNAMIC STATISTICS GRID */}
                <div className="stats-grid">
                  <div className="stat-card blue">
                    <div className="stat-icon">🎬</div>
                    <h3>{dashboardStats?.overview?.total_videos || 0}</h3>
                    <p>Video Lessons</p>
                    <span className="stat-detail">Available to watch</span>
                  </div>
                  <div className="stat-card green">
                    <div className="stat-icon">📄</div>
                    <h3>{dashboardStats?.overview?.total_pdfs || 0}</h3>
                    <p>PDF Resources</p>
                    <span className="stat-detail">Study materials</span>
                  </div>
                  <div className="stat-card orange">
                    <div className="stat-icon">📝</div>
                    <h3>{dashboardStats?.overview?.total_exams || 0}</h3>
                    <p>Upcoming Exams</p>
                    <span className="stat-detail">This month</span>
                  </div>
                  <div className="stat-card purple">
                    <div className="stat-icon">📚</div>
                    <h3>{dashboardStats?.overview?.total_subjects || 0}</h3>
                    <p>Active Subjects</p>
                    <span className="stat-detail">Your curriculum</span>
                  </div>
                </div>

                {/* RESOURCES BY SUBJECT */}
                {dashboardStats?.resourcesBySubject && dashboardStats.resourcesBySubject.length > 0 && (
                  <div className="recent-section">
                    <h2>📊 Resources by Subject</h2>
                    <div className="subject-resources-grid">
                      {dashboardStats.resourcesBySubject.map(subject => (
                        <div key={subject.subject_id} className="subject-resource-card">
                          <div className="subject-header">
                            {subject.subject_image_url && (
                              <img src={subject.subject_image_url} alt={subject.subject_name} className="subject-img" />
                            )}
                            <h3>{subject.subject_name}</h3>
                          </div>
                          <div className="subject-stats">
                            <div className="subject-stat-item">
                              <span className="stat-number">{subject.video_count || 0}</span>
                              <span className="stat-label">Videos</span>
                            </div>
                            <div className="subject-stat-item">
                              <span className="stat-number">{subject.pdf_count || 0}</span>
                              <span className="stat-label">PDFs</span>
                            </div>
                            <div className="subject-stat-item">
                              <span className="stat-number">{(parseInt(subject.video_count) || 0) + (parseInt(subject.pdf_count) || 0)}</span>
                              <span className="stat-label">Total</span>
                            </div>
                          </div>
                          <button 
                            className="view-subject-btn"
                            onClick={() => {
                              if (!isSubscriptionActive) {
                                showNotification('🔒 Subscription required! Check Offers to unlock content.');
                                return;
                              }
                              setActiveSection('videos');
                              setSelectedSubject({ id: subject.subject_id, name: subject.subject_name });
                            }}
                          >
                            View Resources →
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* UPCOMING EXAMS */}
                {dashboardStats?.upcomingExams && dashboardStats.upcomingExams.length > 0 && (
                  <div className="recent-section">
                    <h2>📅 Upcoming Exams</h2>
                    <div className="upcoming-exams-list">
                      {dashboardStats.upcomingExams.slice(0, 5).map(exam => {
                        const examDate = exam.exam_date ? new Date(exam.exam_date) : null;
                        const isValidDate = examDate && !isNaN(examDate.getTime());
                        
                        return (
                          <div key={exam.id} className="exam-item-dashboard">
                            <div className="exam-date-badge">
                              <div className="exam-month">
                                {isValidDate ? examDate.toLocaleDateString('en-US', { month: 'short' }) : 'TBD'}
                              </div>
                              <div className="exam-day">
                                {isValidDate ? examDate.getDate() : '?'}
                              </div>
                            </div>
                            <div className="exam-details">
                              <h4>{exam.title}</h4>
                              <p>{exam.subject_name || 'General'}</p>
                              <span className="exam-duration">⏱ {exam.duration || 60} minutes</span>
                            </div>
                            <button className="exam-action-btn" onClick={() => {
                              if (!isSubscriptionActive) {
                                showNotification('🔒 Subscription required! Check Offers to unlock exams.');
                                return;
                              }
                              setActiveSection('exams');
                            }}>
                              View Details
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* CLASS SCHEDULE / EMPLOI */}
                {dashboardStats?.emploiSchedule && (
                  <div className="recent-section">
                    <h2>📆 Class Schedule / Emploi du Temps</h2>
                    <div className="emploi-schedule-container">
                      <div className="emploi-image-wrapper" onClick={() => {
                        if (!isSubscriptionActive) {
                          showNotification('🔒 Subscription required to view schedule! Check Offers to unlock.');
                          return;
                        }
                        setShowEmploiFullscreen(true);
                      }}>
                        <img 
                          src={dashboardStats.emploiSchedule.image_url} 
                          alt="Class Schedule" 
                          className="emploi-schedule-image"
                        />
                      </div>
                      <p className="emploi-updated">
                        Last updated: {new Date(dashboardStats.emploiSchedule.created_at).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="recent-section">
                  <h2>Continue Learning</h2>
                  <div className="courses-grid">
                    {enrolledCourses.slice(0, 4).map(course => (
                      <div key={course.id} className="course-card">
                        <img src={course.thumbnail || '/images/course-default.png'} alt={course.title} />
                        <div className="course-info">
                          <h3>{course.title}</h3>
                          <p>{course.instructor}</p>
                          <div className="progress-bar">
                            <div 
                              className="progress-fill" 
                              style={{ width: `${progress[course.id] || 0}%` }}
                            ></div>
                          </div>
                          <p className="progress-text">{progress[course.id] || 0}% Complete</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        );
      case 'profile':
        return (
          <div className="page-content">
            <div className="profile-container">
              <div className="profile-left">
                <div className="profile-card">
                  <div className="profile-banner"></div>
                  <div className="profile-avatar-wrapper">
                    <div className="profile-avatar-large">
                      {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                    </div>
                  </div>
                  <h2 className="profile-name">{user?.firstName} {user?.lastName}</h2>
                  <p className="profile-subtitle">
                    {user?.academic_level || className || sectionName ? (
                      <>
                        📚 {user?.academic_level || 'N/A'}
                        {className && ` • ${className}`}
                        {sectionName && ` • ${sectionName}`}
                      </>
                    ) : (
                      <span style={{color: '#999'}}>📚 Academic info not set</span>
                    )}
                  </p>
                  <button className="btn-edit-profile">Edit Personal File</button>
                </div>
              </div>
              
              <div className="profile-right">
                <div className="profile-tabs">
                  <button 
                    className={`tab-btn ${profileTab === 'details' ? 'active' : ''}`}
                    onClick={() => { setProfileTab('details'); setPasswordMessage(null); }}
                  >
                    Details
                  </button>
                  <button 
                    className={`tab-btn ${profileTab === 'password' ? 'active' : ''}`}
                    onClick={() => { setProfileTab('password'); setPasswordMessage(null); }}
                  >
                    Password
                  </button>
                </div>
                
                {profileTab === 'details' && (
                <div className="profile-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Last Name</label>
                      <input type="text" value={user?.lastName || ''} readOnly />
                    </div>
                    <div className="form-group">
                      <label>First Name</label>
                      <input type="text" value={user?.firstName || ''} readOnly />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Date of Birth</label>
                      <input 
                        type="text" 
                        value={user?.date_of_birth ? new Date(user.date_of_birth).toLocaleDateString('en-GB') : 'Not set'} 
                        readOnly 
                      />
                    </div>
                    <div className="form-group">
                      <label>Gender</label>
                      <input 
                        type="text" 
                        value={user?.gender ? (user.gender.charAt(0).toUpperCase() + user.gender.slice(1)) : 'Not set'} 
                        readOnly 
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input type="text" value={user?.phone || 'Not set'} readOnly />
                  </div>
                  
                  <div className="form-group">
                    <label>Email Address</label>
                    <input type="email" value={user?.email || ''} readOnly />
                  </div>
                  
                  <div className="form-group">
                    <label>Code</label>
                    <input type="text" value={user?.special_code || 'Not assigned'} readOnly />
                  </div>
                </div>
                )}
                
                {profileTab === 'password' && (
                <div className="profile-form">
                  <h3 style={{marginBottom: '20px', color: '#333'}}>Change Password</h3>
                  
                  {passwordMessage && (
                    <div className={`password-message ${passwordMessage.type}`}>
                      {passwordMessage.text}
                    </div>
                  )}
                  
                  <form onSubmit={handlePasswordChange}>
                    <div className="form-group">
                      <label>Current Password</label>
                      <input 
                        type="password" 
                        value={passwordData.oldPassword}
                        onChange={(e) => setPasswordData({...passwordData, oldPassword: e.target.value})}
                        required
                        placeholder="Enter your current password"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>New Password</label>
                      <input 
                        type="password" 
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                        required
                        minLength="6"
                        placeholder="Enter new password (min 6 characters)"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Confirm New Password</label>
                      <input 
                        type="password" 
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        required
                        placeholder="Confirm new password"
                      />
                    </div>
                    
                    <button 
                      type="submit" 
                      className="btn-update-password"
                      disabled={updatingPassword}
                    >
                      {updatingPassword ? 'Updating...' : 'Update Password'}
                    </button>
                  </form>
                </div>
                )}
              </div>
            </div>
          </div>
        );
      case 'exams':
        const isExamsSubscriptionActive = dashboardStats?.subscription?.isActive || false;
        
        const upcomingExams = exams.filter(exam => {
          const status = getExamStatus(exam);
          return !status.hide && (status.status === 'locked' || status.status === 'available' || status.status === 'submitted');
        });
        const expiredExams = exams.filter(exam => {
          const status = getExamStatus(exam);
          return !status.hide && status.status === 'expired';
        });
        
        return (
          <div className="page-content">
            <h2>My Exams</h2>
            
            {!isExamsSubscriptionActive && (
              <div className="subscription-notice">
                <span className="notice-icon">🔒</span>
                <span className="notice-text">You can browse exams but need subscription to take them. </span>
                <button className="notice-btn" onClick={() => setActiveSection('offers')}>Check Offers</button>
              </div>
            )}
            
            {loadingExams ? (
              <div className="loading-message">Loading exams...</div>
            ) : (
              <>
                {/* Upcoming/Active Exams */}
                <div className="exams-section">
                  <h3 style={{marginBottom: '20px', color: '#3b82f6'}}>📝 Upcoming & Active Exams</h3>
                  {upcomingExams.length === 0 ? (
                    <div className="empty-state">
                      <p>No upcoming exams</p>
                    </div>
                  ) : (
                    <div className="exams-grid">
                      {upcomingExams.map(exam => {
                  const examStatus = getExamStatus(exam);
                  const isLocked = examStatus.status === 'locked';
                  const isExpired = examStatus.status === 'expired';
                  const isSubmitted = examStatus.status === 'submitted';
                  
                  return (
                    <div key={exam.id} className="exam-card" style={{borderLeft: `4px solid ${examStatus.color}`}}>
                      <div className="exam-header">
                        <h3>{exam.title}</h3>
                        <span className="exam-badge" style={{background: examStatus.color}}>
                          {examStatus.status.toUpperCase()}
                        </span>
                      </div>
                      
                      <p className="exam-subject">📚 {exam.subject_name}</p>
                      {exam.description && <p className="exam-description">{exam.description}</p>}
                      
                      <p className="exam-time">
                        🕒 Start: {new Date(exam.start_time).toLocaleString()}
                      </p>
                      <p className="exam-time">
                        ⏰ End: {new Date(exam.end_time).toLocaleString()}
                      </p>
                      
                      <div className="exam-timer">
                        {getTimeRemaining(exam)}
                      </div>
                      
                      <div className="exam-actions">
                        <button 
                          className="btn-view"
                          onClick={() => handleViewExam(exam)}
                          disabled={isLocked}
                          title={isLocked ? 'Exam not yet available' : 'Download exam PDF'}
                        >
                          {isLocked ? '🔒 Locked' : '📥 View'}
                        </button>
                        <button 
                          className="btn-submit"
                          onClick={() => openSubmitModal(exam)}
                          disabled={isLocked || isExpired || isSubmitted}
                          title={
                            isLocked ? 'Exam not yet available' :
                            isExpired ? 'Submission deadline passed' :
                            isSubmitted ? 'Already submitted' :
                            'Submit your exam'
                          }
                        >
                          {isSubmitted ? '✓ Submitted' : isExpired ? '⏱️ Expired' : '📤 Submit'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
                </div>
                
                {/* Expired Exams */}
                {expiredExams.length > 0 && (
                  <div className="exams-section" style={{marginTop: '40px'}}>
                    <h3 style={{marginBottom: '20px', color: '#ef4444'}}>📚 Past Exams</h3>
                    <div className="exams-grid">
                      {expiredExams.map(exam => {
                        const examStatus = getExamStatus(exam);
                        
                        return (
                          <div key={exam.id} className="exam-card" style={{borderLeft: `4px solid ${examStatus.color}`, opacity: 0.7}}>
                            <div className="exam-header">
                              <h3>{exam.title}</h3>
                              <span className="exam-badge" style={{background: examStatus.color}}>
                                EXPIRED
                              </span>
                            </div>
                            
                            <p className="exam-subject">📚 {exam.subject_name}</p>
                            {exam.description && <p className="exam-description">{exam.description}</p>}
                            
                            <p className="exam-time">
                              🕒 Start: {new Date(exam.start_time).toLocaleString()}
                            </p>
                            <p className="exam-time">
                              ⏰ End: {new Date(exam.end_time).toLocaleString()}
                            </p>
                            
                            <div className="exam-timer" style={{color: '#ef4444'}}>
                              Expired
                            </div>
                            
                            <div className="exam-actions">
                              <button 
                                className="btn-view"
                                onClick={() => handleViewExam(exam)}
                                title="View exam PDF"
                              >
                                📄 View
                              </button>
                              <button 
                                className="btn-submit"
                                disabled
                                style={{opacity: 0.5, cursor: 'not-allowed'}}
                                title="Exam has expired"
                              >
                                ⏱️ Expired
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
            
            {/* Submit Modal */}
            {showSubmitModal && (
              <div className="modal-overlay" onClick={() => setShowSubmitModal(false)}>
                <div className="modal-content submit-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h2>Submit Exam: {selectedExam?.title}</h2>
                    <button className="modal-close" onClick={() => setShowSubmitModal(false)}>×</button>
                  </div>
                  
                  {submitMessage && (
                    <div className={`submit-message ${submitMessage.type}`}>
                      {submitMessage.text}
                    </div>
                  )}
                  
                  <form onSubmit={handleSubmitExam}>
                    <div className="form-group">
                      <label>Upload Your Completed Exam (PDF)</label>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setSubmissionFile(e.target.files[0])}
                        required
                      />
                      {submissionFile && (
                        <p className="file-name">Selected: {submissionFile.name}</p>
                      )}
                    </div>
                    
                    <div className="modal-actions">
                      <button
                        type="button"
                        className="btn-cancel"
                        onClick={() => setShowSubmitModal(false)}
                        disabled={submitting}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn-submit-exam"
                        disabled={submitting}
                      >
                        {submitting ? '⏳ Submitting...' : '📤 Submit Exam'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        );
      case 'grades':
        const gradedExams = exams.filter(exam => exam.grade !== null && exam.grade !== undefined);
        
        return (
          <div className="page-content">
            <h2>📊 My Grades</h2>
            {loadingExams ? (
              <div className="loading-message">Loading grades...</div>
            ) : gradedExams.length === 0 ? (
              <div className="empty-state">
                <p>📝 No graded exams yet</p>
              </div>
            ) : (
              <div className="grades-container">
                <div className="grades-summary" style={{
                  padding: '1.5rem',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '12px',
                  color: 'white',
                  marginBottom: '2rem',
                  textAlign: 'center'
                }}>
                  <h3 style={{margin: '0 0 0.5rem 0'}}>Total Graded Exams</h3>
                  <p style={{fontSize: '2.5rem', fontWeight: 'bold', margin: 0, color: 'white'}}>{gradedExams.length}</p>
                </div>
                
                <div className="grades-grid" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: '1.5rem'
                }}>
                  {gradedExams.map(exam => (
                    <div key={exam.id} className="grade-card" style={{
                      background: 'white',
                      borderRadius: '12px',
                      padding: '1.5rem',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                      border: '2px solid #e9ecef',
                      transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                    }}>
                      <div className="grade-header" style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '1rem',
                        paddingBottom: '1rem',
                        borderBottom: '2px solid #e9ecef'
                      }}>
                        <h3 style={{margin: 0, color: '#495057'}}>{exam.title}</h3>
                        <span style={{
                          background: exam.grade >= 10 ? '#28a745' : '#ffc107',
                          color: exam.grade >= 10 ? 'white' : '#212529',
                          padding: '0.4rem 0.8rem',
                          borderRadius: '20px',
                          fontSize: '0.85rem',
                          fontWeight: '600'
                        }}>
                          {exam.grade >= 10 ? 'Pass' : 'Review'}
                        </span>
                      </div>
                      
                      <p style={{color: '#6c757d', marginBottom: '0.5rem'}}>
                        📚 Subject: <strong>{exam.subject_name}</strong>
                      </p>
                      <p style={{color: '#6c757d', marginBottom: '0.5rem'}}>
                        📅 Date: {new Date(exam.end_time).toLocaleDateString()}
                      </p>
                      
                      <div style={{
                        marginTop: '1.5rem',
                        padding: '1rem',
                        background: 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)',
                        borderRadius: '8px',
                        textAlign: 'center',
                        border: '2px solid #28a745'
                      }}>
                        <span style={{fontSize: '0.9rem', color: '#155724', fontWeight: '600'}}>
                          Your Grade
                        </span>
                        <div style={{fontSize: '2.5rem', color: '#28a745', fontWeight: '700', marginTop: '0.5rem'}}>
                          {exam.grade}/20
                        </div>
                      </div>
                      
                      <div style={{marginTop: '1rem', display: 'flex', gap: '0.5rem'}}>
                        <button 
                          onClick={() => handleViewExam(exam)}
                          style={{
                            flex: 1,
                            background: '#667eea',
                            color: 'white',
                            border: 'none',
                            padding: '0.75rem',
                            borderRadius: '6px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseOver={(e) => e.target.style.background = '#764ba2'}
                          onMouseOut={(e) => e.target.style.background = '#667eea'}
                        >
                          📄 View Exam
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      case 'videos':
        const isVideoSubscriptionActive = dashboardStats?.subscription?.isActive || false;
        
        // Group videos by subject
        const videosBySubject = (Array.isArray(videos) ? videos : []).reduce((acc, video) => {
          if (!acc[video.subject_name]) {
            acc[video.subject_name] = [];
          }
          acc[video.subject_name].push(video);
          return acc;
        }, {});

        return (
          <div className="page-content">
            <h2>📹 Video Lessons</h2>
            
            {!isVideoSubscriptionActive && (
              <div className="subscription-notice">
                <span className="notice-icon">🔒</span>
                <span className="notice-text">You can browse videos but need subscription to watch. </span>
                <button className="notice-btn" onClick={() => setActiveSection('offers')}>Check Offers</button>
              </div>
            )}
            
            {!selectedSubject ? (
              <div className="subjects-grid">
                {loadingResources ? (
                  <div className="loading-state">Loading videos...</div>
                ) : Object.keys(videosBySubject).length === 0 ? (
                  <div className="empty-state">
                    <p>No video lessons available yet</p>
                  </div>
                ) : (
                  Object.entries(videosBySubject).map(([subjectName, subjectVideos]) => (
                    <div 
                      key={subjectName} 
                      className="subject-card-clickable"
                      onClick={() => {
                        if (!isVideoSubscriptionActive) {
                          showNotification('🔒 Subscription required to watch videos! Check Offers to unlock.');
                          return;
                        }
                        setSelectedSubject({ name: subjectName, videos: subjectVideos });
                      }}
                    >
                      <div className="subject-thumbnail">
                        <span className="subject-icon">📚</span>
                      </div>
                      <h3>{subjectName}</h3>
                      <div className="subject-stats">
                        <span>📹 {subjectVideos.length} Videos</span>
                        {subjectVideos[0]?.chapter_name && (
                          <span>📖 {subjectVideos[0].chapter_name}</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="video-player-container">
                <button className="btn-back" onClick={() => { setSelectedSubject(null); setSelectedVideo(null); }}>
                  ← Back to Subjects
                </button>
                
                <div className="video-content-layout">
                  {selectedVideo && (
                    <div className="video-player-section">
                      <div className="video-player">
                        {console.log('🎥 Video URL:', selectedVideo.resource_url)}
                        {console.log('📹 Selected Video:', selectedVideo)}
                        <video
                          key={selectedVideo.id}
                          controls
                          controlsList="nodownload"
                          preload="metadata"
                          style={{ width: '100%', height: '100%', backgroundColor: '#000' }}
                          src={`http://localhost:5000${selectedVideo.resource_url}`}
                          onError={(e) => {
                            console.error('❌ Video Error:', e);
                            console.error('❌ Video URL that failed:', selectedVideo.resource_url);
                          }}
                          onLoadStart={() => console.log('📥 Video loading started...')}
                          onLoadedMetadata={() => console.log('✅ Video metadata loaded')}
                          onCanPlay={() => console.log('▶️ Video can play')}
                        >
                          Your browser does not support the video tag.
                        </video>
                      </div>
                      <div className="video-info">
                        <h3>{selectedVideo.title}</h3>
                        {selectedVideo.description && (
                          <p className="video-description">{selectedVideo.description}</p>
                        )}
                        <p className="video-meta">
                          {selectedVideo.duration_seconds && `⏱️ ${Math.floor(selectedVideo.duration_seconds / 60)}:${(selectedVideo.duration_seconds % 60).toString().padStart(2, '0')}`}
                          {selectedVideo.file_size_mb && ` • ${selectedVideo.file_size_mb} MB`}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className={`sessions-list ${selectedVideo ? 'with-video' : 'full-width'}`}>
                    <h3>📹 {selectedSubject.name} - Videos</h3>
                    <div className="sessions-container">
                      {selectedSubject.videos.map((video, index) => (
                        <div 
                          key={video.id}
                          className={`session-item ${selectedVideo?.id === video.id ? 'active' : ''}`}
                          onClick={() => setSelectedVideo(video)}
                        >
                          <div className="session-number">{index + 1}</div>
                          <div className="session-details">
                            <h4>{video.title}</h4>
                            {video.duration_seconds && (
                              <span className="session-duration">
                                ⏱️ {Math.floor(video.duration_seconds / 60)}:{(video.duration_seconds % 60).toString().padStart(2, '0')}
                              </span>
                            )}
                          </div>
                          <span className="session-play">▶️</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      case 'pdf':
        const isPdfSubscriptionActive = dashboardStats?.subscription?.isActive || false;
        
        // Group PDFs by subject
        const pdfsBySubject = (Array.isArray(pdfs) ? pdfs : []).reduce((acc, pdf) => {
          if (!acc[pdf.subject_name]) {
            acc[pdf.subject_name] = [];
          }
          acc[pdf.subject_name].push(pdf);
          return acc;
        }, {});

        const handleDownloadPdf = (pdf) => {
          if (!isPdfSubscriptionActive) {
            showNotification('🔒 Subscription required to download PDFs! Check Offers to unlock.');
            return;
          }
          const link = document.createElement('a');
          link.href = pdf.resource_url;
          link.download = `${pdf.title}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        };

        return (
          <div className="page-content">
            <h2>📄 PDF Materials</h2>
            
            {!isPdfSubscriptionActive && (
              <div className="subscription-notice">
                <span className="notice-icon">🔒</span>
                <span className="notice-text">You can browse PDFs but need subscription to download. </span>
                <button className="notice-btn" onClick={() => setActiveSection('offers')}>Check Offers</button>
              </div>
            )}
            
            <div className="subjects-accordion">
              {loadingResources ? (
                <div className="loading-state">Loading PDF materials...</div>
              ) : Object.keys(pdfsBySubject).length === 0 ? (
                <div className="empty-state">
                  <p>No PDF materials available yet</p>
                </div>
              ) : (
                Object.entries(pdfsBySubject).map(([subjectName, subjectPdfs]) => (
                  <div key={subjectName} className="accordion-item">
                    <div 
                      className={`accordion-header ${selectedPdfSubject === subjectName ? 'open' : ''}`}
                      onClick={() => setSelectedPdfSubject(selectedPdfSubject === subjectName ? null : subjectName)}
                    >
                      <div className="accordion-title">
                        <span className="subject-icon-small">📚</span>
                        <h3>{subjectName}</h3>
                      </div>
                      <div className="accordion-meta">
                        <span className="pdf-count">📄 {subjectPdfs.length} PDFs</span>
                        <span className={`accordion-arrow ${selectedPdfSubject === subjectName ? 'open' : ''}`}>▼</span>
                      </div>
                    </div>
                    
                    <div className={`accordion-content ${selectedPdfSubject === subjectName ? 'open' : ''}`}>
                      <div className="pdfs-grid">
                        {subjectPdfs.map((pdf) => (
                          <div key={pdf.id} className="pdf-card">
                            <div className="pdf-preview">
                              <span className="pdf-icon-large">📕</span>
                            </div>
                            <div className="pdf-details">
                              <h4>{pdf.title}</h4>
                              {pdf.description && <p className="pdf-description">{pdf.description}</p>}
                              <p className="pdf-size">
                                {pdf.file_size_mb ? `${pdf.file_size_mb} MB` : 'PDF Document'}
                                {pdf.chapter_name && ` • ${pdf.chapter_name}`}
                              </p>
                              <button 
                                className="btn-download-primary"
                                onClick={() => handleDownloadPdf(pdf)}
                              >
                                <span>⬇</span> Download
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      case 'books':
        const isBooksSubscriptionActive = dashboardStats?.subscription?.isActive || false;
        
        return (
          <div className="page-content">
            <h2>📚 Books</h2>
            
            {!isBooksSubscriptionActive && (
              <div className="subscription-notice">
                <span className="notice-icon">🔒</span>
                <span className="notice-text">You can browse books but need subscription to download. </span>
                <button className="notice-btn" onClick={() => setActiveSection('offers')}>Check Offers</button>
              </div>
            )}
            
            {loading ? (
              <div className="loading-message">Loading books...</div>
            ) : books.length === 0 ? (
              <div className="empty-state">
                <p>📚 No books available yet</p>
              </div>
            ) : (
              <div className="books-grid">
                {books.map((book) => (
                  <div key={book.id} className="book-card">
                    <div className="book-thumbnail">
                      {book.cover_image_url ? (
                        <img src={book.cover_image_url} alt={book.title} style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px'}} />
                      ) : (
                        <span className="book-icon">📖</span>
                      )}
                    </div>
                    <h3>{book.title}</h3>
                    <p className="book-subject">📚 {book.subject_name || 'General'}</p>
                    {book.description && <p className="book-description">{book.description}</p>}
                    <button 
                      className="btn-view-books"
                      onClick={() => {
                        if (!isBooksSubscriptionActive) {
                          showNotification('🔒 Subscription required to download books! Check Offers to unlock.');
                          return;
                        }
                        if (book.pdf_file_url) {
                          // Create a temporary link and trigger download
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
                      }}
                    >
                      📥 Download Book
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'baccalaureate':
        const isBacSubscriptionActive = dashboardStats?.subscription?.isActive || false;
        
        // Get unique values for filters
        const years = ['all', ...new Set(bacEntries.map(entry => entry.year).filter(Boolean))].sort((a, b) => {
          if (a === 'all') return -1;
          if (b === 'all') return 1;
          return b - a;
        });
        
        const sections = ['all', ...new Set(bacEntries.map(entry => entry.section_name).filter(Boolean))];
        const subjects = ['all', ...new Set(bacEntries.map(entry => entry.subject_name).filter(Boolean))].sort();

        // Filter entries
        const filteredBacEntries = bacEntries.filter(entry => {
          if (selectedBacYear !== 'all' && entry.year !== parseInt(selectedBacYear)) return false;
          if (selectedBacSection !== 'all' && entry.section_name !== selectedBacSection) return false;
          if (selectedBacSubject !== 'all' && entry.subject_name !== selectedBacSubject) return false;
          return true;
        });

        // Group by year
        const groupedByYear = filteredBacEntries.reduce((acc, entry) => {
          const year = entry.year;
          if (!acc[year]) acc[year] = [];
          acc[year].push(entry);
          return acc;
        }, {});

        const sortedYears = Object.keys(groupedByYear).sort((a, b) => b - a);

        return (
          <div className="page-content">
            <h2>🎯 Baccalaureate Exams</h2>
            
            {!isBacSubscriptionActive && (
              <div className="subscription-notice">
                <span className="notice-icon">🔒</span>
                <span className="notice-text">You can browse exams but need subscription to download. </span>
                <button className="notice-btn" onClick={() => setActiveSection('offers')}>Check Offers</button>
              </div>
            )}
            
            {bacEntries.length > 0 && (
              <div className="bac-filters-inline">
                <div className="filter-group-inline">
                  <label>📅 Year:</label>
                  <select value={selectedBacYear} onChange={(e) => setSelectedBacYear(e.target.value)}>
                    {years.map(year => (
                      <option key={year} value={year}>
                        {year === 'all' ? 'All Years' : year}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="filter-group-inline">
                  <label>📚 Section:</label>
                  <select value={selectedBacSection} onChange={(e) => setSelectedBacSection(e.target.value)}>
                    {sections.map(section => (
                      <option key={section} value={section}>
                        {section === 'all' ? 'All Sections' : section}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="filter-group-inline">
                  <label>📖 Subject:</label>
                  <select value={selectedBacSubject} onChange={(e) => setSelectedBacSubject(e.target.value)}>
                    {subjects.map(subject => (
                      <option key={subject} value={subject}>
                        {subject === 'all' ? 'All Subjects' : subject}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {loadingBac ? (
              <div className="loading-message">Loading baccalaureate exams...</div>
            ) : filteredBacEntries.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🎯</div>
                <p>{bacEntries.length === 0 
                  ? '📚 No baccalaureate exams available yet' 
                  : '📚 No exams match your filters'}</p>
              </div>
            ) : (
              <div className="bac-years-container">
                {sortedYears.map(year => (
                  <div key={year} className="year-exams-group">
                    <div className="year-title-header">
                      <h3>📅 Year {year}</h3>
                      <span className="exam-count-badge">{groupedByYear[year].length} exam{groupedByYear[year].length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="exam-items-grid">
                      {groupedByYear[year].map(entry => (
                        <div key={entry.id} className="exam-item-card">
                          <div className="exam-card-info">
                            <div className="exam-card-header">
                              <h4>{entry.subject_name}</h4>
                              {entry.section_name && (
                                <span className="section-badge-small">{entry.section_name}</span>
                              )}
                            </div>
                            <div className="exam-card-year">📅 {entry.year}</div>
                          </div>
                          <div className="exam-card-actions">
                            <button
                              className="btn-download-exam"
                              onClick={() => handleDownloadBac(entry.exam_pdf, `${entry.subject_name}_${entry.year}_Exam.pdf`)}
                              disabled={!entry.exam_pdf}
                              title={entry.exam_pdf ? 'Download exam paper' : 'Exam not available'}
                            >
                              📝 Exam
                            </button>
                            <button
                              className="btn-download-correction"
                              onClick={() => handleDownloadBac(entry.correction_pdf, `${entry.subject_name}_${entry.year}_Correction.pdf`)}
                              disabled={!entry.correction_pdf}
                              title={entry.correction_pdf ? 'Download correction' : 'Correction not available'}
                            >
                              ✓ Correction
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'telegram':
        const isTelegramSubscriptionActive = dashboardStats?.subscription?.isActive || false;
        
        return (
          <div className="page-content">
            <h2>✈️ Telegram Groups</h2>
            
            {!isTelegramSubscriptionActive && (
              <div className="subscription-notice">
                <span className="notice-icon">🔒</span>
                <span className="notice-text">You can see groups but need subscription to join. </span>
                <button className="notice-btn" onClick={() => setActiveSection('offers')}>Check Offers</button>
              </div>
            )}
            
            {loadingTelegram ? (
              <div className="loading-message">Loading telegram groups...</div>
            ) : telegramLinks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">✈️</div>
                <p>📱 No telegram groups available yet</p>
              </div>
            ) : (
              <div className="telegram-grid">
                {telegramLinks.map((link) => (
                  <div key={link.id} className="telegram-card">
                    <div className="telegram-icon">✈️</div>
                    <h3>{link.group_name}</h3>
                    {link.description && <p className="telegram-description">{link.description}</p>}
                    <button
                      onClick={() => {
                        if (!isTelegramSubscriptionActive) {
                          showNotification('🔒 Subscription required to join Telegram groups! Check Offers to unlock.');
                          return;
                        }
                        window.open(link.link_url, '_blank');
                      }}
                      className="btn-join-telegram"
                    >
                      Join Group
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'live-sessions':
        const isLiveSessionsSubscriptionActive = dashboardStats?.subscription?.isActive || false;
        
        return (
          <div className="page-content">
            {!isLiveSessionsSubscriptionActive && (
              <div className="subscription-notice">
                <span className="notice-icon">🔒</span>
                <span className="notice-text">You can see live sessions but need subscription to join. </span>
                <button className="notice-btn" onClick={() => setActiveSection('offers')}>Check Offers</button>
              </div>
            )}
            
            <LiveSessions 
              userClassId={user?.class_id} 
              userLevelId={user?.level_id} 
              userSectionId={user?.section_id}
              isSubscriptionActive={isLiveSessionsSubscriptionActive}
              showNotification={showNotification}
            />
          </div>
        );
      case 'calendar':
        const isCalendarSubscriptionActive = dashboardStats?.subscription?.isActive || false;
        
        return (
          <div className="page-content">
            {!isCalendarSubscriptionActive && (
              <div className="subscription-notice">
                <span className="notice-icon">🔒</span>
                <span className="notice-text">You can view calendar but need subscription for full access. </span>
                <button className="notice-btn" onClick={() => setActiveSection('offers')}>Check Offers</button>
              </div>
            )}
            
            <StudentCalendar 
              userClassId={user?.class_id} 
              userLevelId={user?.level_id} 
              userSectionId={user?.section_id}
            />
          </div>
        );
      case 'offers':
        return (
          <div className="page-content">
            <div className="offers-header">
              <h1>📦 Packages & Offers</h1>
              <p className="subtitle">Choose the perfect package for your learning journey</p>
            </div>

            <div className="package-filters">
              <button
                className={`filter-btn ${selectedPackageLevel === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedPackageLevel('all')}
              >
                All Packages
              </button>
              <button
                className={`filter-btn ${selectedPackageLevel === 'Primaire' ? 'active' : ''}`}
                onClick={() => setSelectedPackageLevel('Primaire')}
              >
                Primaire
              </button>
              <button
                className={`filter-btn ${selectedPackageLevel === 'Collège' ? 'active' : ''}`}
                onClick={() => setSelectedPackageLevel('Collège')}
              >
                Collège
              </button>
              <button
                className={`filter-btn ${selectedPackageLevel === 'Lycée' ? 'active' : ''}`}
                onClick={() => setSelectedPackageLevel('Lycée')}
              >
                Lycée
              </button>
            </div>

            {loadingPackages ? (
              <div className="loading-message">
                <div className="spinner"></div>
                <p>Loading packages...</p>
              </div>
            ) : packages.length === 0 ? (
              <div className="no-content-message">
                <div className="no-content-icon">📦</div>
                <h3>No Packages Available</h3>
                <p>Check back later for exciting offers!</p>
              </div>
            ) : (
              <div className="packages-grid">
                {packages
                  .filter(pkg => {
                    if (selectedPackageLevel === 'all') return true;
                    return pkg.level_names && pkg.level_names.includes(selectedPackageLevel);
                  })
                  .map((pkg) => (
                  <div key={pkg.id} className="package-card">
                    <div className="package-image-container">
                      {pkg.package_image_url ? (
                        <img src={pkg.package_image_url} alt={pkg.name} className="package-image" />
                      ) : (
                        <div className="package-placeholder">
                          <span className="package-icon">📚</span>
                        </div>
                      )}
                      <div className="package-type-badge">{pkg.type || 'Standard'}</div>
                    </div>
                    
                    <div className="package-content">
                      <h3 className="package-name">{pkg.name}</h3>
                      
                      {pkg.description && (
                        <p className="package-description">{pkg.description}</p>
                      )}
                      
                      <div className="package-details">
                        {pkg.level_names && (
                          <div className="package-detail-item">
                            <span className="detail-icon">🎓</span>
                            <span className="detail-text">{pkg.level_names}</span>
                          </div>
                        )}
                        
                        {pkg.class_names && (
                          <div className="package-detail-item">
                            <span className="detail-icon">📚</span>
                            <span className="detail-text">{pkg.class_names}</span>
                          </div>
                        )}
                        
                        {pkg.section_names && (
                          <div className="package-detail-item">
                            <span className="detail-icon">📖</span>
                            <span className="detail-text">{pkg.section_names}</span>
                          </div>
                        )}
                        
                        {pkg.subject_names && (
                          <div className="package-detail-item">
                            <span className="detail-icon">📝</span>
                            <span className="detail-text">{pkg.subject_names}</span>
                          </div>
                        )}
                        
                        {pkg.duration && (
                          <div className="package-detail-item">
                            <span className="detail-icon">⏱️</span>
                            <span className="detail-text">{pkg.duration} months access</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="package-footer">
                        <div className="package-price">
                          <span className="price-amount">{pkg.price}</span>
                          <span className="price-currency">TND</span>
                        </div>
                        <button 
                          className="package-btn"
                          onClick={() => {
                            setSelectedPackage(pkg);
                            setShowSubscribeModal(true);
                          }}
                        >
                          Subscribe
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Subscribe Modal */}
            {showSubscribeModal && (
              <div className="modal-overlay" onClick={() => setShowSubscribeModal(false)}>
                <div className="modal-content subscribe-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header subscribe-header">
                    <h2>Confirm Subscription</h2>
                    <button className="modal-close" onClick={() => setShowSubscribeModal(false)}>×</button>
                  </div>
                  
                  <div className="subscribe-modal-body">
                    {/* Package Info */}
                    <div className="subscription-package-info">
                      <h3>{selectedPackage?.name}</h3>
                      <div className="subscription-price">
                        <span className="price-value">{selectedPackage?.price}.00 DT</span>
                        <span className="price-period">/ year</span>
                      </div>
                    </div>

                    {/* Payment Information */}
                    <div className="payment-info-section">
                      <h3 className="payment-info-title">Les informations de paiement</h3>
                      
                      <div className="payment-method-box">
                        <img 
                          src="/image/logo_post.png" 
                          alt="La Poste Tunisienne" 
                          className="payment-logo"
                        />
                        <div className="payment-details-text">
                          <p className="payment-text-ar">للدفع عن طريق البريد ( البوسطة ) يرجى استعمال هذا <strong>RIB 53594017350753</strong>31</p>
                          <p className="payment-text-ar">للدفع عن طريق تطبيق <strong>D17</strong></p>
                          <p className="payment-text-ar">المبلغ المطلوب على الرقم التالي <strong>48221529</strong></p>
                        </div>
                      </div>
                    </div>

                    {subscribeMessage && (
                      <div className={`subscribe-message ${subscribeMessage.type}`}>
                        {subscribeMessage.text}
                      </div>
                    )}

                    {/* Upload Receipt */}
                    <div className="upload-receipt-section">
                      <h3 className="upload-title">Upload receipt</h3>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleReceiptChange}
                        className="file-input"
                        id="receipt-upload"
                      />
                      <label htmlFor="receipt-upload" className="file-upload-box">
                        {receiptFile ? (
                          <div className="file-selected">
                            <span className="file-icon-success">✓</span>
                            <span className="file-name-selected">{receiptFile.name}</span>
                          </div>
                        ) : (
                          <div className="file-upload-prompt">
                            <span className="upload-icon">📤</span>
                            <span className="no-file-text">No file chosen</span>
                          </div>
                        )}
                      </label>
                      <p className="file-formats-hint">Accepted formats: JPG, PNG</p>
                    </div>

                    {/* Promo Code Section */}
                    <div className="promo-code-section">
                      {!showPromoCodeInput ? (
                        <a 
                          href="#" 
                          className="promo-code-link"
                          onClick={(e) => {
                            e.preventDefault();
                            setShowPromoCodeInput(true);
                          }}
                        >
                          Do you have a promo code?
                        </a>
                      ) : (
                        <div className="promo-code-input-container">
                          <div className="promo-code-input-group">
                            <input
                              type="text"
                              value={promoCode}
                              onChange={(e) => {
                                setPromoCode(e.target.value.toUpperCase());
                                setPromoCodeMessage(null);
                                setPromoCodeValidated(false);
                              }}
                              placeholder="Enter promo code"
                              className="promo-code-input"
                              disabled={promoCodeValidated}
                            />
                            {!promoCodeValidated ? (
                              <>
                                <button 
                                  onClick={handlePromoCodeValidation}
                                  className="promo-code-validate-btn"
                                  disabled={!promoCode.trim()}
                                >
                                  Validate
                                </button>
                                <button 
                                  onClick={() => {
                                    setShowPromoCodeInput(false);
                                    setPromoCode('');
                                    setPromoCodeMessage(null);
                                    setPromoCodeValidated(false);
                                  }}
                                  className="promo-code-remove-btn"
                                  title="Remove promo code"
                                >
                                  ✕
                                </button>
                              </>
                            ) : (
                              <span className="promo-code-locked">
                                🔒 Locked
                              </span>
                            )}
                          </div>
                          {promoCodeMessage && (
                            <div className={`promo-code-message ${promoCodeMessage.type}`}>
                              {promoCodeMessage.text}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="modal-footer-actions">
                      <button
                        type="button"
                        className="btn-cancel-modal"
                        onClick={() => {
                          setShowSubscribeModal(false);
                          setReceiptFile(null);
                          setSubscribeMessage(null);
                        }}
                        disabled={subscribing}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn-submit-modal"
                        onClick={handleSubscribeSubmit}
                        disabled={subscribing || !receiptFile}
                      >
                        {subscribing ? 'Submitting...' : 'Submit'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      case 'contact':
        return <div className="page-content"><h2>Contact Us</h2><p>Get in touch with support...</p></div>;
      default:
        return (
          <div className="page-content">
            <h1>Dashboard Overview</h1>
            <p className="dashboard-subtitle">Track your learning progress and achievements</p>
          </div>
        );
    }
  };

  if (loading && activeSection === 'dashboard') {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="student-dashboard-layout">
      {/* Mobile Menu Toggle */}
      <button className="mobile-menu-toggle" onClick={toggleSidebar}>
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Notification Bell */}
      <div className="notification-bell-wrapper">
        <NotificationBell />
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}

      {/* Sidebar */}
      <aside className={`student-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <img src="/image/logo.png" alt="Tunisie Academy" className="sidebar-logo" />
        </div>
        
        <nav className="sidebar-nav">
        
          <button onClick={() => handleSectionChange('dashboard')} className={activeSection === 'dashboard' ? 'active' : ''}>
            <span className="nav-icon">📊</span> Dashboard
            {!dashboardStats?.subscription?.isActive && <span className="nav-lock-icon">🔒</span>}
          </button>
          <button onClick={() => handleSectionChange('profile')} className={activeSection === 'profile' ? 'active' : ''}>
            <span className="nav-icon">👤</span> Profile
          </button>
          <button onClick={() => handleSectionChange('exams')} className={activeSection === 'exams' ? 'active' : ''}>
            <span className="nav-icon">📝</span> Exams
            {!dashboardStats?.subscription?.isActive && <span className="nav-lock-icon">🔒</span>}
          </button>
          <button onClick={() => handleSectionChange('grades')} className={activeSection === 'grades' ? 'active' : ''}>
            <span className="nav-icon">📊</span> Grades
          </button>
          <button onClick={() => handleSectionChange('subjects')} className={(activeSection === 'videos' || activeSection === 'pdf' || subjectsOpen) ? 'active' : ''}>
            <span className="nav-icon">📚</span> Subjects
            {!dashboardStats?.subscription?.isActive && <span className="nav-lock-icon">🔒</span>}
            <span className={`dropdown-arrow ${subjectsOpen ? 'open' : ''}`}>▶</span>
          </button>
          <div className={`submenu ${subjectsOpen ? 'open' : ''}`}>
            <button onClick={() => handleSectionChange('videos')} className={activeSection === 'videos' ? 'active' : ''}>
              <span className="nav-icon">🎥</span> Videos
              {!dashboardStats?.subscription?.isActive && <span className="nav-lock-icon">🔒</span>}
            </button>
            <button onClick={() => handleSectionChange('pdf')} className={activeSection === 'pdf' ? 'active' : ''}>
              <span className="nav-icon">📄</span> PDF
              {!dashboardStats?.subscription?.isActive && <span className="nav-lock-icon">🔒</span>}
            </button>
          </div>
          <button onClick={() => handleSectionChange('books')} className={activeSection === 'books' ? 'active' : ''}>
            <span className="nav-icon">📖</span> Books
            {!dashboardStats?.subscription?.isActive && <span className="nav-lock-icon">🔒</span>}
          </button>
          
          {/* Only show Baccalaureate for 4eme lycee (bac) level */}
          {(dashboardStats?.profile?.level?.toLowerCase().includes('bac') || 
            dashboardStats?.profile?.level?.toLowerCase().includes('lycee') ||
            dashboardStats?.profile?.level?.toLowerCase().includes('4eme') ||
            dashboardStats?.profile?.level?.toLowerCase().includes('4ème')) && (
            <button onClick={() => handleSectionChange('baccalaureate')} className={activeSection === 'baccalaureate' ? 'active' : ''}>
              <span className="nav-icon">🎯</span> Baccalaureate
              {!dashboardStats?.subscription?.isActive && <span className="nav-lock-icon">🔒</span>}
            </button>
          )}
          
          <button onClick={() => handleSectionChange('telegram')} className={activeSection === 'telegram' ? 'active' : ''}>
            <span className="nav-icon">✈️</span> Telegram
            {!dashboardStats?.subscription?.isActive && <span className="nav-lock-icon">🔒</span>}
          </button>
          <button onClick={() => handleSectionChange('live-sessions')} className={activeSection === 'live-sessions' ? 'active' : ''}>
            <span className="nav-icon">🎥</span> Live Sessions
            {!dashboardStats?.subscription?.isActive && <span className="nav-lock-icon">🔒</span>}
          </button>
          <button onClick={() => handleSectionChange('calendar')} className={activeSection === 'calendar' ? 'active' : ''}>
            <span className="nav-icon">📅</span> Calendar
            {!dashboardStats?.subscription?.isActive && <span className="nav-lock-icon">🔒</span>}
          </button>
          <button onClick={() => handleSectionChange('offers')} className={activeSection === 'offers' ? 'active' : ''}>
            <span className="nav-icon">🎁</span> Offers
          </button>
        
          
          <button onClick={handleLogout} className="logout-btn">
            <span className="nav-icon">🚪</span> Logout
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="student-main">
        {renderContent()}
      </main>

      {/* FULLSCREEN EMPLOI MODAL - Rendered at root level */}
      {showEmploiFullscreen && dashboardStats?.emploiSchedule && (
        <div className="emploi-fullscreen-modal" onClick={() => setShowEmploiFullscreen(false)}>
          <button className="emploi-close-btn" onClick={() => setShowEmploiFullscreen(false)}>
            ✕
          </button>
          <img 
            src={dashboardStats.emploiSchedule.image_url} 
            alt="Class Schedule Fullscreen" 
            className="emploi-fullscreen-image"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* NOTIFICATION TOAST */}
      {notification && (
        <div className={`notification-toast ${notification.type}`}>
          <span className="notification-message">{notification.message}</span>
          <button className="notification-close" onClick={() => setNotification(null)}>✕</button>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
