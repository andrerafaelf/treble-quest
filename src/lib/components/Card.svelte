<script lang="ts">
  let { tone = 'default', children }: { tone?: 'default' | 'quiet' | 'accent'; children: import('svelte').Snippet } = $props();
</script>

<section class={`card ${tone}`}>
  {@render children()}
</section>
