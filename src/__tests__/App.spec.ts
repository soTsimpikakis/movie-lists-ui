import { describe, it, expect, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

import HomeView from '@/views/HomeView.vue'

describe('HomeView', () => {
  it('shows the API health status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: 'ok' }), { status: 200 })),
    )
    const wrapper = mount(HomeView)
    await flushPromises()
    expect(wrapper.text()).toContain('API: ok')
  })
})
