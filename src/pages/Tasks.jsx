import React, { useState } from 'react';
import { useHabits } from '../context/HabitContext';
import { Search, Filter, Download, Clock, CheckCircle2, LayoutList, LayoutGrid, Edit2, Trash2, Sparkles, Plus } from 'lucide-react';
import HabitModal from '../components/HabitModal';
import * as XLSX from 'xlsx';

const Tasks = () => {
  const { tasks, categories, toggleTask, deleteTask } = useHabits();
  const [tab, setTab] = useState('single'); // 'single' or 'recurring'
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'board'
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Sync state with browser history for back-button support
  React.useEffect(() => {
    if (editingTask) {
      window.history.pushState({ modal: true }, '');
    }
    const handlePopState = () => setEditingTask(null);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [editingTask]);

  const handleDownload = () => {
    // 1. Format the data for Excel
    const excelData = tasks.map(task => {
      const cat = categories.find(c => c.id === task.categoryId);
      return {
        'Task Name': task.name,
        'Status': task.completed ? 'Completed' : 'Pending',
        'Type': task.type === 'task' ? 'Single' : 'Recurring',
        'Priority': task.priority || 'Medium',
        'Category': cat ? cat.name : 'Uncategorized',
        'Notes': task.notes || '',
        'Created At': task.createdAt ? new Date(task.createdAt).toLocaleString() : 'N/A'
      };
    });

    // 2. Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // 3. Create workbook and append worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tasks');

    // 4. Set column widths for better readability
    const wscols = [
      { wch: 30 }, // Task Name
      { wch: 12 }, // Status
      { wch: 12 }, // Type
      { wch: 10 }, // Priority
      { wch: 15 }, // Category
      { wch: 40 }, // Notes
      { wch: 20 }, // Created At
    ];
    worksheet['!cols'] = wscols;

    // 5. Trigger download
    XLSX.writeFile(workbook, 'trackify-tasks.xlsx');
  };

  let filteredTasks = tasks.filter(t => tab === 'single' ? t.type === 'task' : t.type === 'recurring_task');
  if (search.trim()) {
    filteredTasks = filteredTasks.filter(t => (t.name || '').toLowerCase().includes(search.toLowerCase()));
  }

  const renderTaskCard = (task) => {
    const isHigh = task.priority === 'High';
    return (
      <div key={task.id} style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: '12px', border: '1px solid var(--stroke-subtle)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
             <div style={{ fontWeight: '500', fontSize: '15px', textDecoration: task.completed ? 'line-through' : 'none', color: task.completed ? 'var(--text-secondary)' : 'var(--text-primary)' }}>{task.name}</div>
             <div style={{ display: 'flex', gap: '4px' }}>
                <button onClick={() => setEditingTask(task)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><Edit2 size={16} /></button>
                <button onClick={() => { if(window.confirm('Delete task?')) deleteTask(task.id); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--accent-danger)' }}><Trash2 size={16} /></button>
                <button onClick={() => toggleTask(task.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', flexShrink: 0, paddingLeft: '8px' }}>
                   {task.completed ? <CheckCircle2 size={24} color="var(--accent-primary)" /> : <div className="check-circle" style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid var(--stroke-strong)' }} />}
                </button>
             </div>
          </div>
         {task.notes && <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{task.notes}</div>}
         {task.priority && task.priority !== 'Medium' && (
            <div>
              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '99px', background: 'var(--bg-elevated)', color: isHigh ? 'var(--accent-danger)' : 'var(--text-secondary)', border: `1px solid ${isHigh ? 'var(--accent-danger)' : 'var(--text-secondary)'}` }}>
                {task.priority} Flag
              </span>
            </div>
         )}
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
          <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Tasks</h1>
        </div>
        <div style={{ display: 'flex', gap: '16px', color: 'var(--text-secondary)' }}>
          <button onClick={() => setViewMode(viewMode === 'list' ? 'board' : 'list')} className="btn-icon" title="Toggle View">
            {viewMode === 'list' ? <LayoutGrid size={24} /> : <LayoutList size={24} />}
          </button>
          <button onClick={() => setShowSearch(!showSearch)} className="btn-icon"><Search size={24} /></button>
          <button onClick={handleDownload} className="btn-icon" title="Export Tasks Data"><Download size={24} /></button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      {showSearch && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
          <input 
            autoFocus
            type="text" 
            placeholder="Search tasks..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1 }}
          />
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--stroke-subtle)', marginBottom: '8px' }}>
        <button 
          onClick={() => setTab('single')}
          style={{ flex: 1, padding: '16px', background: 'transparent', border: 'none', borderBottom: tab === 'single' ? '2px solid var(--accent-primary)' : '2px solid transparent', color: tab === 'single' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: tab === 'single' ? 'bold' : 'normal', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          Single tasks
        </button>
        <button 
          onClick={() => setTab('recurring')}
          style={{ flex: 1, padding: '16px', background: 'transparent', border: 'none', borderBottom: tab === 'recurring' ? '2px solid var(--accent-primary)' : '2px solid transparent', color: tab === 'recurring' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: tab === 'recurring' ? 'bold' : 'normal', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          Recurring tasks
        </button>
      </div>

      {/* List / Board / Empty State */}
      <div style={{ flex: 1 }}>
        {tasks.length === 0 ? (
          <div style={{ 
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
            minHeight: '400px', textAlign: 'center', gap: '20px', padding: '40px'
          }}>
            <div style={{ 
              width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #3498db, #8e44ad)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 40px rgba(52,152,219,0.3)'
            }}>
              <CheckCircle2 size={40} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>Organize your day</h2>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '320px', lineHeight: 1.6 }}>
                Your task list is empty. Break down your goals into actionable steps to stay productive.
              </p>
            </div>
            <button 
              className="btn btn-primary" 
              onClick={() => setEditingTask({ type: tab === 'single' ? 'task' : 'recurring_task' })} 
              style={{ padding: '12px 24px' }}
            >
              <Plus size={20} /> Create Your First Task
            </button>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 20px', opacity: 0.6 }}>
            <Search size={48} style={{ marginBottom: '16px' }} />
            <h3>No tasks found</h3>
            <p>Your search didn't match any {tab} tasks.</p>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px', padding: '4px 12px', background: 'var(--bg-elevated)', borderRadius: '8px', display: 'inline-block' }}>Today</div>
            
            {viewMode === 'list' ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {filteredTasks.map(task => {
                  const cat = categories.find(c => c.id === task.categoryId) || {};
                  const isHigh = task.priority === 'High';
                  return (
                    <div key={task.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '16px', borderBottom: '1px solid var(--stroke-subtle)', background: task.completed ? 'var(--bg-surface)' : 'transparent' }}>
                      <div style={{ 
                        width: '40px', height: '40px', borderRadius: '12px', 
                        background: cat.color || 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: task.completed ? 0.5 : 1 
                      }}>
                        <Clock size={20} color="#000" />
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ fontSize: '16px', fontWeight: '500', color: task.completed ? 'var(--text-secondary)' : 'var(--text-primary)', textDecoration: task.completed ? 'line-through' : 'none' }}>
                            {task.name}
                          </div>
                          {task.priority && task.priority !== 'Medium' && (
                            <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'var(--bg-elevated)', color: isHigh ? 'var(--accent-danger)' : 'var(--text-secondary)', border: `1px solid ${isHigh ? 'var(--accent-danger)' : 'var(--text-secondary)'}` }}>
                              {task.priority}
                            </span>
                          )}
                        </div>
                        {task.notes && (
                          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                            {task.notes}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <button onClick={() => setEditingTask(task)} className="btn-icon" style={{ width: '32px', height: '32px' }}><Edit2 size={18} /></button>
                        <button onClick={() => { if(window.confirm('Delete task?')) deleteTask(task.id); }} className="btn-icon" style={{ width: '32px', height: '32px', color: 'var(--accent-danger)' }}><Trash2 size={18} /></button>
                        <button 
                          onClick={() => toggleTask(task.id)}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', marginTop: '2px' }}
                        >
                          {task.completed ? <CheckCircle2 size={24} color="var(--accent-primary)" /> : <div className="check-circle" style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid var(--stroke-strong)' }} />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', alignItems: 'flex-start' }}>
                <div className="glass-panel" style={{ padding: '24px', background: 'linear-gradient(145deg, var(--bg-surface), var(--bg-elevated))' }}>
                  <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>To Do <span style={{ fontSize: '12px', background: 'var(--bg-elevated)', padding: '4px 12px', borderRadius: '99px', border: '1px solid var(--stroke-subtle)', fontWeight: 'normal' }}>{filteredTasks.filter(t => !t.completed).length} pending</span></h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {filteredTasks.filter(t => !t.completed).map(task => renderTaskCard(task))}
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '24px', opacity: 0.8 }}>
                  <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Done <span style={{ fontSize: '12px', background: 'var(--bg-elevated)', padding: '4px 12px', borderRadius: '99px', border: '1px solid var(--stroke-subtle)', color: 'var(--text-secondary)', fontWeight: 'normal' }}>{filteredTasks.filter(t => t.completed).length} completed</span></h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {filteredTasks.filter(t => t.completed).map(task => renderTaskCard(task))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {editingTask && (
        <HabitModal 
          onClose={() => setEditingTask(null)} 
          editData={editingTask} 
        />
      )}
    </div>
  );
};

export default Tasks;
