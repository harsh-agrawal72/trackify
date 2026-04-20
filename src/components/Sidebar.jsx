import React, { memo } from 'react';
import { AlignLeft, Star, CheckSquare, Grid, Timer, Activity, Zap, Plus } from 'lucide-react';
import { useHabitData, useHabitActions } from '../context/HabitContext';

const Sidebar = memo(({ currentView, setCurrentView, openModal }) => {
  const { userStats } = useHabitData();

  const tabs = [
    { id: 'today', label: 'Today', icon: AlignLeft },
    { id: 'habits', label: 'Habits', icon: Star },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'categories', label: 'Categories', icon: Grid },
    { id: 'analytics', label: 'Analytics', icon: Activity },
    { id: 'timer', label: 'Timer', icon: Timer }
  ];

  return (
    <aside className="sidebar">
      
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '48px' }}>
        <div style={{ background: 'var(--accent-primary)', padding: '8px', borderRadius: '12px', boxShadow: '0 4px 12px var(--accent-primary-dim)' }}>
          <Zap size={24} color="#FFF" fill="#FFF" />
        </div>
        <h1 style={{ fontSize: '24px', margin: 0, fontWeight: 'bold' }}>habbitz</h1>
      </div>

      {/* New Activity Button */}
      <button className="btn btn-primary" onClick={openModal} style={{ width: '100%', marginBottom: '32px' }}>
        <Plus size={20} />
        New Activity
      </button>

      {/* Navigation */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', paddingLeft: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Menu</div>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = currentView === tab.id;
          return (
            <button 
              key={tab.id}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => setCurrentView(tab.id)}
            >
              <Icon size={20} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Bottom Settings Link */}
      <div style={{ marginTop: 'auto' }}>
        <div style={{ background: 'var(--bg-elevated)', borderRadius: '12px', padding: '16px', marginBottom: '16px', border: '1px solid var(--stroke-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Level</span>
            <span style={{ fontWeight: 'bold', color: 'var(--cat-yellow)' }}>Lv. {userStats.level}</span>
          </div>
          <div style={{ height: '6px', background: 'var(--bg-base)', borderRadius: '99px', overflow: 'hidden' }}>
            <div style={{ 
              height: '100%', 
              width: `${(userStats.xp % 1000) / 10}%`, 
              background: 'linear-gradient(90deg, var(--cat-yellow), var(--accent-primary))',
              borderRadius: '99px',
              transition: 'width 0.5s ease'
            }}></div>
          </div>
        </div>

        <button 
          className={`sidebar-link ${currentView === 'settings' ? 'active' : ''}`}
          onClick={() => setCurrentView('settings')}
        >
          <Activity size={20} />
          Settings
        </button>
      </div>

    </aside>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;

