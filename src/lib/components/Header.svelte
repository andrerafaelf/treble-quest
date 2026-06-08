<script lang="ts">
  import { page } from '$app/stores';
  import brandIcon from '$lib/icons/favicon-32x32.png';

  const links = [
    { href: '/', label: 'Home' },
    { href: '/play', label: 'Play' },
    { href: '/leaderboard', label: 'Leaderboard' },
    { href: '/how-to-play', label: 'How to Play' },
    { href: '/support', label: 'Support' },
    { href: '/about', label: 'About' }
  ];
</script>

<header class="site-header">
  <a class="brand" href="/" aria-label="Treble Quest home">
    <img class="brand-mark" src={brandIcon} alt="" aria-hidden="true" />
    <span>Treble Quest</span>
  </a>
  <nav aria-label="Main navigation">
    {#each links as link}
      <a href={link.href} class:active={$page.url.pathname === link.href}>{link.label}</a>
    {/each}
  </nav>
</header>
