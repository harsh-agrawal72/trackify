import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Trophy, Star } from 'lucide-react';

// Global toast manager
let toastQueue = [];
let setToastsExternal = null;

export const showXPToast = (message, xp, type = 'habit') => {
  const id = Date.now() + Math.random();
  const newToast = { id, message, xp, type };
  if (setToastsExternal) {
    setToastsExternal(prev => [...prev, newToast]);
    setTimeout(() => {
      setToastsExternal(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }
};

const icons = {
  habit: <Zap size={18} />,
  achievement: <Trophy size={18} />,
  streak: <Star size={18} />,
};

const colors = {
  habit: 'linear-gradient(135deg, #D84B6B, #FF8C42)',
  achievement: 'linear-gradient(135deg, #f1c40f, #e67e22)',
  streak: 'linear-gradient(135deg, #2ecc71, #1abc9c)',
  task: 'linear-gradient(135deg, #8e44ad, #3498db)',
};

const XPToastContainer = () => {
  const [toasts, setToasts] = useState([]);
  
  useEffect(() => {
    setToastsExternal = setToasts;
    return () => { setToastsExternal = null; };
  }, []);

  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px',
      zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px',
      pointerEvents: 'none'
    }}>
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 80, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.8 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '14px 20px',
              background: colors[toast.type] || 'var(--accent-primary)',
              borderRadius: '16px',
              color: '#fff',
              fontSize: '15px', fontWeight: '600',
              boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
              border: '1px solid rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
              minWidth: '220px'
            }}
          >
            <motion.div
              animate={{ rotate: [0, -15, 15, 0] }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {icons[toast.type]}
            </motion.div>
            <div>
              <div style={{ fontSize: '13px', opacity: 0.9 }}>{toast.message}</div>
              {toast.xp > 0 && (
                <div style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '-0.5px' }}>
                  +{toast.xp} XP
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default XPToastContainer;
