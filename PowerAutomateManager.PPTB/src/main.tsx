import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Shell } from './app/Shell';
import './categories/register';
import './styles.css';

const container = document.getElementById('app');
if (!container) {
  throw new Error('Root element #app not found.');
}

createRoot(container).render(
  <StrictMode>
    <Shell />
  </StrictMode>,
);
