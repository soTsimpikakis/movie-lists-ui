import { describe, expect, it } from 'vitest'

import { ApiError } from '@/api/client'
import { useAsyncAction } from '@/composables/useAsyncAction'

describe('useAsyncAction', () => {
  it('is busy while the work runs and reports success', async () => {
    const { run, busy, error } = useAsyncAction()
    let during = false
    const ok = await run(async () => {
      during = busy.value
    })
    expect(ok).toBe(true)
    expect(during).toBe(true)
    expect(busy.value).toBe(false)
    expect(error.value).toBe('')
  })

  it("keeps the error's message, and clears it on the next run", async () => {
    const { run, busy, error } = useAsyncAction()
    expect(
      await run(async () => {
        throw new ApiError(409, 'Taken')
      }),
    ).toBe(false)
    expect(error.value).toBe('Taken')
    expect(busy.value).toBe(false)

    await run(() => Promise.reject('plain'))
    expect(error.value).toBe('plain')

    await run(async () => {})
    expect(error.value).toBe('')
  })
})
