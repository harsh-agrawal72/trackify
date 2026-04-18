import React, { useState } from 'react';
import { useHabits } from '../context/HabitContext';
import { ChevronLeft, Info, Settings, Clock, Activity, Briefcase, User, Book, Edit2, Trash2, Plus } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import CategoryModal from '../components/CategoryModal';

const getIcon = (name) => {
  switch (name) {
    case 'Activity': return <Activity size={32} color="#000" />;
    case 'Briefcase': return <Briefcase size={32} color="#000" />;
    case 'User': return <User size={32} color="#000" />;
    case 'Book': return <Book size={32} color="#000" />;
    default: return <Clock size={32} color="#000" />;
  }
};

const Categories = () => {
  const { categories, habits, tasks, logs, deleteCategory } = useHabits();
  const [showInfo, setShowInfo] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [sortBy, setSortBy] = useState('name'); 

  const handleEdit = (cat) => {
    setEditingCategory(cat);
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingCategory(null);
    setShowModal(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ChevronLeft size={24} color="var(--accent-primary)" />
          <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>Categories</h1>
        </div>
        <div style={{ display: 'flex', gap: '16px', color: 'var(--text-secondary)', position: 'relative' }}>
          <button onClick={() => setShowSettings(!showSettings)} className="btn-icon" title="Category Settings">
            <Settings size={24} />
          </button>
          <button onClick={() => setShowInfo(!showInfo)} className="btn-icon" title="Category Information">
            <Info size={24} />
          </button>

          {/* Settings Dropdown */}
          <AnimatePresence>
            {showSettings && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="glass-panel"
                style={{ position: 'absolute', top: '40px', right: '40px', zIndex: 100, width: '200px', padding: '12px' }}
              >
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', padding: '0 8px' }}>Sort Categories By</div>
                <button 
                  onClick={() => { setSortBy('name'); setShowSettings(false); }}
                  style={{ width: '100%', textAlign: 'left', padding: '8px', background: sortBy === 'name' ? 'var(--bg-elevated)' : 'transparent', border: 'none', borderRadius: '4px', color: 'var(--text-primary)', cursor: 'pointer' }}
                >
                   Alphabetical
                </button>
                <button 
                  onClick={() => { setSortBy('performance'); setShowSettings(false); }}
                  style={{ width: '100%', textAlign: 'left', padding: '8px', background: sortBy === 'performance' ? 'var(--bg-elevated)' : 'transparent', border: 'none', borderRadius: '4px', color: 'var(--text-primary)', cursor: 'pointer' }}
                >
                   Productivity Rate
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Info Modal */}
          <AnimatePresence>
            {showInfo && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}
                onClick={() => setShowInfo(false)}
              >
                <div 
                  className="glass-panel" 
                  style={{ width: '90%', maxWidth: '400px', padding: '32px', textAlign: 'center' }}
                  onClick={e => e.stopPropagation()}
                >
                  <Info size={48} color="var(--accent-primary)" style={{ marginBottom: '16px' }} />
                  <h2 style={{ marginBottom: '16px' }}>Category Wisdom</h2>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '15px' }}>
                    Categories help you visualize where your time goes. The <strong>Productivity Rate</strong> is calculated based on habit completions over the last 30 days.
                    Focus on categories with lower rates to maintain a balanced life!
                  </p>
                  <button className="btn btn-primary" style={{ marginTop: '24px', width: '100%' }} onClick={() => setShowInfo(false)}>Got it!</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
          <div>
            <div style={{ fontSize: '22px', fontWeight: '800', marginBottom: '10px', color: 'var(--text-primary)' }}>Category Productivity</div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>Track your focus distribution and success rates</div>
          </div>
          <button 
            className="btn btn-primary" 
            onClick={handleCreate}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={18} /> New Category
          </button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {categories
            .map(cat => {
              const catHabits = habits.filter(h => h.categoryId === cat.id);
              const catTasks = tasks.filter(t => t.categoryId === cat.id);
              
              let totalLogs = 0;
              let completedLogs = 0;
              
              catHabits.forEach(habit => {
                for (let i = 0; i < 30; i++) {
                  const d = subDays(new Date(), i);
                  if (!(habit.frequencyDays || [0,1,2,3,4,5,6]).includes(d.getDay())) continue;
                  const start = new Date(habit.startDate || '2000-01-01');
                  start.setHours(0,0,0,0);
                  if (d < start) break;
                  totalLogs++;
                  const log = logs.find(l => l.habitId === habit.id && l.date === format(d, 'yyyy-MM-dd'));
                  if (log && log.progress >= habit.target) completedLogs++;
                }
              });
              const rate = totalLogs > 0 ? Math.round((completedLogs / totalLogs) * 100) : 0;
              return { ...cat, rate, habitsCount: catHabits.length, tasksCount: catTasks.length };
            })
            .sort((a, b) => sortBy === 'name' ? a.name.localeCompare(b.name) : b.rate - a.rate)
            .map(cat => {
              const rate = cat.rate;
              return (
                <div key={cat.id} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ 
                      width: '48px', height: '48px', borderRadius: '14px', 
                      background: cat.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {getIcon(cat.icon)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '6px' }}>{cat.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <span>{cat.habitsCount} Habits</span>
                        <span>•</span>
                        <span>{cat.tasksCount} Tasks</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                      <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{rate}%</div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                         <button onClick={() => handleEdit(cat)} className="btn-icon" style={{ width: '32px', height: '32px', background: 'var(--bg-elevated)' }} title="Edit"><Edit2 size={16} /></button>
                         <button onClick={() => { if(window.confirm('Delete?')) deleteCategory(cat.id); }} className="btn-icon" style={{ width: '32px', height: '32px', color: 'var(--accent-danger)', background: 'var(--bg-elevated)' }} title="Delete"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      <span>Category Health</span>
                      <span>Last 30 Days</span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--bg-elevated)', borderRadius: '99px', overflow: 'hidden' }}>
                      <div style={{ 
                        height: '100%', width: `${rate}%`, 
                        background: cat.color || 'var(--accent-primary)', borderRadius: '99px',
                        transition: 'width 1s ease-in-out'
                      }} />
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {showModal && (
        <CategoryModal 
          onClose={() => setShowModal(false)} 
          editData={editingCategory} 
        />
      )}

    </div>
  );
};

// Simple stub for Grid icon since we used it. 
const Grid = ({size}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
);

export default Categories;
