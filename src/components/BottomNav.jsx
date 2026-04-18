import React from 'react';
import { LayoutDashboard, Star, CheckSquare, BarChart3, Timer, Settings, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

const BottomNav = ({ activeTab, setActiveTab, onPlusClick, isModalOpen }) => {
  const tabs = [
    { id: 'today', label: 'Today', icon: LayoutDashboard },
    { id: 'habits', label: 'Habits', icon: Star },
    { id: 'analytics', label: 'Stats', icon: BarChart3 },
    { id: 'timer', label: 'Timer', icon: Timer },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <>
      {!isModalOpen && (
        <button className="mobile-fab" onClick={onPlusClick}>
          <Plus size={28} />
        </button>
      )}
      
      <nav className="bottom-nav">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button 
              key={tab.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <motion.div
                animate={isActive ? { scale: 1.2 } : { scale: 1 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              </motion.div>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};

export default BottomNav;
