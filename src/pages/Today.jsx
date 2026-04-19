import React, { useState } from 'react';
import { Search, Filter, CalendarDays, Utensils, Clock, GraduationCap, XCircle } from 'lucide-react';
import { useHabits } from '../context/HabitContext';
import { format, subDays, addDays, isSameDay } from 'date-fns';

// Icon mapper for categories
const getIcon = (name) => {
  switch (name) {
    case 'Utensils': return <Utensils size={20} color="#000" />;
    case 'Clock': return <Clock size={20} color="#000" />;
    case 'GraduationCap': return <GraduationCap size={20} color="#000" />;
    case 'XCircle': return <XCircle size={20} color="#000" />;
    default: return <Clock size={20} color="#000" />;
  }
};

const Today = () => {
  const { habits, tasks, categories, logs, selectedDate, setSelectedDate, logHabitProgress, toggleTask } = useHabits();
  
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [showSearch, setShowSearch] = useState(false);
  const [showFilter, setShowFilter] = useState(false);

  const currentDate = new Date(selectedDate);
  const dateStrip = Array.from({ length: 7 }).map((_, idx) => subDays(currentDate, 3 - idx));

  const isToday = isSameDay(currentDate, new Date());
  
  // Mix Active Habits and Tasks for the selected date
  const todaysLogs = logs.filter(l => l.date === format(currentDate, 'yyyy-MM-dd'));
  
  const activeHabits = habits.filter(h => {
    if (h.status !== 'active' || !(h.frequencyDays || [0,1,2,3,4,5,6]).includes(currentDate.getDay())) return false;
    const start = new Date(h.startDate || '2000-01-01');
    start.setHours(0,0,0,0);
    if (currentDate < start) return false;
    if (h.endDate) {
      const end = new Date(h.endDate);
      end.setHours(23,59,59,999);
      if (currentDate > end) return false;
    }
    return true;
  });
  
  const todaysTasks = tasks.filter(t => t.date === format(currentDate, 'yyyy-MM-dd'));

  // Normalize entries
  let entries = [
    ...activeHabits.map(h => {
      const cat = categories.find(c => c.id === h.categoryId) || {};
      const log = todaysLogs.find(l => l.habitId === h.id);
      const isAtMost = h.goalType === 'at_most';
      const isCompleted = isAtMost ? (log && log.completedAt && log.progress <= h.target) : (log && log.progress >= h.target);
      return { 
        id: h.id, type: h.type || 'habit', name: h.name, subtitle: h.type === 'recurring_task' ? 'Recurring Task' : 'Habit', 
        categoryId: h.categoryId, categoryColor: cat.color || '#555', categoryIcon: cat.icon || 'Clock',
        priority: h.priority || 'Medium', notes: h.notes || '',
        isCompleted, 
        onClick: () => h.type === 'recurring_task' ? logHabitProgress(h.id, 1, currentDate) : logHabitProgress(h.id, 1, currentDate)
      }
    }),
    ...todaysTasks.map(t => {
      const cat = categories.find(c => c.id === t.categoryId) || {};
      return {
        id: t.id, type: 'task', name: t.name, subtitle: 'Task',
        categoryId: t.categoryId, categoryColor: cat.color || '#D84B6B', categoryIcon: cat.icon || 'Clock',
        priority: t.priority || 'Medium', notes: t.notes || '',
        isCompleted: t.completed,
        onClick: () => toggleTask(t.id)
      }
    })
  ];

  // Apply Filters
  if (search.trim()) {
    entries = entries.filter(e => (e.name || '').toLowerCase().includes(search.toLowerCase()));
  }
  if (filterCat !== 'all') {
    entries = entries.filter(e => e.categoryId === filterCat);
  }

  const getPriorityColor = (p) => {
    if (p === 'High') return 'var(--accent-danger)';
    if (p === 'Low') return 'var(--text-secondary)';
    return 'var(--cat-yellow)'; // Medium
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <div style={{ width: '20px', height: '3px', background: 'var(--accent-primary)', borderRadius: '2px' }} />
            <div style={{ width: '12px', height: '3px', background: 'var(--accent-primary)', borderRadius: '2px' }} />
            <div style={{ width: '20px', height: '3px', background: 'var(--accent-primary)', borderRadius: '2px' }} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>{isToday ? 'Today' : format(currentDate, 'MMM do')}</h1>
        </div>
        <div style={{ display: 'flex', gap: '16px', color: 'var(--text-secondary)' }}>
          <button onClick={() => setShowSearch(!showSearch)} className="btn-icon"><Search size={24} /></button>
          <button onClick={() => setShowFilter(!showFilter)} className="btn-icon"><Filter size={24} /></button>
          <button onClick={() => setSelectedDate(new Date().toISOString())} className="btn-icon"><CalendarDays size={24} /></button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      {(showSearch || showFilter) && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          {showSearch && (
            <input 
              autoFocus
              type="text" 
              placeholder="Search activities..." 
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

      {/* Date Strip */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', overflowX: 'auto', paddingBottom: '8px' }}>
        {dateStrip.map((d, i) => {
          const selected = isSameDay(d, currentDate);
          const isTodayMarker = isSameDay(d, new Date());
          return (
            <button
              key={i}
              onClick={() => setSelectedDate(d.toISOString())}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                padding: '16px 24px', borderRadius: '24px', border: selected ? 'none' : '1px solid var(--stroke-subtle)', 
                cursor: 'pointer',
                background: selected ? 'var(--accent-primary)' : 'var(--bg-surface)',
                color: selected ? '#FFF' : 'var(--text-secondary)',
                minWidth: '80px', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: selected ? '0 10px 20px rgba(216, 75, 107, 0.3)' : 'none',
                position: 'relative'
              }}
            >
              {isTodayMarker && !selected && (
                <div style={{ position: 'absolute', top: '8px', right: '12px', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-primary)' }} />
              )}
              <span style={{ fontSize: '13px', fontWeight: selected ? '600' : '500', textTransform: 'uppercase', letterSpacing: '1px' }}>{format(d, 'EEE')}</span>
              <span style={{ fontSize: '20px', fontWeight: 'bold', color: selected ? '#FFF' : 'var(--text-primary)' }}>{format(d, 'd')}</span>
            </button>
          )
        })}
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '32px' }}>
        {entries.map(entry => (
          <div key={entry.id} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--stroke-subtle)' }}>
            
            <div style={{ display: 'flex', gap: '16px', flex: 1 }}>
              {/* Category Icon Block */}
              <div style={{ 
                width: '44px', height: '44px', borderRadius: '14px', 
                background: entry.categoryColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                {getIcon(entry.categoryIcon)}
              </div>
              
              {/* Text */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <div style={{ fontSize: '16px', fontWeight: '500', textDecoration: entry.isCompleted ? 'line-through' : 'none', color: entry.isCompleted ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                    {entry.name}
                  </div>
                  {entry.priority !== 'Medium' && (
                    <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'var(--bg-elevated)', color: getPriorityColor(entry.priority), border: `1px solid ${getPriorityColor(entry.priority)}` }}>
                      {entry.priority}
                    </span>
                  )}
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ fontSize: '12px', color: entry.type === 'habit' ? 'var(--cat-yellow)' : 'var(--cat-pink)' }}>
                    {entry.subtitle}
                  </div>
                  {entry.notes && (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                      • {entry.notes}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Check Circle */}
            <button 
              onClick={entry.onClick}
              className={`check-circle ${entry.isCompleted ? 'completed' : ''}`}
            ></button>
          </div>
        ))}

        {entries.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '48px' }}>
            No activities scheduled for this date.
          </div>
        )}
      </div>

    </div>
  );
};

export default Today;
