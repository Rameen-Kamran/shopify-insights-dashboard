// main.jsx — the React entry point. Finds the #root div in index.html and
// renders our top-level <App /> component into it.

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
