import { defineStore } from 'pinia'
import { ref } from 'vue'

import type { RewardEvent } from '@/api/types'

/** Reward cards waiting to be celebrated (design.md §6.3). Any screen that logs pushes here. */
export const useRewardsStore = defineStore('rewards', () => {
  const queue = ref<RewardEvent[]>([])

  function push(events: RewardEvent[]) {
    queue.value.push(...events)
  }

  function next() {
    queue.value.shift()
  }

  function clear() {
    queue.value = []
  }

  return { queue, push, next, clear }
})
