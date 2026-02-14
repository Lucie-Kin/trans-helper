import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom';
import '@ionic/core/css/ionic.bundle.css';
import './index.css'
import App from './App.tsx'
import { LanguageProvider } from './language/LanguageContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
	<LanguageProvider>
      <App />
	  </LanguageProvider>
    </BrowserRouter>
  </StrictMode>,
)
