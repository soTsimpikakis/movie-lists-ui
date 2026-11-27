<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import { api, errorText, post } from '@/api/client'
import type { AdminCommand, AdminJob } from '@/api/types'
import AppIcon from '@/components/AppIcon.vue'
import { useAsyncAction } from '@/composables/useAsyncAction'
import { formatDate, localDay } from '@/lib/format'

// Maintenance (design.md §6.6): the server commands as buttons, one at a time, each running in
// the background with its output shown here. Import awards stays on the laptop: it writes a
// seed file into the repo, which then gets committed and deployed.
const commands = ref<AdminCommand[]>([])
const jobs = ref<AdminJob[]>([])
const { run, busy: starting, error } = useAsyncAction()
const running = computed(() => jobs.value.find((j) => j.status === 'running') ?? null)
let timer: ReturnType<typeof setTimeout> | undefined
// Set when the page is left, so a request still in flight doesn't start polling again.
let left = false

async function refresh() {
  clearTimeout(timer)
  try {
    jobs.value = await api<AdminJob[]>('/admin/jobs')
  } catch (e) {
    error.value = errorText(e)
  }
  if (running.value && !left) timer = setTimeout(refresh, 2000)
}

async function start(command: string) {
  await run(() => post<AdminJob>('/admin/jobs', { command }))
  await refresh()
}

const time = (iso: string) =>
  `${formatDate(localDay(iso))} ${new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`

onMounted(async () => {
  try {
    commands.value = await api<AdminCommand[]>('/admin/commands')
  } catch (e) {
    error.value = errorText(e)
  }
  await refresh()
})
onBeforeUnmount(() => {
  left = true
  clearTimeout(timer)
})
</script>

<template>
  <section class="stack">
    <ul class="commands">
      <li v-for="c in commands" :key="c.command" class="command">
        <span>
          <strong>{{ c.command }}</strong>
          <span class="muted">{{ c.description }}</span>
        </span>
        <button
          type="button"
          class="small"
          :disabled="Boolean(running) || starting"
          @click="start(c.command)"
        >
          <AppIcon name="forward" :size="14" /> Run
        </button>
      </li>
    </ul>
    <p class="muted">
      Importing Oscar awards writes a seed file into the repo, so it stays on your laptop:
      <code>uv run python -m app.cli import-awards …</code>, commit, deploy, then Run sync-sets
      here.
    </p>
    <p v-if="error" class="error">{{ error }}</p>

    <h3 class="runs-title">Last runs</h3>
    <p v-if="!jobs.length" class="muted">Nothing has run yet.</p>
    <article v-for="j in jobs" :key="j.id" class="run" :class="j.status">
      <header>
        <strong>{{ j.command }}</strong>
        <span class="status">{{ j.status === 'running' ? 'Running…' : j.status }}</span>
        <span class="muted">{{ time(j.started_at) }}</span>
      </header>
      <pre v-if="j.output">{{ j.output }}</pre>
    </article>
  </section>
</template>

<style scoped>
.commands {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.6rem;
}

.command {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border: 2px solid var(--line);
  border-radius: 0.6rem;
  background: var(--card);
}

.command > span {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.runs-title {
  margin: 0.5rem 0 0;
}

.run {
  border: 2px solid var(--line);
  border-radius: 0.6rem;
  background: var(--card);
  overflow: hidden;
}

.run header {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: baseline;
  padding: 0.6rem 1rem;
}

.status {
  font-family: var(--mono);
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.done .status {
  color: var(--good, inherit);
}

.failed .status {
  color: var(--error);
}

pre {
  margin: 0;
  padding: 0.6rem 1rem;
  max-height: 16rem;
  overflow: auto;
  border-top: 2px dashed var(--line);
  font-family: var(--mono);
  font-size: 0.8rem;
  white-space: pre-wrap;
}

code {
  font-family: var(--mono);
  font-size: 0.85em;
}
</style>
