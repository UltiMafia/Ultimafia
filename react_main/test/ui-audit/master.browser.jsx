// Complete, untouched upstream Main (including its real providers, shell and
// route tree). No redesign components or styles are imported here.
import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import { initializeApp } from 'firebase/app';
import Main from 'audit-master/Main';
import { makeUser, makeSiteInfo, readFixture, routeCases } from '../routeReviewData';

const params = new URLSearchParams(location.search);
const state = window.__routeReview = { ready: false, pending: 0, requests: [], writes: [], unresolved: [], errors: [], lastRequestAt: performance.now(), cases: routeCases };
state.failNextRead = params.get('fixtureFailRead');
state.deferRead = params.get('fixtureDeferRead');
const user = makeUser(params.get('fixtureMode') || 'member');
user.settings.siteColorScheme = params.get('theme') || 'dark';
const site = makeSiteInfo(() => {});
const bootstrap = {
  '/api/roles/all': site.roles, '/api/roles/raw': site.rolesRaw,
  '/api/roles/modifiers': site.modifiers, '/api/roles/gamesettings': site.gamesettings,
  '/api/roles/roletags': site.tags, '/api/roles/descriptions': site.learnGameDescriptionByType,
  '/api/achievements': site.achievementsRaw, '/api/items': site.items,
  // Contracts: routes/stockMarket.js:15 and routes/chat.js:35. Values here are
  // controlled fixture data, not a live balance or a successful transaction.
  '/api/stocks/config': { creatorFeePct: 0.015, systemFeePct: 0.01 },
  '/api/chat/dmAccess': { locked: false, unreadChannels: 0 },
};
initializeApp({ apiKey: 'fake-route-review-public-key', authDomain: 'route-review.invalid', projectId: 'fake-route-review', appId: '1:000000000000:web:fake-route-review' });
window.gtag = () => {};
localStorage.setItem('mui-mode', params.get('theme') || 'dark');
axios.defaults.adapter = async config => {
  state.pending++; state.lastRequestAt = performance.now();
  const url = new URL(config.url, location.origin);
  for (const [key, value] of Object.entries(config.params || {})) if (value != null) url.searchParams.set(key, value);
  const method = (config.method || 'get').toLowerCase();
  state.requests.push({ method, url: url.pathname + url.search });
  try {
    if (url.origin !== location.origin) throw new Error('External master-fixture request blocked');
    if (method === 'get' && state.deferRead === url.pathname) {
      state.deferRead = null;
      await new Promise(resolve => { state.releaseRead = resolve; });
    }
    if (method === 'get' && state.failNextRead === url.pathname) {
      state.failNextRead = null;
      state.simulatedReadFailures = (state.simulatedReadFailures || 0) + 1;
      throw Object.assign(new Error('Simulated read failure'), { fixtureExpected: true });
    }
    let data;
    if (!['get', 'head', 'options'].includes(method)) {
      state.writes.push({ method, url: url.pathname });
      if (state.allowMasterFailure === url.pathname && ['/api/stocks/buy', '/api/feedback/submit'].includes(url.pathname)) {
        state.allowMasterFailure = null;
        state.simulatedWriteFailures = (state.simulatedWriteFailures || 0) + 1;
        throw Object.assign(new Error(url.pathname === '/api/stocks/buy' ? 'Simulated trade failure. No trade was made.' : 'Simulated feedback failure. No issue was created.'), { fixtureExpected: true });
      }
      if (!['/api/user/online', '/api/notifs/read'].includes(url.pathname)) throw new Error(`Master fixture is read-only: ${method} ${url.pathname}`);
      data = { recordedLocally: true };
    } else if (Object.hasOwn(bootstrap, url.pathname)) data = bootstrap[url.pathname];
    else if (url.pathname === '/api/user/info' && !user.loggedIn) data = {};
    else data = readFixture(url, user);
    if (params.get('fixtureEmptyRead') === url.pathname) {
      if (['/api/dev/keys', '/api/dev/owner/keys', '/api/site/violations'].includes(url.pathname)) data = [];
      else if (url.pathname === '/api/crypto/admin/invoices') data = { invoices: [], total: 0, pageSize: 50 };
      else throw new Error('Unregistered empty-state contract');
    }
    return { data: JSON.parse(JSON.stringify(data)), status: 200, statusText: 'OK', headers: {}, config };
  } catch (error) {
    if (!error.fixtureExpected) state.unresolved.push(error.message);
    throw Object.assign(error, { config, response: { status: 501, data: error.message } });
  } finally { state.pending--; state.lastRequestAt = performance.now(); }
};
window.WebSocket = class {
  constructor() { throw new Error('Real sockets are disabled in the master fixture'); }
};
window.addEventListener('unhandledrejection', event => state.errors.push(String(event.reason?.stack || event.reason)));
window.addEventListener('error', event => { if (event.error) state.errors.push(event.error.stack || event.message); });
ReactDOM.render(<BrowserRouter><Main /></BrowserRouter>, document.getElementById('root'), () => { state.ready = true; });
