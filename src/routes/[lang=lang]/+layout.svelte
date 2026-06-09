<script lang="ts">
  import { isRTL } from '$lib/i18n';
  import type { LayoutData } from './$types';

  let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();

  $effect(() => {
    document.documentElement.lang = data.lang;
    document.documentElement.dir = isRTL(data.lang) ? 'rtl' : 'ltr';
  });
</script>

{@render children()}
