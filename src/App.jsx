import React, { useState, useEffect, lazy, Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import Dashboard from './pages/Dashboard';
import HabitModal from './components/HabitModal';
import XPToastContainer from './components/XPToast';

// Lazy load non-essential pages for better initial performance
const Habits = lazy(() => import('./pages/Habits'));
const Tasks = lazy(() => import('./pages/Tasks'));
const Categories = lazy(() => import('./pages/Categories'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Settings = lazy(() => import('./pages/Settings'));
const FocusMode = lazy(() => import('./pages/FocusMode'));

function App() {
  const [currentView, setCurrentView] = useState('today');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 1. Initial State Sync
  useEffect(() => {
    window.history.replaceState({ view: 'today' }, '');
  }, []);

  // 2. Popstate Listener (The "Back" button driver)
  useEffect(() => {
    const handlePopState = (e) => {
      if (e.state?.view && e.state.view !== currentView) {
        setCurrentView(e.state.view);
      }
      if (isModalOpen) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentView, isModalOpen]);

  // 3. Navigation Wrappers
  const navigateTo = (view) => {
    if (view !== currentView) {
      setCurrentView(view);
      setIsModalOpen(false);
      window.history.pushState({ view }, '');
    }
  };

  const openGlobalModal = () => {
    setIsModalOpen(true);
    window.history.pushState({ view: currentView, modal: true }, '');
  };

  const closeGlobalModal = () => {
    setIsModalOpen(false);
    if (window.history.state?.modal) {
      window.history.back();
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'today': return <Dashboard />;
      case 'habits': return <Habits />;
      case 'tasks': return <Tasks />;
      case 'categories': return <Categories />;
      case 'analytics': return <Analytics />;
      case 'settings': return <Settings />;
      case 'timer': return <FocusMode />;
      default: return <Dashboard />;
    }
  };

  const LoadingFallback = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
      <div className="shimmer" style={{ width: '100px', height: '20px', borderRadius: '10px' }} />
    </div>
  );

  return (
    <div className="app-container">
      <Sidebar currentView={currentView} setCurrentView={navigateTo} openModal={openGlobalModal} />
      
      <div className="main-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            style={{ height: '100%' }}
          >
            <Suspense fallback={<LoadingFallback />}>
              {renderView()}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </div>

      <BottomNav 
        activeTab={currentView} 
        setActiveTab={navigateTo} 
        onPlusClick={openGlobalModal} 
        isModalOpen={isModalOpen}
      />

      <AnimatePresence>
        {isModalOpen && <HabitModal onClose={closeGlobalModal} />}
      </AnimatePresence>

      <XPToastContainer />
    </div>
  );
}

export default App;
