import {
  nextTick,
  onBeforeUnmount,
  onMounted,
  toValue,
  watch,
  type MaybeRefOrGetter,
  type Ref,
} from 'vue'

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), ' +
  'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Keyboard handling for a modal dialog: focus moves into it when it opens (onto the dialog
 * itself, which needs tabindex="-1"), Tab stays inside it, Escape calls `onEscape`, and focus
 * goes back where it was when it closes.
 */
export function useDialogFocus(
  root: Ref<HTMLElement | null>,
  open: MaybeRefOrGetter<boolean>,
  onEscape: () => void,
) {
  let previous: HTMLElement | null = null

  function onKey(event: KeyboardEvent) {
    if (!toValue(open) || !root.value) return
    if (event.key === 'Escape') {
      event.preventDefault()
      onEscape()
      return
    }
    if (event.key !== 'Tab') return
    const items = [...root.value.querySelectorAll<HTMLElement>(FOCUSABLE)]
    if (!items.length) return
    const first = items[0]!
    const last = items[items.length - 1]!
    const inside = root.value.contains(document.activeElement)
    if (event.shiftKey && (document.activeElement === first || !inside)) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && (document.activeElement === last || !inside)) {
      event.preventDefault()
      first.focus()
    }
  }

  watch(
    () => toValue(open),
    async (isOpen, wasOpen) => {
      if (isOpen && !wasOpen) {
        previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
        await nextTick()
        root.value?.focus()
      } else if (!isOpen && wasOpen) {
        previous?.focus()
        previous = null
      }
    },
    { immediate: true },
  )

  onMounted(() => document.addEventListener('keydown', onKey))
  onBeforeUnmount(() => {
    document.removeEventListener('keydown', onKey)
    if (toValue(open)) previous?.focus()
  })
}
