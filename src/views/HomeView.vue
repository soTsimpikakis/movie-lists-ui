<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { api } from '@/api/client'

const status = ref('checking…')

onMounted(async () => {
  try {
    status.value = (await api<{ status: string }>('/health')).status
  } catch {
    status.value = 'unreachable'
  }
})
</script>

<template>
  <h1>Movie Club</h1>
  <p>API: {{ status }}</p>
</template>
