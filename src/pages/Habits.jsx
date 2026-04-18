import React, { useState } from 'react';
import { useHabits } from '../context/HabitContext';
import { format, subDays, eachDayOfInterval, isSameDay } from 'date-fns';
import { Search, Filter, CalendarDays, MoreVertical, Link2, CheckCircle2, Utensils, Clock, GraduationCap, XCircle, Trash2, Grid, Edit2, Flame, TrendingUp, Sparkles, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import HabitModal from '../components/HabitModal';

const getIcon = (name) => {
  switch (name) {
    case 'Utensils': return <Utensils size={20} color="#000" />;
    case 'Clock': return <Clock size={20} color="#000" />;
    case 'GraduationCap': return <GraduationCap size={20} color="#000" />;
    case 'XCircle': return <XCircle size={20} color="#000" />;
    default: return <Clock size={20} color="#000" />;
  }
};

const Habits = () => {
  const { habits, logs, categories, deleteHabit, logHabitProgress, setSelectedDate } = useHabits();
  
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [showSearch, setShowSearch] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [groupByCat, setGroupByCat] = useState(false);
  const [selectedHabitHistory, setSelectedHabitHistory] = useState(null);
  const [selectedHabitVelocity, setSelectedHabitVelocity] = useState(null);
  const [editingHabit, setEditingHabit] = useState(null);

  // Sync state with browser history for back-button support
  React.useEffect(() => {
    const isAnyModalOpen = !!(editingHabit || selectedHabitHistory || selectedHabitVelocity);
    
    if (isAnyModalOpen) {
      // Push a dummy state so 'back' has something to pop
      window.history.pushState({ modal: true }, '');
    }

    const handlePopState = () => {
      setEditingHabit(null);
      setSelectedHabitHistory(null);
      setSelectedHabitVelocity(null);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [editingHabit, selectedHabitHistory, selectedHabitVelocity]);
  
  const handleHistoricalToggle = (habit, date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const log = logs.find(l => l.habitId === habit.id && l.date === dateStr);
    const isCompleted = log && log.progress >= habit.target;
    
    // Toggle completion: if complete -> 0, if incomplete -> target
    const amount = isCompleted ? -log.progress : (habit.target - (log?.progress || 0));
    logHabitProgress(habit.id, amount, date);
  };

  const getHabitStats = (habitId) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return { rate: 0, consistency: 'N/A' };
    
    const last30 = Array.from({ length: 30 }).map((_, i) => subDays(new Date(), i));
    let completedCount = 0;
    let scheduledCount = 0;
    
    last30.forEach(d => {
      const startD = new Date(habit.startDate || '2000-01-01');
      startD.setHours(0,0,0,0);
      if (d < startD) return;

      const isScheduled = (habit.frequencyDays || [0,1,2,3,4,5,6]).includes(d.getDay());
      if (isScheduled) {
        scheduledCount++;
        const dateStr = format(d, 'yyyy-MM-dd');
        const log = logs.find(l => l.habitId === habitId && l.date === dateStr);
        if (log && log.progress >= habit.target) completedCount++;
      }
    });
    
    const rate = scheduledCount === 0 ? 0 : Math.round((completedCount / scheduledCount) * 100);
    let consistency = 'Starting';
    if (rate > 90) consistency = 'Elite';
    else if (rate > 70) consistency = 'Pulse';
    else if (rate > 45) consistency = 'Steady';
    
    return { rate, consistency, completedCount, scheduledCount };
  };

  const last7Days = Array.from({ length: 7 }).map((_, idx) => subDays(new Date(), 6 - idx));

  let filteredHabits = [...habits];
  if (search.trim()) {
    filteredHabits = filteredHabits.filter(h => (h.name || '').toLowerCase().includes(search.toLowerCase()));
  }
  if (filterCat !== 'all') {
    filteredHabits = filteredHabits.filter(h => h.categoryId === filterCat);
  }

  const renderHabitCard = (habit, cat) => {
    let currentStreak = 0;
    for (let i = 0; i < 365; i++) {
      const d = subDays(new Date(), i);
      if (!(habit.frequencyDays || [0,1,2,3,4,5,6]).includes(d.getDay())) continue;
      const dateStr = format(d, 'yyyy-MM-dd');
      const log = logs.find(l => l.habitId === habit.id && l.date === dateStr);
      if (log && log.progress >= habit.target) {
        currentStreak++;
      } else if (i !== 0) {
        break;
      }
    }

    let totalScheduled = 0;
    let totalCompleted = 0;
    for (let i = 0; i < 30; i++) {
      const d = subDays(new Date(), i);
      if (!(habit.frequencyDays || [0,1,2,3,4,5,6]).includes(d.getDay())) continue;
      const start = new Date(habit.startDate || '2000-01-01');
      start.setHours(0,0,0,0);
      if (d < start) break;
      
      totalScheduled++;
      const dateStr = format(d, 'yyyy-MM-dd');
      const log = logs.find(l => l.habitId === habit.id && l.date === dateStr);
      if (log && log.progress >= habit.target) totalCompleted++;
    }
    const completionRate = totalScheduled === 0 ? 0 : Math.round((totalCompleted / totalScheduled) * 100);

    return (
      <div key={habit.id} className="glass-panel" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
        {/* Category Accent Stripe */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: cat.color || 'var(--accent-primary)' }} />
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '6px', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>{habit.name}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', padding: '2px 10px', borderRadius: '99px', background: `${cat.color || 'var(--accent-primary)'}22`, color: cat.color || 'var(--accent-primary)', fontWeight: '700', textTransform: 'uppercase' }}>
                {cat.name || 'General'}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>Daily Goal: {habit.target} {habit.targetUnit}</span>
            </div>
          </div>
          <div style={{ 
            width: '44px', height: '44px', borderRadius: '14px', 
            background: `linear-gradient(135deg, ${cat.color || 'var(--accent-primary)'}, ${cat.color}dd)`, 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 8px 16px ${cat.color}44`, flexShrink: 0
          }}>
            {getIcon(cat.icon)}
          </div>
        </div>

        {/* 7-Day Visualizer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '16px', marginBottom: '24px', overflowX: 'auto', gap: '10px' }}>
          {last7Days.map((date, i) => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const log = logs.find(l => l.habitId === habit.id && l.date === dateStr);
            const isCompleted = log && log.progress >= habit.target;
            const isToday = isSameDay(date, new Date());
            
            const startD = new Date(habit.startDate || '2000-01-01');
            startD.setHours(0,0,0,0);
            const isBeforeStart = date < startD;
            const isScheduled = (habit.frequencyDays || [0,1,2,3,4,5,6]).includes(date.getDay()) && !isBeforeStart;

            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', minWidth: '42px' }}>
                <span style={{ fontSize: '10px', color: isToday ? 'var(--accent-primary)' : 'var(--text-muted)', fontWeight: '800' }}>
                  {format(date, 'EEE')}
                </span>
                <button
                  onClick={() => isScheduled && handleHistoricalToggle(habit, date)}
                  style={{
                    width: '38px', height: '38px', borderRadius: '12px',
                    border: 'none',
                    background: isCompleted ? (cat.color || 'var(--accent-primary)') : isToday ? 'rgba(255,255,255,0.08)' : 'transparent',
                    color: isCompleted ? '#fff' : isToday ? 'var(--text-primary)' : 'var(--text-secondary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '14px', fontWeight: '800', cursor: isScheduled ? 'pointer' : 'default',
                    opacity: isBeforeStart ? 0.2 : isScheduled ? 1 : 0.3,
                    boxShadow: isCompleted ? `0 4px 12px ${cat.color}66` : 'none',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}>
                  {format(date, 'd')}
                </button>
              </div>
            );
          })}
        </div>

        {/* Bottom Actions & Stats */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', background: 'rgba(255,140,66,0.1)', color: '#FF8C42', fontSize: '13px', fontWeight: '700' }}>
              <Flame size={14} /> {currentStreak}d
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', background: 'rgba(46,204,113,0.1)', color: '#2ecc71', fontSize: '13px', fontWeight: '700' }}>
              <TrendingUp size={14} /> {completionRate}%
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setSelectedHabitHistory(habit)} className="btn-icon" title="History"><CalendarDays size={18} /></button>
            <button onClick={() => setSelectedHabitVelocity(habit)} className="btn-icon" title="Trends"><TrendingUp size={18} /></button>
            <button onClick={() => setEditingHabit(habit)} className="btn-icon" title="Edit"><Edit2 size={18} /></button>
            <button onClick={() => window.confirm('Delete?') && deleteHabit(habit.id)} className="btn-icon" style={{ color: 'rgba(231,76,60,0.6)' }}><Trash2 size={18} /></button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
             <div style={{ width: '20px', height: '3px', background: 'var(--accent-primary)', borderRadius: '2px' }} />
             <div style={{ width: '12px', height: '3px', background: 'var(--accent-primary)', borderRadius: '2px' }} />
             <div style={{ width: '20px', height: '3px', background: 'var(--accent-primary)', borderRadius: '2px' }} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Habits</h1>
        </div>
        <div style={{ display: 'flex', gap: '16px', color: 'var(--text-secondary)' }}>
          <button onClick={() => setGroupByCat(!groupByCat)} className="btn-icon" style={{ color: groupByCat ? 'var(--accent-primary)' : 'var(--text-secondary)' }} title="Group by Category">
             <Grid size={24} />
          </button>
          <button onClick={() => setShowSearch(!showSearch)} className="btn-icon"><Search size={24} /></button>
          <button onClick={() => setShowFilter(!showFilter)} className="btn-icon"><Filter size={24} /></button>
          <button onClick={() => { setSelectedDate(new Date().toISOString()); alert('View reset to today!'); }} className="btn-icon" title="Reset to today">
            <CalendarDays size={24} />
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      {(showSearch || showFilter) && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
          {showSearch && (
            <input 
              autoFocus
              type="text" 
              placeholder="Search habits..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1 }}
            />
          )}
          {showFilter && (
            <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} style={{ width: '200px' }}>
              <option value="all">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
        </div>
      )}

      {/* Empty State / Habit Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
        {habits.length === 0 ? (
          <div style={{ 
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
            minHeight: '400px', textAlign: 'center', gap: '20px', padding: '40px'
          }}>
            <div style={{ 
              width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), #8e44ad)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 40px rgba(216,75,107,0.3)'
            }}>
              <Sparkles size={40} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>Your journey starts here</h2>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '320px', lineHeight: 1.6 }}>
                  You haven't created any habits yet. Success is built by showing up every day.
                </p>
            </div>
            <button className="btn btn-primary" onClick={() => setEditingHabit({ type: 'habit' })} style={{ padding: '12px 24px' }}>
              <Plus size={20} /> Create Your First Habit
            </button>
          </div>
        ) : filteredHabits.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 20px', opacity: 0.6 }}>
            <Search size={48} style={{ marginBottom: '16px' }} />
            <h3>No habits found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {groupByCat ? (
              categories.map(cat => {
                const catHabits = filteredHabits.filter(h => h.categoryId === cat.id);
                if (catHabits.length === 0) return null;
                return (
                  <div key={cat.id} style={{ marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: cat.color || 'var(--accent-primary)' }} />
                      {cat.name}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {catHabits.map(habit => renderHabitCard(habit, cat))}
                    </div>
                  </div>
                )
              })
            ) : (
              filteredHabits.map(habit => {
                const cat = categories.find(c => c.id === habit.categoryId) || {};
                return renderHabitCard(habit, cat);
              })
            )}
          </div>
        )}
      </div>

      {/* History Modal */}
      <AnimatePresence>
        {selectedHabitHistory && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}
            onClick={() => setSelectedHabitHistory(null)}
          >
            <motion.div 
              initial={{ y: 20 }} animate={{ y: 0 }}
              style={{ width: '90%', maxWidth: '450px', padding: '32px' }} className="glass-panel"
              onClick={e => e.stopPropagation()}
            >
              <h2 style={{ marginBottom: '24px' }}>{selectedHabitHistory.name} History</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                {Array.from({ length: 28 }).map((_, i) => {
                  const d = subDays(new Date(), 27 - i);
                  const isCompleted = logs.find(l => l.habitId === selectedHabitHistory.id && l.date === format(d, 'yyyy-MM-dd'))?.progress >= selectedHabitHistory.target;
                  return (
                    <div key={i} title={format(d, 'MMM d')} style={{ height: '30px', borderRadius: '4px', background: isCompleted ? 'var(--accent-primary)' : 'var(--bg-elevated)', opacity: isCompleted ? 1 : 0.3 }} />
                  );
                })}
              </div>
              <p style={{ marginTop: '24px', fontSize: '14px', color: 'var(--text-secondary)' }}>Showing last 28 days of activity.</p>
              <button className="btn btn-primary" style={{ width: '100%', marginTop: '24px' }} onClick={() => setSelectedHabitHistory(null)}>Close</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Velocity Modal */}
      <AnimatePresence>
        {selectedHabitVelocity && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}
            onClick={() => setSelectedHabitVelocity(null)}
          >
            <motion.div 
              initial={{ y: 20 }} animate={{ y: 0 }}
              style={{ width: '90%', maxWidth: '450px', padding: '32px' }} className="glass-panel"
              onClick={e => e.stopPropagation()}
            >
               <h2 style={{ marginBottom: '24px' }}>{selectedHabitVelocity.name} Analytics</h2>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px' }}>
                   <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>30-Day Completion:</span>
                   <span style={{ fontWeight: '800', fontSize: '18px', color: 'var(--accent-primary)' }}>{getHabitStats(selectedHabitVelocity.id).rate}%</span>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px' }}>
                   <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Consistency Rating:</span>
                   <span style={{ 
                     fontWeight: '800', 
                     fontSize: '16px', 
                     color: getHabitStats(selectedHabitVelocity.id).rate > 70 ? 'var(--accent-success)' : 'var(--accent-warning)',
                     textTransform: 'uppercase',
                     letterSpacing: '1px'
                   }}>
                     {getHabitStats(selectedHabitVelocity.id).consistency}
                   </span>
                 </div>
                 <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '10px' }}>
                   Successfully completed {getHabitStats(selectedHabitVelocity.id).completedCount} out of {getHabitStats(selectedHabitVelocity.id).scheduledCount} scheduled days in the last month.
                 </div>
               </div>
              <button className="btn btn-primary" style={{ width: '100%', marginTop: '24px' }} onClick={() => setSelectedHabitVelocity(null)}>Awesome</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {editingHabit && (
        <HabitModal 
          onClose={() => setEditingHabit(null)} 
          editData={editingHabit} 
        />
      )}
    </div>
  );
};

export default Habits;
