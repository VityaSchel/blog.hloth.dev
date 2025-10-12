// @ts-check

import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

import svelte from '@astrojs/svelte';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://blog.hloth.dev',
  integrations: [sitemap(), svelte()],

  vite: {
    plugins: [tailwindcss()],
  },
});