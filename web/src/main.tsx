import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { setupAxiosInterceptors } from '@/api/axiosInterceptor.api';


const container = document.getElementById('root');

if (!container) {
  throw new Error('Root container missing');
}
setupAxiosInterceptors();

createRoot(container).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
