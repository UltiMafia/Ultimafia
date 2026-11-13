import path from 'node:path';
import { defineConfig } from '@rsbuild/core';
import fixture from './rsbuild.route-review-test.config';

const branch = process.env.UI_AUDIT_BRANCH === 'master' ? 'master' : 'redesign';
const application = branch === 'master' ? (process.env.UI_AUDIT_MASTER || '/tmp/opencode/ultimafia-master') : path.resolve('..');
export default defineConfig({
  ...fixture,
  source: {
    ...fixture.source,
    entry: { index: './test/ui-audit/live.browser.jsx' },
    tsconfigPath: path.join(application, 'react_main/jsconfig.json'),
    alias: { 'audit-application': path.join(application, 'react_main/src') },
  },
  html: { ...fixture.html, title: `${branch}: existing local database, read-only UI audit` },
  output: { ...fixture.output, distPath: { root: `/tmp/opencode/ultimafia-live-audit-${branch}` } },
});
