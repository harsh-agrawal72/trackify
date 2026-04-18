import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Check, Flame, Plus, Minus, AlertTriangle, Clock } from 'lucide-react';
import { useHabits } from '../context/HabitContext';

const HabitItem = memo(({ habit, logs }) => {
  const { logHabitProgress } = useHabits();
  
  const currentLog = logs.find(l => l.habitId === habit.id);
  const progress = currentLog ? currentLog.progress : 0;
  const isAtLeast = habit.goalType !== 'at_most';
  const isCompleted = isAtLeast ? (progress >= habit.target) : (!!currentLog?.completedAt && progress <= habit.target); 
  const isFailed = !isAtLeast && (habit.targetUnit === 'binary' ? progress > 0 : progress > habit.target);
  const isSucceeding = !isAtLeast && !isFailed;
  
  const progressPercent = Math.min((progress / habit.target) * 100, 100);
  
  const getStepSize = (unit) => {
    switch(unit) {
      case 'steps': return 1000;
      case 'km': return 1;
      case 'reps': return 5;
      case 'pages': return 5;
      default: return 1;
    }
  };

  const handleStep = () => {
    const stepSize = getStepSize(habit.targetUnit);
    if (habit.targetUnit === 'binary' && !isAtLeast) {
      if (isCompleted) {
        logHabitProgress(habit.id, 0); 
      } else {
        const amount = progress > 0 ? -progress : 1;
        logHabitProgress(habit.id, amount);
      }
    } else {
      const amount = habit.targetUnit === 'mins' ? habit.target : stepSize;
      logHabitProgress(habit.id, amount);
    }
  };

  const handleToggleSuccess = (e) => {
    e.stopPropagation();
    logHabitProgress(habit.id, 0);
  };

  const handleDecrement = (e) => {
    e.stopPropagation();
    if (progress > 0) {
      const stepSize = getStepSize(habit.targetUnit);
      logHabitProgress(habit.id, -stepSize);
    }
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`glass-card ${isCompleted ? 'completed' : ''} ${isFailed ? 'failed' : ''}`}
      style={{ 
        padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        border: isCompleted ? '1px solid var(--accent-success)' : isFailed ? '1px solid var(--accent-warning)' : '1px solid var(--stroke-subtle)',
        position: 'relative', overflow: 'hidden', gap: '8px', flexWrap: 'wrap'
      }}
    >
      {/* Background Progress Fill */}
      {!isCompleted && !isFailed && habit.target > 1 && (
        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: `${progressPercent}%`, background: 'var(--accent-primary-dim)', zIndex: 0, transition: 'width 0.3s ease' }} />
      )}

      {/* Complete Flash Animation */}
      {isCompleted && (
        <motion.div 
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 1 }}
          style={{ position: 'absolute', inset: 0, background: 'var(--accent-success)', zIndex: 0 }}
        />
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', zIndex: 1 }}>
        <button 
          onClick={(e) => { e.stopPropagation(); isAtLeast ? handleStep() : handleToggleSuccess(e); }}
          style={{
            width: '44px', height: '44px', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            border: (isCompleted || isFailed) ? 'none' : '2px solid var(--stroke-strong)', 
            background: isCompleted ? 'var(--accent-success)' : isFailed ? 'var(--accent-warning)' : 'transparent',
            cursor: 'pointer', transition: 'all 0.2s', color: (isCompleted || isFailed) ? '#000' : 'var(--text-primary)',
            position: 'relative'
          }}
          whileTap={{ scale: 0.9 }}
        >
          {isCompleted ? <Check size={20} /> : (
            (isFailed && habit.targetUnit === 'binary') ? <AlertTriangle size={20} /> : (
              habit.targetUnit === 'mins' ? (isFailed ? <AlertTriangle size={20} /> : <Clock size={20} />) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', gap: '0.5px' }}>
                  <span style={{ 
                    fontSize: (progress >= 1000 || habit.target >= 1000) ? '12px' : '14px', 
                    fontWeight: '800', 
                    color: (isCompleted || isFailed) ? '#000' : 'var(--text-primary)'
                  }}>
                    {progress >= 1000 ? `${(progress / 1000).toFixed(progress % 1000 === 0 ? 0 : 1)}k` : progress}
                  </span>
                  <span style={{ fontSize: (progress >= 1000 || habit.target >= 1000) ? '10px' : '12px', opacity: 0.3, fontWeight: 'bold' }}>/</span>
                  <span style={{ 
                    fontSize: (progress >= 1000 || habit.target >= 1000) ? '12px' : '14px', 
                    fontWeight: '800', 
                    opacity: 0.7,
                    color: (isCompleted || isFailed) ? '#000' : 'var(--text-muted)'
                  }}>
                    {habit.target >= 1000 ? `${(habit.target / 1000).toFixed(habit.target % 1000 === 0 ? 0 : 1)}k` : habit.target}
                  </span>
                </div>
              )
            )
          )}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={{ 
            fontSize: 'min(17px, 4.5vw)', fontWeight: 'bold', margin: '0 0 4px 0', 
            textDecoration: isCompleted ? 'line-through' : 'none', 
            color: isCompleted ? 'var(--text-secondary)' : 'var(--text-primary)',
            whiteSpace: 'normal', 
            wordBreak: 'break-word',
            lineHeight: 1.2
          }}>
            {habit.name}
          </h4>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
            <span>{habit.target > 1 ? `${habit.targetUnit}` : habit.timeOfDay}</span>
            {habit.streak > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-warning)' }}>
                <Flame size={12} /> {habit.streak}d
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', zIndex: 1, flexShrink: 0 }}>
        {progress > 0 && habit.targetUnit !== 'mins' && habit.targetUnit !== 'binary' && (
          <button 
            onClick={handleDecrement}
            className="btn-icon" 
            style={{ 
              height: '40px', width: '40px', borderRadius: '10px',
              background: 'var(--bg-elevated)', border: isFailed ? '1px solid var(--accent-warning)' : '1px solid var(--stroke-strong)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <Minus size={16} />
          </button>
        )}

        {isAtLeast ? (
          <button 
            onClick={handleStep}
            className="btn" 
            style={{ 
              height: '40px', padding: '0 16px', 
              background: isCompleted ? 'var(--accent-success)' : 'var(--bg-elevated)', 
              border: isCompleted ? 'none' : '1px solid var(--stroke-strong)',
              fontSize: '13px', fontWeight: 'bold', color: isCompleted ? '#000' : 'var(--text-primary)',
              display: 'flex', gap: '8px', alignItems: 'center'
            }}
          >
            {isCompleted ? <Check size={16} /> : <Plus size={16} />}
            <span className="hide-mobile">
              {isCompleted ? 'Done' : (
                habit.targetUnit === 'mins' ? 'Complete' : (
                  (habit.targetUnit === 'binary' || habit.target <= 1) ? 'Mark Done' : `+${getStepSize(habit.targetUnit)}`
                )
              )}
            </span>
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            {!isFailed && (
              <button 
                onClick={handleToggleSuccess}
                className="btn" 
                style={{ 
                  height: '40px', padding: '0 16px', 
                  background: isCompleted ? 'var(--accent-success)' : 'var(--bg-elevated)', 
                  border: isCompleted ? 'none' : '1px solid var(--stroke-strong)',
                  fontSize: '13px', fontWeight: 'bold', color: isCompleted ? '#000' : 'var(--text-primary)',
                  display: 'flex', gap: '8px', alignItems: 'center'
                }}
              >
                <Check size={16} />
                <span className="hide-mobile">{isCompleted ? 'Saved' : 'Mark Done'}</span>
              </button>
            )}

            <button 
              onClick={handleStep}
              className="btn" 
              style={{ 
                height: '40px', padding: '0 12px', 
                background: 'var(--bg-elevated)', border: isFailed ? '1px solid var(--accent-warning)' : '1px solid var(--stroke-strong)',
                fontSize: '13px', fontWeight: 'bold', color: isFailed ? 'var(--accent-warning)' : 'var(--text-primary)',
                display: 'flex', gap: '8px', alignItems: 'center'
              }}
            >
              <Plus size={16} /> 
              <span className="hide-mobile">{isFailed ? 'Failed' : 'Report Fail'}</span>
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
});

export default HabitItem;
