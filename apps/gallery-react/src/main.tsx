// Order matters: tokens, then the system CSS (reset, base, components), then
// the style packs (fonts and recipes), then the demo kit and the shell.
import '@the-system/tokens/css';
import '@the-system/css';
import '@the-system/styles';
import '../../../packages/react/src/demo/demo.css';
import './gallery.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

const el = document.getElementById('app');
if (!el) throw new Error('The gallery needs an element with id app.');
createRoot(el).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
