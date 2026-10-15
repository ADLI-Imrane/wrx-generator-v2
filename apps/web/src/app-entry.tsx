import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';
import './styles/studio.css';
import './styles/workspace-navigation.css';

export function mountApp(container: HTMLElement) {
  // The fallback HTML can contain the prerendered homepage; the app replaces it.
  container.replaceChildren();
  ReactDOM.createRoot(container).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
