<script lang="ts">
  import { page } from '$app/stores';
  import type { SupportedLocale } from '$lib/i18n';
  import { t } from 'svelte-i18n';

  const lang = $derived<SupportedLocale>(($page.params.lang as SupportedLocale) ?? 'en');
</script>

<footer class="site-footer">
  <p>{$t('footer.disclaimer')}</p>
  <div class="footer-links">
    <a href={`/${lang}/support`}>{$t('footer.support')}</a>
    <a href="https://ko-fi.com/treblequest" target="_blank" rel="noreferrer">Ko-fi</a>
    <a href="https://x.com/PlayTrebleQuest" target="_blank" rel="noreferrer">X</a>
    <a href={`/${lang}/privacy`}>{$t('footer.privacy')}</a>
  </div>
</footer>
