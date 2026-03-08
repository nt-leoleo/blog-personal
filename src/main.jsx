import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { initializeDefaultAdmins } from './lib/adminUtils';
import { optimizeFirestoreConnection } from './lib/firebase';
import './index.css';

// Inicializar optimizaciones de Firestore
optimizeFirestoreConnection().catch(console.error);

// Inicializar administradores por defecto
initializeDefaultAdmins().catch(console.error);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
