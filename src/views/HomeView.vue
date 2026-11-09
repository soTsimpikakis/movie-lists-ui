<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { api } from '@/api/client'
import type { SearchResult, Watch } from '@/api/types'
import LogSheet from '@/components/LogSheet.vue'
import PosterImage from '@/components/PosterImage.vue'
import TmdbCredit from '@/components/TmdbCredit.vue'
import { formatDate, ordinal } from '@/lib/format'
import { useAuthStore } from '@/stores/auth'
import { useReactionsStore } from '@/stores/reactions'

const auth = useAuthStore()
const reactions = useReactionsStore()
const router = useRouter()

const watches = ref<Watch[] | null>(null)
const query = ref('')
const results = ref<SearchResult[]>([])
const searching = ref(false)
const searchError = ref('')
const picked = ref<SearchResult | null>(null)
const toast = ref('')

const searchActive = computed(() => query.value.trim().length >= 2)

async function loadWatches() {
  watches.value = await api<Watch[]>('/watches')
}

onMounted(() => {
  loadWatches()
  reactions.load()
})

let debounce: ReturnType<typeof setTimeout> | undefined
let inFlight: AbortController | undefined

watch(query, (value) => {
  clearTimeout(debounce)
  inFlight?.abort()
  const q = value.trim()
  if (q.length < 2) {
    results.value = []
    searching.value = false
    return
  }
  searching.value = true
  debounce = setTimeout(async () => {
    const controller = (inFlight = new AbortController())
    try {
      results.value = await api<SearchResult[]>(`/films/search?q=${encodeURIComponent(q)}`, {
        signal: controller.signal,
      })
      searchError.value = ''
    } catch (e) {
      if (controller.signal.aborted) return
      searchError.value = e instanceof Error ? e.message : String(e)
    }
    searching.value = false
  }, 250)
})

async function onLogged(logged: Watch) {
  picked.value = null
  query.value = ''
  toast.value = `Logged ${logged.film.title}`
  setTimeout(() => (toast.value = ''), 2500)
  await loadWatches()
}

async function logout() {
  await auth.logout()
  await router.push({ name: 'login' })
}
</script>

<template>
  <main class="page">
    <header class="topbar">
      <h1>Movie Club</h1>
      <button class="link" @click="logout">Log out</button>
    </header>

    <input
      v-model="query"
      class="search"
      type="search"
      placeholder="Log a film…"
      enterkeyhint="search"
      autocomplete="off"
      aria-label="Search films to log"
    />

    <section v-if="searchActive" aria-live="polite">
      <p v-if="searchError" class="error">{{ searchError }}</p>
      <p v-else-if="searching && !results.length" class="muted">Searching…</p>
      <p v-else-if="!results.length" class="muted">No films found.</p>
      <ul class="results">
        <li v-for="film in results" :key="film.tmdb_id">
          <button class="result" @click="picked = film">
            <PosterImage :path="film.poster_path" :title="film.title" />
            <span class="result-title">{{ film.title }}</span>
            <span class="muted small">
              {{ film.year ?? '' }}
              <template v-if="film.watch_count"> · seen ×{{ film.watch_count }}</template>
            </span>
          </button>
        </li>
      </ul>
    </section>

    <section v-else>
      <p v-if="watches === null" class="muted">Loading…</p>
      <p v-else-if="!watches.length" class="muted">
        Nothing logged yet. Search for the last film you watched.
      </p>
      <template v-else>
        <h2 class="list-heading">
          Watched <span class="muted">· {{ watches.length }}</span>
        </h2>
        <ul class="watches">
          <li v-for="w in watches" :key="w.id">
            <RouterLink class="watch" :to="{ name: 'watch', params: { id: w.id } }">
              <PosterImage
                class="thumb"
                :path="w.film.poster_path"
                :title="w.film.title"
                size="w92"
              />
              <span class="watch-main">
                <span class="watch-title">
                  {{ w.film.title }}
                  <span v-if="w.film.favourite" class="heart" aria-label="Favourite">♥</span>
                </span>
                <span class="muted small">
                  {{ w.watched_on ? formatDate(w.watched_on) : 'Before Movie Club' }}
                  <template v-if="w.watch_number > 1">
                    · {{ ordinal(w.watch_number) }} watch</template
                  >
                </span>
              </span>
              <span
                v-if="w.reaction"
                class="reaction"
                :title="reactions.byKey.get(w.reaction)?.label"
              >
                {{ reactions.byKey.get(w.reaction)?.emoji }}
              </span>
            </RouterLink>
          </li>
        </ul>
      </template>
    </section>

    <TmdbCredit />

    <LogSheet v-if="picked" :film="picked" @logged="onLogged" @close="picked = null" />
    <p v-if="toast" class="toast" role="status">{{ toast }}</p>
  </main>
</template>

<style scoped>
.search {
  width: 100%;
  margin-bottom: 1rem;
}

ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.results {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(6.5rem, 1fr));
  gap: 1rem 0.75rem;
}

.result {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  width: 100%;
  padding: 0;
  background: none;
  color: var(--fg);
  text-align: left;
  font-weight: 400;
}

.result-title {
  font-size: 0.85rem;
  line-height: 1.25;
}

.small {
  font-size: 0.8rem;
}

.list-heading {
  font-size: 1rem;
  margin: 0.5rem 0;
}

.watches li + li {
  border-top: 1px solid var(--border);
}

.watch {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0;
  color: inherit;
  text-decoration: none;
}

.thumb {
  width: 2.75rem;
  flex: none;
}

.watch-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.watch-title {
  font-weight: 500;
}

.heart {
  color: var(--accent);
}

.reaction {
  font-size: 1.5rem;
}

.toast {
  position: fixed;
  left: 50%;
  bottom: calc(1.5rem + env(safe-area-inset-bottom));
  transform: translateX(-50%);
  margin: 0;
  padding: 0.6rem 1rem;
  border-radius: 999px;
  background: var(--fg);
  color: var(--bg);
  font-weight: 500;
}
</style>
