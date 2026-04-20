// Optimized App Component
import React, { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import HabitModal from './components/HabitModal';
import XPToastContainer from './components/XPToast';

// Helper to handle ChunkLoadError (caused by new deployments and stale clients)
const lazyWithRetry = (componentImport) =>
  lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      console.error("Chunk load failed, reloading...", error);
      window.location.reload();
      return { default: () => null };
    }
  });

// Lazy load all pages for better initial performance
const Dashboard = lazyWithRetry(() => import('./pages/Dashboard'));
const Habits = lazyWithRetry(() => import('./pages/Habits'));
const Tasks = lazyWithRetry(() => import('./pages/Tasks'));
const Categories = lazyWithRetry(() => import('./pages/Categories'));
const Analytics = lazyWithRetry(() => import('./pages/Analytics'));
const Settings = lazyWithRetry(() => import('./pages/Settings'));
const FocusMode = lazyWithRetry(() => import('./pages/FocusMode'));

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
  const navigateTo = useCallback((view) => {
    if (view !== currentView) {
      setCurrentView(view);
      setIsModalOpen(false);
      window.history.pushState({ view }, '');
    }
  }, [currentView]);

  const openGlobalModal = useCallback(() => {
    setIsModalOpen(true);
    window.history.pushState({ view: currentView, modal: true }, '');
  }, [currentView]);

  const closeGlobalModal = useCallback(() => {
    setIsModalOpen(false);
    if (window.history.state?.modal) {
      window.history.back();
    }
  }, []);

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
            transition={{ duration: 0.15 }}
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
