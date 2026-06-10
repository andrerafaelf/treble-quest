<script lang="ts">
  import { page } from '$app/stores';
  import { DEFAULT_LOCALE, normalizeLocale, SUPPORTED_LOCALES, type SupportedLocale } from '$lib/i18n';
  import brandIcon from '$lib/icons/favicon-32x32.png';
  import { t } from 'svelte-i18n';

  const lang = $derived<SupportedLocale>(normalizeLocale($page.params.lang) ?? DEFAULT_LOCALE);
  const pathLang = $derived(lang.toLowerCase());

  const links = $derived([
    { href: `/${pathLang}`, label: $t('nav.home') },
    { href: `/${pathLang}/play`, label: $t('nav.play') },
    { href: `/${pathLang}/vs`, label: $t('nav.versus') },
    { href: `/${pathLang}/leaderboard`, label: $t('nav.leaderboard') },
    { href: `/${pathLang}/how-to-play`, label: $t('nav.how_to_play') },
    { href: `/${pathLang}/support`, label: $t('nav.support') },
    { href: `/${pathLang}/about`, label: $t('nav.about') }
  ]);

  const LANG_FLAGS: Record<SupportedLocale, string> = {
    en: '🇬🇧',
    es: '🇪🇸',
    ar: '🇸🇦',
    'pt-PT': '🇵🇹',
    'pt-BR': '🇧🇷',
    de: '🇩🇪',
    it: '🇮🇹',
    id: '🇮🇩',
    nl: '🇳🇱'
  };

  const LANG_LABELS: Record<SupportedLocale, string> = {
    en: 'English',
    es: 'Español',
    ar: 'العربية',
    'pt-PT': 'Português (PT)',
    'pt-BR': 'Português (BR)',
    de: 'Deutsch',
    it: 'Italiano',
    id: 'Indonesia',
    nl: 'Nederlands'
  };

  let dropdownOpen = $state(false);

  function toggleDropdown() {
    dropdownOpen = !dropdownOpen;
  }

  function closeDropdown() {
    dropdownOpen = false;
  }
</script>

<svelte:window onclick={(e) => {
  if (!(e.target as HTMLElement).closest('.lang-switcher')) closeDropdown();
}} />

<header class="site-header">
  <a class="brand" href={`/${pathLang}`} aria-label={$t('nav.brand_aria')}>
    <img class="brand-mark" src={brandIcon} alt="" aria-hidden="true" />
    <span>Treble Quest</span>
  </a>
  <nav aria-label="Main navigation">
    {#each links as link}
      <a href={link.href} class:active={$page.url.pathname === link.href}>{link.label}</a>
    {/each}
  </nav>
  <div class="lang-switcher" aria-label={$t('lang_switcher.label')}>
    <button
      class="lang-current"
      onclick={toggleDropdown}
      aria-expanded={dropdownOpen}
      aria-haspopup="listbox"
      type="button"
    >
      <span class="lang-flag">{LANG_FLAGS[lang]}</span>
      <span class="lang-chevron" class:open={dropdownOpen}>▾</span>
    </button>
    {#if dropdownOpen}
      <div class="lang-dropdown" role="listbox" aria-label={$t('lang_switcher.label')}>
        {#each SUPPORTED_LOCALES as locale}
          <a
            href={$page.url.pathname.replace(/^\/[^/]+/, `/${locale.toLowerCase()}`)}
            role="option"
            aria-selected={lang === locale}
            class:active={lang === locale}
            onclick={closeDropdown}
          >
            <span class="lang-flag">{LANG_FLAGS[locale]}</span>
            <span class="lang-name">{LANG_LABELS[locale]}</span>
          </a>
        {/each}
      </div>
    {/if}
  </div>
</header>

<style>
  .lang-switcher {
    position: relative;
    margin-inline-start: auto;
    padding-inline-start: 0.75rem;
  }

  .lang-current {
    display: flex;
    align-items: center;
    gap: 3px;
    background: none;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 6px;
    padding: 4px 7px;
    cursor: pointer;
    color: var(--text, #e2e8f0);
    transition: border-color 0.15s, background 0.15s;
  }

  .lang-current:hover {
    border-color: rgba(255, 255, 255, 0.25);
    background: rgba(255, 255, 255, 0.05);
  }

  .lang-flag {
    font-size: 1rem;
    line-height: 1;
  }

  .lang-chevron {
    font-size: 0.6rem;
    color: var(--text-muted, #64748b);
    transition: transform 0.15s;
    display: inline-block;
  }

  .lang-chevron.open {
    transform: rotate(180deg);
  }

  .lang-dropdown {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    min-width: 140px;
    background: #1a2030;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 8px;
    padding: 4px;
    z-index: 100;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  }

  .lang-dropdown a {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 10px;
    border-radius: 5px;
    color: var(--text-muted, #94a3b8);
    text-decoration: none;
    font-size: 0.82rem;
    font-weight: 500;
    transition: background 0.1s, color 0.1s;
  }

  .lang-dropdown a:hover {
    background: rgba(255, 255, 255, 0.07);
    color: var(--text, #e2e8f0);
  }

  .lang-dropdown a.active {
    color: var(--accent, #e63946);
    background: rgba(230, 57, 70, 0.08);
    font-weight: 700;
  }

  .lang-name {
    flex: 1;
  }
</style>
