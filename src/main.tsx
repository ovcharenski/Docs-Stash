import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { saveError } from './errorLogger';
import './index.css';

if (import.meta.env.DEV) {
  window.onerror = (message, source, lineno, colno, error) => {
    saveError(error ?? new Error(String(message)));
  };
  window.onunhandledrejection = (e) => {
    saveError(e.reason);
  };
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
