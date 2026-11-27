<script setup lang="ts">
import type { PublishStatus } from '@/api/types'

// An egg's or a mission's status in the admin view: draft, live (mustard) or off (muted).
defineProps<{ status: PublishStatus }>()
</script>

<template>
  <span class="pill" :class="status">{{ status }}</span>
</template>
