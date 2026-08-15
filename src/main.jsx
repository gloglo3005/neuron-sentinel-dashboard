import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { SelectedZoneProvider } from './context/SelectedZoneContext.jsx';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SelectedZoneProvider>
          <App />
        </SelectedZoneProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
