import { defineStore } from 'pinia'
import { ref } from 'vue'

import type { RewardCard, RewardEvent } from '@/api/types'
import { toCards } from '@/lib/rewardCards'
import { useAuthStore } from '@/stores/auth'

/** Reward cards waiting to be celebrated (design.md §6.3). Any screen that logs pushes here.
 * People who turned celebrations off still earn everything; they just don't get the cards. */
export const useRewardsStore = defineStore('rewards', () => {
  const queue = ref<RewardCard[]>([])
  const auth = useAuthStore()

  function push(events: RewardEvent[]) {
    if (auth.user?.celebrations === false) return
    queue.value.push(...toCards(events))
  }

  function next() {
    queue.value.shift()
  }

  function clear() {
    queue.value = []
  }

  return { queue, push, next, clear }
})
