<script lang="ts">
  import { page } from '$app/stores';
  import brandIcon from '$lib/icons/favicon-32x32.png';
  import { SUPPORTED_LOCALES, type SupportedLocale } from '$lib/i18n';
  import { t } from 'svelte-i18n';

  const lang = $derived<SupportedLocale>(($page.params.lang as SupportedLocale) ?? 'en');

  const links = $derived([
    { href: `/${lang}`, label: $t('nav.home') },
    { href: `/${lang}/play`, label: $t('nav.play') },
    { href: `/${lang}/leaderboard`, label: $t('nav.leaderboard') },
    { href: `/${lang}/how-to-play`, label: $t('nav.how_to_play') },
    { href: `/${lang}/support`, label: $t('nav.support') },
    { href: `/${lang}/about`, label: $t('nav.about') }
  ]);

  const LANG_LABELS: Record<SupportedLocale, string> = {
    en: 'EN',
    es: 'ES',
    ar: 'AR',
    'pt-PT': 'PT',
    de: 'DE',
    it: 'IT',
    id: 'ID'
  };
</script>

<header class="site-header">
  <a class="brand" href={`/${lang}`} aria-label={$t('nav.brand_aria')}>
    <img class="brand-mark" src={brandIcon} alt="" aria-hidden="true" />
    <span>Treble Quest</span>
  </a>
  <nav aria-label="Main navigation">
    {#each links as link}
      <a href={link.href} class:active={$page.url.pathname === link.href}>{link.label}</a>
    {/each}
  </nav>
  <div class="lang-switcher" aria-label={$t('lang_switcher.label')}>
    {#each SUPPORTED_LOCALES as locale}
      <a
        href={$page.url.pathname.replace(/^\/[^/]+/, `/${locale}`)}
        class:active={lang === locale}
        aria-current={lang === locale ? 'true' : undefined}
      >{LANG_LABELS[locale]}</a>
    {/each}
  </div>
</header>

<style>
  .lang-switcher {
    display: flex;
    gap: 2px;
    margin-inline-start: auto;
    padding-inline-start: 1rem;
  }

  .lang-switcher a {
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    padding: 3px 6px;
    border-radius: 4px;
    color: var(--text-muted, #64748b);
    text-decoration: none;
    transition: color 0.15s, background 0.15s;
  }

  .lang-switcher a:hover {
    color: var(--text, #e2e8f0);
    background: rgba(255, 255, 255, 0.06);
  }

  .lang-switcher a.active {
    color: var(--accent, #e63946);
    background: rgba(230, 57, 70, 0.1);
  }
</style>
