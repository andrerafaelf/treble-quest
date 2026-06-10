<script lang="ts">
  import { page } from '$app/stores';
  import { DEFAULT_LOCALE, normalizeLocale } from '$lib/i18n';
  import { t } from 'svelte-i18n';

  const lang = $derived(normalizeLocale($page.params.lang) ?? DEFAULT_LOCALE);
  const pathLang = $derived(lang.toLowerCase());
</script>

<footer class="site-footer">
  <p>{$t('footer.disclaimer')}</p>
  <div class="footer-links">
    <a href={`/${pathLang}/support`}>{$t('footer.support')}</a>
    <a href="https://ko-fi.com/treblequest" target="_blank" rel="noreferrer">Ko-fi</a>
    <a href="https://x.com/PlayTrebleQuest" target="_blank" rel="noreferrer">X</a>
    <a href={`/${pathLang}/privacy`}>{$t('footer.privacy')}</a>
  </div>
</footer>
