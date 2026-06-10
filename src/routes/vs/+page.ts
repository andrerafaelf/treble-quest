// The multiplayer lobby is an inherently client-only page: it relies on
// WebSockets, sessionStorage, and the URL's query string (?code=). Rendering it
// during static prerender both serves no purpose and breaks the build, because
// SvelteKit forbids reading url.searchParams while prerendering. Prerender the
// static shell but skip SSR so the component logic only runs in the browser.
export const prerender = true;
export const ssr = false;
