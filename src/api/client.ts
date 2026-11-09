export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

async function errorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json()
    // FastAPI sends {detail: string} for HTTPException and {detail: [...]} for validation errors.
    if (typeof body.detail === 'string') return body.detail
    if (Array.isArray(body.detail) && body.detail[0]?.msg) return body.detail[0].msg
  } catch {
    // not JSON
  }
  return `Something went wrong (${response.status})`
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${path}`, {
    credentials: 'same-origin',
    ...init,
    headers: { 'Content-Type': 'application/json', ...init.headers },
  })
  if (!response.ok) {
    throw new ApiError(response.status, await errorMessage(response))
  }
  return response.status === 204 ? (undefined as T) : response.json()
}

function send<T>(method: string, path: string, body?: unknown): Promise<T> {
  return api<T>(path, { method, body: body === undefined ? undefined : JSON.stringify(body) })
}

export const post = <T>(path: string, body?: unknown) => send<T>('POST', path, body)
export const patch = <T>(path: string, body: unknown) => send<T>('PATCH', path, body)
export const put = <T>(path: string, body?: unknown) => send<T>('PUT', path, body)
export const del = <T>(path: string) => send<T>('DELETE', path)
