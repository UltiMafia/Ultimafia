import { defineConfig, loadEnv } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

const { publicVars } = loadEnv({ prefixes: ['REACT_APP_'] });

export default defineConfig({
  plugins: [pluginReact()],
  html: {
    template: './public/index.html',
  },
  entry: {
    index: './src/index.jsx',
  },
  output: {
    filename: '[name].bundle.js',
    distPath: {
      root: 'build',
    },
  },
  source: {
    define: publicVars,
    tsconfigPath: './jsconfig.json',
  },
  server: {
    port: 3001,
    proxy: {
      '/api': 'http://backend:3000',
      '/uploads': 'http://backend:3000',
    },
  },
});