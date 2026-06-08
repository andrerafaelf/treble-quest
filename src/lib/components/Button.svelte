<script lang="ts">
  import type { HTMLButtonAttributes } from 'svelte/elements';

  type Props = HTMLButtonAttributes & {
    href?: string;
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    full?: boolean;
    children: import('svelte').Snippet;
  };

  let { href, variant = 'primary', full = false, children, ...rest }: Props = $props();
</script>

{#if href}
  <a class:full class={`button ${variant}`} href={href}>{@render children()}</a>
{:else}
  <button class:full class={`button ${variant}`} {...rest}>{@render children()}</button>
{/if}
