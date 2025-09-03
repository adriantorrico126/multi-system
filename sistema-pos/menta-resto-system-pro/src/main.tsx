import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './mobile-styles.css'
import React from 'react';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
