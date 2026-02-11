import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Development Mode Information
console.log('%c🎓 SK University - CSE Department Portal', 'font-size: 20px; font-weight: bold; color: #2563eb;');
console.log('%c✅ Mock API Mode: ENABLED', 'font-size: 14px; color: #10b981; font-weight: bold;');
console.log('%cYou can login without a backend server!', 'font-size: 12px; color: #6b7280;');
console.log('%cCredentials: 2310101@sku.edu / 2310101', 'font-size: 12px; color: #6b7280;');
console.log('%cTo use real backend, set USE_MOCK_API = false in src/services/api.js', 'font-size: 11px; color: #f59e0b;');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
