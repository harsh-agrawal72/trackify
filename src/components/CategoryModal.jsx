import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Activity, Briefcase, User, Book, Heart, Zap, Coffee, Code } from 'lucide-react';
import { useHabits } from '../context/HabitContext';

const CategoryModal = ({ onClose, editData }) => {
  const { addCategory, editCategory } = useHabits();
  
  const [formData, setFormData] = useState({
    name: '',
    color: 'var(--cat-purple)',
    icon: 'Activity'
  });

  useEffect(() => {
    if (editData) {
      setFormData({
        name: editData.name,
        color: editData.color,
        icon: editData.icon
      });
    }
  }, [editData]);

  const icons = [
    { name: 'Activity', icon: <Activity size={24} /> },
    { name: 'Briefcase', icon: <Briefcase size={24} /> },
    { name: 'User', icon: <User size={24} /> },
    { name: 'Book', icon: <Book size={24} /> },
    { name: 'Heart', icon: <Heart size={24} /> },
    { name: 'Zap', icon: <Zap size={24} /> },
    { name: 'Coffee', icon: <Coffee size={24} /> },
    { name: 'Code', icon: <Code size={24} /> },
  ];

  const colors = [
    'var(--cat-purple)',
    'var(--cat-yellow)',
    'var(--cat-red)',
    'var(--cat-pink)',
    'var(--cat-blue)',
    '#27ae60',
    '#2980b9',
    '#e67e22'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) return;
    
    if (editData) {
      editCategory(editData.id, formData);
    } else {
      addCategory(formData);
    }
    onClose();
  };

  return (
    <div className="bottom-sheet-overlay" onClick={onClose}>
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="bottom-sheet"
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: '450px', margin: '0 auto' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>{editData ? 'Edit' : 'New'} Category</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Category Name</label>
            <input 
              type="text" 
              placeholder="e.g. Fitness, Meditation" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              autoFocus
              required
            />
          </div>

          <div>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px', display: 'block' }}>Choose Color</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {colors.map((color, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setFormData({...formData, color})}
                  style={{
                    height: '40px', borderRadius: '10px', background: color, border: formData.color === color ? '3px solid #FFF' : 'none', cursor: 'pointer', transition: 'transform 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                />
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px', display: 'block' }}>Select Icon</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {icons.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setFormData({...formData, icon: item.name})}
                  style={{
                    height: '48px', borderRadius: '12px', background: formData.icon === item.name ? 'var(--bg-elevated)' : 'transparent', border: formData.icon === item.name ? '1px solid var(--accent-primary)' : '1px solid var(--stroke-subtle)', color: formData.icon === item.name ? 'var(--accent-primary)' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  {item.icon}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: '12px' }}>
            {editData ? 'Save Changes' : 'Create Category'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default CategoryModal;
