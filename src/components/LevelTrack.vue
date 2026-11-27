<script setup lang="ts">
// One row of a Journey track (Expertise, Niches, Landmarks): a name, whatever goes on its
// right (pips, a count) in the slot, a progress bar, and the text under it. With a `label`,
// the row is read as that and the text under the bar is hidden from screen readers.
defineProps<{
  name: string
  /** 0–100. */
  percent: number
  from: string
  to: string
  label?: string
}>()
</script>

<template>
  <li class="level-row" :aria-label="label">
    <span class="level-top">
      <span class="level-name">{{ name }}</span>
      <slot />
    </span>
    <span class="bar" aria-hidden="true">
      <span class="fill" :style="{ width: `${percent}%` }" />
    </span>
    <span class="level-meta" :aria-hidden="label ? 'true' : undefined">
      <span>{{ from }}</span>
      <span>{{ to }}</span>
    </span>
  </li>
</template>

<style scoped>
.level-row {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.7rem 0;
}

.level-row + .level-row {
  border-top: 2px dashed var(--ticket-line);
}

.level-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.level-name {
  font-family: var(--ticket-title);
  font-weight: 700;
}

.bar {
  height: 0.45rem;
  border-radius: 999px;
  background: rgb(120 80 30 / 0.18);
  overflow: hidden;
}

/* The list sets --track-fill for another colour (Landmarks are mustard). */
.fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--track-fill, var(--red));
}

.level-meta {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  font-family: var(--ticket-type);
  font-size: 0.75rem;
  color: var(--parchment-muted);
}
</style>
