import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Trophy, Repeat, CheckCircle, Hash, Clock, CheckSquare, Ban } from 'lucide-react';
import { useHabits } from '../context/HabitContext';

const HabitModal = ({ onClose, editData }) => {
  const { addHabit, editHabit, addTask, editTask, categories } = useHabits();
  const [step, setStep] = useState(editData ? (editData.type === 'habit' ? 'habit_form' : (editData.type === 'recurring_task' ? 'recurring_form' : 'task_form')) : 'menu');
  
  const [formData, setFormData] = useState({
    name: editData?.name || '', 
    target: editData?.target || 1, 
    targetUnit: editData?.targetUnit || 'times', 
    goalType: editData?.goalType || 'at_least',
    categoryId: editData?.categoryId || categories[0]?.id || '1',
    startDate: editData?.startDate || editData?.date || new Date().toISOString().substring(0, 10), 
    endDate: editData?.endDate || '',
    priority: editData?.priority || 'Medium', 
    notes: editData?.notes || '',
    frequencyDays: editData?.frequencyDays || [0, 1, 2, 3, 4, 5, 6],
    timeOfDay: editData?.timeOfDay || 'Anytime',
    difficulty: editData?.difficulty || 'Medium',
    reminderTime: editData?.reminderTime || '08:00',
    isReminderEnabled: !!editData?.reminderTime
  });

  const UNIT_DEFAULTS = {
    steps: 10000,
    km: 5,
    mins: 30,
    reps: 20,
    pages: 10,
    times: 3,
    hours: 1,
    binary: 1
  };

  const applyUnitDefault = (unit) => {
    setFormData(prev => ({ ...prev, targetUnit: unit, target: UNIT_DEFAULTS[unit] || prev.target }));
  };

  const toggleDay = (day) => {
    setFormData(prev => {
      const days = prev.frequencyDays.includes(day)
        ? prev.frequencyDays.filter(d => d !== day)
        : [...prev.frequencyDays, day];
      return { ...prev, frequencyDays: days.length > 0 ? days : [day] }; 
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) return;
    
    const commonData = {
      name: formData.name,
      categoryId: formData.categoryId,
      priority: formData.priority,
      notes: formData.notes,
      difficulty: formData.difficulty,
      reminderTime: formData.isReminderEnabled ? formData.reminderTime : null
    };

    if (step === 'habit_form') {
      const payload = { 
        ...commonData,
        target: formData.targetUnit === 'binary' ? 1 : formData.target, 
        targetUnit: formData.targetUnit, 
        goalType: formData.goalType,
        type: 'habit', 
        frequencyDays: formData.frequencyDays, 
        startDate: formData.startDate, 
        endDate: formData.endDate,
        timeOfDay: formData.timeOfDay
      };
      if (editData?.id) editHabit(editData.id, payload);
      else addHabit(payload);
    } else if (step === 'recurring_form') {
      const payload = { 
        ...commonData,
        type: 'recurring_task', 
        startDate: formData.startDate, 
        endDate: formData.endDate,
        frequencyDays: formData.frequencyDays,
        timeOfDay: formData.timeOfDay
      };
      if (editData?.id) editTask(editData.id, payload);
      else addTask(payload);
    } else {
      const payload = { 
        ...commonData,
        type: 'task', 
        date: formData.startDate,
        timeOfDay: formData.timeOfDay
      };
      if (editData?.id) editTask(editData.id, payload);
      else addTask(payload);
    }
    onClose();
  };

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="bottom-sheet-overlay" onClick={onClose}>
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'tween', ease: 'easeOut', duration: 0.3 }}
        className="bottom-sheet"
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: '500px', margin: '0 auto', maxHeight: '90vh', overflowY: 'auto', willChange: 'transform' }}
      >
        
        {step === 'menu' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '16px', textAlign: 'center' }}>Choose Type</h2>
            
            <button className="glass-panel" onClick={() => setStep('habit_form')} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(216, 75, 107, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trophy size={24} color="var(--cat-pink)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '17px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Habit</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Recurring activity with deep progress tracking.</div>
              </div>
            </button>

            <button className="glass-panel" onClick={() => setStep('recurring_form')} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(243, 156, 18, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Repeat size={24} color="var(--cat-yellow)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '17px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Recurring Task</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Repeats on schedule. Simpler than a habit.</div>
              </div>
            </button>

            <button className="glass-panel" onClick={() => setStep('task_form')} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(142, 68, 173, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={24} color="var(--cat-purple)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '17px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Single Task</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>One-off activity. Just get it done.</div>
              </div>
            </button>
            <button className="btn btn-secondary" onClick={onClose} style={{ marginTop: '16px' }}>Cancel</button>
          </div>
        )}

        {(step === 'habit_form' || step === 'task_form' || step === 'recurring_form') && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <h2 style={{ fontSize: '22px', fontWeight: 'bold' }}>{editData ? 'Edit' : 'New'} {step === 'habit_form' ? 'Habit' : 'Task'}</h2>
               {!editData && (
                 <button type="button" onClick={() => setStep('menu')} style={{ background: 'transparent', border: 'none', color: 'var(--accent-primary)', fontSize: '14px', cursor: 'pointer' }}>Change Type</button>
               )}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Identify your purpose</label>
                <input 
                  type="text" 
                  placeholder="e.g. Morning Meditation" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  autoFocus
                  required
                  style={{ width: '100%', padding: '12px', fontSize: '16px' }}
                />
              </div>

              {(step === 'habit_form' || step === 'recurring_form') && (
                <div>
                   <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Repeat on these days</label>
                   <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                      {weekDays.map((day, idx) => {
                        const isSelected = formData.frequencyDays.includes(idx);
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => toggleDay(idx)}
                            style={{
                              flex: 1, height: '40px', borderRadius: '10px',
                              border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'var(--stroke-subtle)'}`,
                              background: isSelected ? 'var(--accent-primary)' : 'transparent',
                              color: isSelected ? '#000' : 'var(--text-primary)',
                              fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s'
                            }}
                          >
                            {day}
                          </button>
                        );
                      })}
                   </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Best Time</label>
                  <select value={formData.timeOfDay} onChange={(e) => setFormData({...formData, timeOfDay: e.target.value})} style={{ width: '100%' }}>
                    <option value="Anytime">Anytime</option>
                    <option value="Morning">Morning</option>
                    <option value="Afternoon">Afternoon</option>
                    <option value="Evening">Evening</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Priority</label>
                  <select value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value})} style={{ width: '100%' }}>
                    <option value="Low">Low Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="High">High Priority</option>
                  </select>
                </div>
              </div>

              {step === 'habit_form' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* Goal Type Switcher */}
                  <div>
                    <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px', display: 'block' }}>Goal Direction</label>
                    <div className="segmented-control">
                      <button 
                        type="button" 
                        className={`segmented-item ${formData.goalType === 'at_least' ? 'active' : ''}`}
                        onClick={() => setFormData({...formData, goalType: 'at_least'})}
                      >
                         Build Habit
                      </button>
                      <button 
                        type="button" 
                        className={`segmented-item ${formData.goalType === 'at_most' ? 'active' : ''}`}
                        onClick={() => setFormData({...formData, goalType: 'at_most'})}
                      >
                         Quit / Limit
                      </button>
                    </div>
                  </div>

                  {/* Metric Type Picker */}
                  <div>
                    <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px', display: 'block' }}>Category of Goal</label>
                    <div className="metric-grid">
                      <div 
                        className={`metric-card ${formData.targetUnit === 'binary' ? 'active' : ''}`}
                        onClick={() => applyUnitDefault('binary')}
                      >
                        <CheckSquare size={24} />
                        <span>Yes / No</span>
                      </div>
                      <div 
                        className={`metric-card ${['times', 'steps', 'km', 'reps', 'pages'].includes(formData.targetUnit) ? 'active' : ''}`}
                        onClick={() => applyUnitDefault('times')}
                      >
                        <Hash size={24} />
                        <span>Quantity</span>
                      </div>
                      <div 
                        className={`metric-card ${['mins', 'hours'].includes(formData.targetUnit) ? 'active' : ''}`}
                        onClick={() => applyUnitDefault('mins')}
                      >
                        <Clock size={24} />
                        <span>Time</span>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Goal Details */}
                  {formData.targetUnit !== 'binary' && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{ background: 'var(--bg-elevated)', padding: '16px', borderRadius: '16px', border: '1px solid var(--stroke-subtle)' }}
                    >
                      <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }}>Set Daily Target</label>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                         <input 
                           type="number" min="1"
                           value={formData.target}
                           onChange={(e) => setFormData({...formData, target: parseInt(e.target.value) || 1})}
                           style={{ flex: 1, fontSize: '20px', fontWeight: 'bold', padding: '12px', textAlign: 'center' }}
                         />
                         <select 
                           value={formData.targetUnit} 
                           onChange={(e) => applyUnitDefault(e.target.value)}
                           style={{ width: '130px', height: '52px' }}
                         >
                           {['mins', 'hours'].includes(formData.targetUnit) ? (
                             <>
                               <option value="mins">Minutes</option>
                               <option value="hours">Hours</option>
                             </>
                           ) : (
                             <>
                               <option value="times">Times</option>
                               <option value="km">Kilometers</option>
                               <option value="steps">Steps</option>
                               <option value="reps">Reps</option>
                               <option value="pages">Pages</option>
                             </>
                           )}
                         </select>
                      </div>
                    </motion.div>
                  )}

                  {formData.targetUnit === 'binary' && (
                     <motion.div 
                       initial={{ opacity: 0, scale: 0.95 }}
                       animate={{ opacity: 1, scale: 1 }}
                       style={{ background: 'var(--bg-elevated)', padding: '16px', borderRadius: '16px', border: '1px solid var(--stroke-subtle)', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}
                     >
                        {formData.goalType === 'at_least' ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                             <CheckSquare size={20} color="var(--accent-success)" />
                             <span>Goal: Mark as <strong>Done</strong> each day</span>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                             <Ban size={20} color="var(--accent-warning)" />
                             <span>Goal: <strong>Avoid</strong> this action during the day</span>
                          </div>
                        )}
                     </motion.div>
                  )}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                 <div>
                    <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Category</label>
                    <select value={formData.categoryId} onChange={(e) => setFormData({...formData, categoryId: e.target.value})} style={{ width: '100%' }}>
                       {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                 </div>
                 <div>
                    <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Difficulty</label>
                    <select value={formData.difficulty} onChange={(e) => setFormData({...formData, difficulty: e.target.value})} style={{ width: '100%' }}>
                       <option value="Easy">Easy (1.0x XP)</option>
                       <option value="Medium">Medium (1.5x XP)</option>
                       <option value="Hard">Hard (2.0x XP)</option>
                    </select>
                 </div>
              </div>

              <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--stroke-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontWeight: '500' }}>Enable Reminder</div>
                    {formData.isReminderEnabled && (
                      <input 
                        type="time" 
                        value={formData.reminderTime} 
                        onChange={(e) => setFormData({...formData, reminderTime: e.target.value})}
                        style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--stroke-strong)', background: 'var(--bg-surface)' }}
                      />
                    )}
                 </div>
                 <button 
                  type="button"
                  onClick={() => setFormData({...formData, isReminderEnabled: !formData.isReminderEnabled})}
                  style={{ 
                    width: '48px', height: '26px', borderRadius: '13px', 
                    background: formData.isReminderEnabled ? 'var(--accent-primary)' : 'var(--stroke-strong)',
                    position: 'relative', border: 'none', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                 >
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#000', position: 'absolute', top: '3px', left: formData.isReminderEnabled ? '25px' : '3px', transition: 'all 0.2s' }} />
                 </button>
              </div>

              <div>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Notes & Motivation</label>
                <textarea 
                  rows="2"
                  placeholder="Why is this important to you?"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  style={{ width: '100%', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => (editData?.id ? onClose() : setStep('menu'))} style={{ flex: 1 }}>{editData?.id ? 'Cancel' : 'Back'}</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>{editData?.id ? 'Save Changes' : 'Create'}</button>
              </div>
            </div>
          </form>
        )}

      </motion.div>
    </div>
  );
};

export default HabitModal;
