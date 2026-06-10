<script lang="ts">
  // Re-render the same multiplayer page under a localized URL. Single source of
  // truth: /vs owns the markup; the [lang=lang]/vs route exists only so links
  // like /pt-PT/vs and the language switcher resolve.
  import VsPage from '../../vs/+page.svelte';
</script>

<VsPage />
