import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import babel from '@rollup/plugin-babel';

export default defineConfig({
  plugins: [
    react(),
    babel({
      presets: ['@babel/preset-env', '@babel/preset-react'],
      extensions: ['.jsx', '.js'],
    }),
  ],
});
