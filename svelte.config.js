import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const LOCALES = ['en', 'es', 'ar', 'pt-PT', 'pt-BR', 'de', 'it', 'id', 'nl'];
const LOCALE_PATHS = LOCALES.map((locale) => locale.toLowerCase());
const ROUTES = ['', '/play', '/vs', '/result', '/leaderboard', '/about', '/how-to-play', '/privacy', '/support'];

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: undefined,
      precompress: false,
      strict: true
    }),
    prerender: {
      entries: [
        '/',
        ...ROUTES.filter((r) => r !== '').map((route) => route),
        ...LOCALE_PATHS.flatMap((lang) => ROUTES.map((route) => `/${lang}${route}`))
      ]
    }
  }
};

export default config;
