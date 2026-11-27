import { computed, ref, watch, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { del, post, put } from '@/api/client'
import { useAsyncAction } from '@/composables/useAsyncAction'
import { keyFrom } from '@/lib/eggs'

/** An egg or a mission as the admin API returns it. */
interface AdminRecord {
  id: number
  key_locked: boolean
}

/**
 * What the egg and mission editors share (design.md §6.6): the record behind the page (null
 * for a new one), saving it as a draft or an edit, enabling, switching off and deleting it,
 * with one busy flag, error and status line for all of them. The key follows the title until
 * it's typed by hand (call `keyEdited`) or locked.
 */
export function useAdminRecord<R extends AdminRecord>(options: {
  /** The API path: "/admin/eggs". */
  path: string
  /** Route names: the record's page, and the list to go back to after a delete. */
  routes: { one: string; list: string }
  form: { title: string; key: string }
  /** Copy a loaded record into the form. */
  fill: (from: R) => void
  /** The status line after switching it off. */
  switchedOff?: string
}) {
  const route = useRoute()
  const router = useRouter()
  const { run, busy, error } = useAsyncAction()
  const status = ref('')

  const id = computed(() => (route.params.id ? Number(route.params.id) : null))
  const record = ref<R | null>(null) as Ref<R | null>

  const keyTouched = ref(false)
  watch(
    () => options.form.title,
    (title) => {
      if (!keyTouched.value && !record.value?.key_locked) options.form.key = keyFrom(title)
    },
  )
  const keyEdited = () => (keyTouched.value = true)

  function load(from: R) {
    record.value = from
    keyTouched.value = true
    options.fill(from)
  }

  async function act(work: () => Promise<unknown>, done: string) {
    status.value = ''
    if (await run(work)) status.value = done
  }

  const save = (body: unknown) =>
    act(async () => {
      if (id.value === null) {
        const created = await post<R>(options.path, body)
        load(created)
        await router.replace({ name: options.routes.one, params: { id: created.id } })
      } else load(await put<R>(`${options.path}/${id.value}`, body))
    }, 'Saved')

  const enable = () =>
    act(async () => load(await post<R>(`${options.path}/${id.value}/enable`)), 'Live')
  const disable = () =>
    act(
      async () => load(await post<R>(`${options.path}/${id.value}/disable`)),
      options.switchedOff ?? 'Switched off',
    )
  const remove = () =>
    act(async () => {
      await del(`${options.path}/${id.value}`)
      await router.push({ name: options.routes.list })
    }, 'Deleted')

  return {
    id,
    record,
    load,
    keyEdited,
    act,
    busy,
    error,
    status,
    save,
    enable,
    disable,
    remove,
  }
}
