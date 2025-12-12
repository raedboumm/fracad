import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { dashboardAPI } from '../services/api';
import LevelsManagement from '../components/LevelsManagement';
import ClassesManagement from '../components/ClassesManagement';
import SectionsManagement from '../components/SectionsManagement';
import UsersManagement from '../components/UsersManagement';
import RecentUsersManagement from '../components/RecentUsersManagement';
import AnonymousLeadsManagement from '../components/AnonymousLeadsManagement';
import SubjectsManagement from '../components/SubjectsManagement';
import ChaptersManagement from '../components/ChaptersManagement';
import ExamsManagement from '../components/ExamsManagement';
import PackagesManagement from '../components/PackagesManagement';
import BooksManagement from '../components/BooksManagement';
import TelegramManagement from '../components/TelegramManagement';
import MessengerManagement from '../components/MessengerManagement';
import EmploiManagement from '../components/EmploiManagement';
import CalendarManagement from '../components/CalendarManagement';
import HighlightsManagement from '../components/HighlightsManagement';
import TestimonialsManagement from '../components/TestimonialsManagement';
import BacManagement from '../components/BacManagement';
import SubscriptionsManagement from '../components/SubscriptionsManagement';
import SheetManagement from '../components/SheetManagement';
import ProductsManagement from '../components/ProductsManagement';
import OrdersManagement from '../components/OrdersManagement';
import PromoCodesManagement from '../components/PromoCodesManagement';
import NotificationsManagement from '../components/NotificationsManagement';
import ResourcesManagement from '../components/ResourcesManagement';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState(searchParams.get('section') || 'dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminStats, setAdminStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    const section = searchParams.get('section');
    if (section) {
      setActiveSection(section);
    }
  }, [searchParams]);

  useEffect(() => {
    if (activeSection === 'dashboard') {
      fetchAdminStats();
    }
  }, [activeSection]);

  const fetchAdminStats = async () => {
    try {
      setLoadingStats(true);
      const response = await dashboardAPI.getAdminStats();
      setAdminStats(response.data);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSectionChange = (section) => {
    setActiveSection(section);
    setSearchParams({ section });
    setSidebarOpen(false); // Close sidebar on mobile after selection
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderContent = () => {
    switch(activeSection) {
      case 'home':
        return <div className="page-content"><h2>Home</h2><p>Home page content coming soon...</p></div>;
      case 'dashboard':
        return (
          <div className="page-content">
            <h1>Dashboard Overview</h1>
            <p className="dashboard-subtitle">Monitor your platform's key metrics and performance</p>
            {loadingStats ? (
              <div className="loading-state">Loading dashboard statistics...</div>
            ) : adminStats ? (
              <>
                {/* DYNAMIC OVERVIEW STATS */}
                <div className="stats-grid">
                  <div className="stat-card blue">
                    <div className="stat-icon">👥</div>
                    <h3>{adminStats.overview?.total_students || 0}</h3>
                    <p>Total Students</p>
                    <span className="stat-detail">{adminStats.overview?.active_students || 0} active</span>
                  </div>
                  <div className="stat-card green">
                    <div className="stat-icon">🎬</div>
                    <h3>{adminStats.overview?.total_videos || 0}</h3>
                    <p>Video Resources</p>
                    <span className="stat-detail">Educational content</span>
                  </div>
                  <div className="stat-card orange">
                    <div className="stat-icon">📄</div>
                    <h3>{adminStats.overview?.total_pdfs || 0}</h3>
                    <p>PDF Resources</p>
                    <span className="stat-detail">Study materials</span>
                  </div>
                  <div className="stat-card red">
                    <div className="stat-icon">📚</div>
                    <h3>{adminStats.overview?.total_resources || 0}</h3>
                    <p>Total Resources</p>
                    <span className="stat-detail">All types</span>
                  </div>
                  <div className="stat-card purple">
                    <div className="stat-icon">�</div>
                    <h3>{adminStats.revenue?.total_revenue ? adminStats.revenue.total_revenue.toFixed(2) : '0'} TND</h3>
                    <p>Total Revenue</p>
                    <span className="stat-detail">All time earnings</span>
                  </div>
                  <div className="stat-card yellow">
                    <div className="stat-icon">📅</div>
                    <h3>{adminStats.revenue?.monthly_revenue ? adminStats.revenue.monthly_revenue.toFixed(2) : '0'} TND</h3>
                    <p>Monthly Revenue</p>
                    <span className="stat-detail">This month</span>
                  </div>
                </div>

                {/* RESOURCES BY SUBJECT */}
                {adminStats.resourcesBySubject && adminStats.resourcesBySubject.length > 0 && (
                  <div className="admin-section">
                    <h2>📊 Resources Distribution by Subject</h2>
                    <div className="resources-subject-grid">
                      {adminStats.resourcesBySubject.map(subject => (
                        <div key={subject.subject_id} className="resource-subject-card">
                          <div className="subject-header-admin">
                            {subject.subject_image_url && (
                              <img src={subject.subject_image_url} alt={subject.subject_name} className="subject-thumbnail" />
                            )}
                            <h3>{subject.subject_name}</h3>
                          </div>
                          <div className="subject-metrics">
                            <div className="metric-row">
                              <span className="metric-label">Videos:</span>
                              <span className="metric-value">{subject.video_count || 0}</span>
                            </div>
                            <div className="metric-row">
                              <span className="metric-label">PDFs:</span>
                              <span className="metric-value">{subject.pdf_count || 0}</span>
                            </div>
                            <div className="metric-row">
                              <span className="metric-label">Total:</span>
                              <span className="metric-value highlight">{(parseInt(subject.video_count) || 0) + (parseInt(subject.pdf_count) || 0)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* RECENT UPLOADS */}
                {adminStats.recentUploads && adminStats.recentUploads.length > 0 && (
                  <div className="admin-section">
                    <h2>📁 Recent Uploads</h2>
                    <div className="recent-uploads-table">
                      <table>
                        <thead>
                          <tr>
                            <th>Title</th>
                            <th>Type</th>
                            <th>Subject</th>
                            <th>Size</th>
                            <th>Uploaded</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminStats.recentUploads.slice(0, 10).map(upload => (
                            <tr key={upload.id}>
                              <td>
                                <div className="resource-title-cell">
                                  <span className="resource-icon">{upload.resource_type === 'video' ? '🎬' : '📄'}</span>
                                  <span>{upload.title}</span>
                                </div>
                              </td>
                              <td><span className={`type-badge ${upload.resource_type}`}>{upload.resource_type.toUpperCase()}</span></td>
                              <td>{upload.subject_name || 'N/A'}</td>
                              <td>{upload.file_size ? `${(upload.file_size / (1024 * 1024)).toFixed(2)} MB` : 'N/A'}</td>
                              <td>{new Date(upload.created_at).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* REVENUE BREAKDOWN */}
                {adminStats.revenue && (
                  <div className="admin-section">
                    <h2>💰 Revenue Analysis</h2>
                    <div className="storage-cards-grid">
                      <div className="storage-card">
                        <h4>Total Revenue</h4>
                        <div className="storage-value">{adminStats.revenue.total_revenue.toFixed(2)} TND</div>
                        <p className="storage-description">All time earnings</p>
                      </div>
                      <div className="storage-card video">
                        <h4>This Month</h4>
                        <div className="storage-value">{adminStats.revenue.monthly_revenue.toFixed(2)} TND</div>
                        <p className="storage-description">Current month revenue</p>
                      </div>
                      <div className="storage-card pdf">
                        <h4>Subscriptions</h4>
                        <div className="storage-value">{adminStats.revenue.subscriptions_revenue.toFixed(2)} TND</div>
                        <p className="storage-description">{adminStats.revenue.approved_subscriptions || 0} approved</p>
                      </div>
                      <div className="storage-card avg">
                        <h4>Orders</h4>
                        <div className="storage-value">{adminStats.revenue.orders_revenue.toFixed(2)} TND</div>
                        <p className="storage-description">From product orders</p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="error-state">Failed to load dashboard statistics</div>
            )}
          </div>
        );
      case 'subscriptions':
        return <SubscriptionsManagement />;
      case 'sheet':
        return <SheetManagement />;
      case 'new-users':
        return <RecentUsersManagement />;
      case 'anonymous':
        return <AnonymousLeadsManagement />;
      case 'users':
        return <UsersManagement />;
      case 'devices':
        return <div className="page-content"><h2>Devices</h2><p>Device management...</p></div>;
      case 'sections':
        return <SectionsManagement />;
      case 'levels':
        return <LevelsManagement />;
      case 'classes':
        return <ClassesManagement />;
      case 'subjects':
        return <SubjectsManagement />;
      case 'chapters':
        return <ChaptersManagement />;
      case 'exams':
        return <ExamsManagement />;
      case 'packages':
        return <PackagesManagement />;
      case 'products':
        return <ProductsManagement />;
      case 'orders':
        return <OrdersManagement />;
      case 'promo-codes':
        return <PromoCodesManagement />;
      case 'resources':
        return <ResourcesManagement />;
      case 'livres':
        return <BooksManagement />;
      case 'telegram':
        return <TelegramManagement />;
      case 'messenger':
        return <MessengerManagement />;
      case 'emploi':
        return <EmploiManagement />;
      case 'calendar':
        return <CalendarManagement />;
      case 'highlights':
        return <HighlightsManagement />;
      case 'testimonials':
        return <TestimonialsManagement />;
      case 'baccalaureat':
        return <BacManagement />;
      case 'promo-codes':
        return <PromoCodesManagement />;
      case 'messages':
        return <NotificationsManagement />;
      default:
        return <div className="page-content"><h2>Dashboard</h2></div>;
    }
  };

  return (
    <div className="admin-dashboard-layout">
      {/* Mobile Menu Toggle */}
      <button className="mobile-menu-toggle" onClick={toggleSidebar}>
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Overlay for mobile */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <img src="/image/logo.png" alt="Tunisie Academy" className="sidebar-logo" />
        </div>
        
        <nav className="sidebar-nav">
          <button onClick={() => handleSectionChange('dashboard')} className={activeSection === 'dashboard' ? 'active' : ''}>
            <span className="nav-icon">📊</span> Dashboard
          </button>
          <button onClick={() => handleSectionChange('subscriptions')} className={activeSection === 'subscriptions' ? 'active' : ''}>
            <span className="nav-icon">💳</span> Subscriptions
          </button>
          <button onClick={() => handleSectionChange('sheet')} className={activeSection === 'sheet' ? 'active' : ''}>
            <span className="nav-icon">📋</span> Sheet
          </button>
          <button onClick={() => handleSectionChange('new-users')} className={activeSection === 'new-users' ? 'active' : ''}>
            <span className="nav-icon">👤</span> New Users
          </button>
          <button onClick={() => handleSectionChange('anonymous')} className={activeSection === 'anonymous' ? 'active' : ''}>
            <span className="nav-icon">👥</span> Anonymous
          </button>
          <button onClick={() => handleSectionChange('users')} className={activeSection === 'users' ? 'active' : ''}>
            <span className="nav-icon">👨‍👩‍👧‍👦</span> Users
          </button>
          <button onClick={() => handleSectionChange('sections')} className={activeSection === 'sections' ? 'active' : ''}>
            <span className="nav-icon">📚</span> Sections
          </button>
          <button onClick={() => handleSectionChange('levels')} className={activeSection === 'levels' ? 'active' : ''}>
            <span className="nav-icon">🎚️</span> Levels
          </button>
          <button onClick={() => handleSectionChange('classes')} className={activeSection === 'classes' ? 'active' : ''}>
            <span className="nav-icon">🎓</span> Classes
          </button>
          <button onClick={() => handleSectionChange('subjects')} className={activeSection === 'subjects' ? 'active' : ''}>
            <span className="nav-icon">📖</span> Subjects
          </button>
          <button onClick={() => handleSectionChange('chapters')} className={activeSection === 'chapters' ? 'active' : ''}>
            <span className="nav-icon">📑</span> Chapters
          </button>
          <button onClick={() => handleSectionChange('exams')} className={activeSection === 'exams' ? 'active' : ''}>
            <span className="nav-icon">📝</span> Exams
          </button>
          <button onClick={() => handleSectionChange('packages')} className={activeSection === 'packages' ? 'active' : ''}>
            <span className="nav-icon">📦</span> Packages
          </button>
          <button onClick={() => handleSectionChange('products')} className={activeSection === 'products' ? 'active' : ''}>
            <span className="nav-icon">🛍️</span> Products
          </button>
          <button onClick={() => handleSectionChange('orders')} className={activeSection === 'orders' ? 'active' : ''}>
            <span className="nav-icon">📋</span> Orders
          </button>
          <button onClick={() => handleSectionChange('resources')} className={activeSection === 'resources' ? 'active' : ''}>
            <span className="nav-icon">📄</span> Resources
          </button>
          <button onClick={() => handleSectionChange('livres')} className={activeSection === 'livres' ? 'active' : ''}>
            <span className="nav-icon">📚</span> Books
          </button>
          <button onClick={() => handleSectionChange('telegram')} className={activeSection === 'telegram' ? 'active' : ''}>
            <span className="nav-icon">✈️</span> Telegram
          </button>
          <button onClick={() => handleSectionChange('messenger')} className={activeSection === 'messenger' ? 'active' : ''}>
            <span className="nav-icon">💬</span> Messenger Groups
          </button>
          <button onClick={() => handleSectionChange('emploi')} className={activeSection === 'emploi' ? 'active' : ''}>
            <span className="nav-icon">🗓️</span> Schedule
          </button>
          <button onClick={() => handleSectionChange('calendar')} className={activeSection === 'calendar' ? 'active' : ''}>
            <span className="nav-icon">📅</span> Calendar
          </button>
          <button onClick={() => handleSectionChange('highlights')} className={activeSection === 'highlights' ? 'active' : ''}>
            <span className="nav-icon">⭐</span> Highlights
          </button>
          <button onClick={() => handleSectionChange('testimonials')} className={activeSection === 'testimonials' ? 'active' : ''}>
            <span className="nav-icon">💬</span> Testimonials
          </button>
          <button onClick={() => handleSectionChange('baccalaureat')} className={activeSection === 'baccalaureat' ? 'active' : ''}>
            <span className="nav-icon">🎯</span> Baccalaureate
          </button>
          <button onClick={() => handleSectionChange('promo-codes')} className={activeSection === 'promo-codes' ? 'active' : ''}>
            <span className="nav-icon">🎟️</span> Promo Codes
          </button>
          <button onClick={() => handleSectionChange('messages')} className={activeSection === 'messages' ? 'active' : ''}>
            <span className="nav-icon">✉️</span> Messages
          </button>
          
          <button onClick={handleLogout} className="logout-btn">
            <span className="nav-icon">🚪</span> Logout
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        {renderContent()}
      </main>
    </div>
  );
};

export default AdminDashboard;
