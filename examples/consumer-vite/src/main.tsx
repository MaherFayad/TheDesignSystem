// CSS order: the system first (tokens, then components, then style packs),
// then the app's own CSS Modules, which App imports below. The app CSS sits
// outside any layer, so it wins over the system layers whatever the order.
import '@the-system/tokens/css';
import '@the-system/css';
import '@the-system/styles';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { readDisplay, stampHtml } from './display';

const initial = readDisplay(window.location.search);
stampHtml(initial);

const root = document.getElementById('root');
if (!root) throw new Error('No #root element in index.html');
createRoot(root).render(
  <StrictMode>
    <App initial={initial} />
  </StrictMode>,
);
