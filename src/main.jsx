import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { HabitProvider } from './context/HabitContext.jsx';
import AuthGuard from './components/AuthGuard.jsx';
import { registerSW } from 'virtual:pwa-register';

// Register service worker
registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthGuard>
      <HabitProvider>
        <App />
      </HabitProvider>
    </AuthGuard>
  </React.StrictMode>,
);
