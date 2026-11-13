// Actual Main/providers/routes. The server supplies only GET/HEAD access to the
// existing local database. No synthetic account, records or write successes.
import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { initializeApp } from 'firebase/app';
import axios from 'axios';
import Main from 'audit-application/Main';

const state = window.__liveUiAudit = { ready: false, pending: 0, lastRequestAt: performance.now(), requests: [], refusedWrites: [] };
const params = new URLSearchParams(location.search);
initializeApp({ apiKey: 'fake-route-review-public-key', authDomain: 'route-review.invalid', projectId: 'fake-route-review', appId: '1:000000000000:web:fake-route-review' });
localStorage.setItem('mui-mode', params.get('theme') || 'dark');
window.gtag = () => {};
axios.interceptors.request.use(config => {
  const method = (config.method || 'get').toUpperCase();
  if (!['GET', 'HEAD'].includes(method)) {
    state.refusedWrites.push({ method, path: new URL(config.url, location.origin).pathname });
    throw new Error('Live UI audit refuses all writes');
  }
  state.pending++; state.lastRequestAt = performance.now();
  state.requests.push({ method, path: new URL(config.url, location.origin).pathname });
  return config;
});
axios.interceptors.response.use(response => {
  state.pending--; state.lastRequestAt = performance.now(); return response;
}, error => {
  if (error.config) state.pending--;
  state.lastRequestAt = performance.now(); return Promise.reject(error);
});
ReactDOM.render(<BrowserRouter><Main /></BrowserRouter>, document.getElementById('root'), () => { state.ready = true; });
