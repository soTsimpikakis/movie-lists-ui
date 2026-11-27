import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'

import { useDialogFocus } from '@/composables/useDialogFocus'

const open = ref(false)
const onEscape = vi.fn()

// A button that opens a dialog with two buttons in it, as the app's sheets do.
const Harness = defineComponent({
  setup() {
    const dialog = ref<HTMLElement | null>(null)
    useDialogFocus(dialog, open, onEscape)
    return () =>
      h('div', [
        h('button', { id: 'opener' }, 'Open'),
        open.value
          ? h('div', { id: 'dialog', ref: dialog, tabindex: '-1', role: 'dialog' }, [
              h('button', { id: 'first' }, 'First'),
              h('button', { id: 'disabled', disabled: true }, 'Disabled'),
              h('button', { id: 'last' }, 'Last'),
            ])
          : null,
      ])
  },
})

const byId = (id: string) => document.getElementById(id)!

function press(key: string, shiftKey = false): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, shiftKey, bubbles: true, cancelable: true })
  document.dispatchEvent(event)
  return event
}

async function settle() {
  await nextTick()
  await nextTick()
}

async function opened() {
  const wrapper = mount(Harness, { attachTo: document.body })
  byId('opener').focus()
  open.value = true
  await settle()
  return wrapper
}

describe('useDialogFocus', () => {
  afterEach(() => {
    open.value = false
    onEscape.mockReset()
    document.body.innerHTML = ''
  })

  it('moves focus onto the dialog when it opens', async () => {
    const wrapper = await opened()
    expect(document.activeElement).toBe(byId('dialog'))
    wrapper.unmount()
  })

  it('calls the handler on Escape', async () => {
    const wrapper = await opened()
    const event = press('Escape')
    expect(onEscape).toHaveBeenCalledOnce()
    expect(event.defaultPrevented).toBe(true)
    wrapper.unmount()
  })

  it('keeps Tab inside the dialog, skipping disabled buttons', async () => {
    const wrapper = await opened()
    byId('last').focus()
    expect(press('Tab').defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(byId('first'))
    expect(press('Tab', true).defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(byId('last'))
    // In the middle, Tab is left to the browser.
    byId('first').focus()
    expect(press('Tab').defaultPrevented).toBe(false)
    wrapper.unmount()
  })

  it('gives focus back when it closes', async () => {
    const wrapper = await opened()
    byId('first').focus()
    open.value = false
    await settle()
    expect(document.activeElement).toBe(byId('opener'))
    wrapper.unmount()
  })

  it('ignores keys while closed and after unmounting', async () => {
    const wrapper = mount(Harness, { attachTo: document.body })
    press('Escape')
    wrapper.unmount()
    open.value = true
    press('Escape')
    expect(onEscape).not.toHaveBeenCalled()
  })
})
