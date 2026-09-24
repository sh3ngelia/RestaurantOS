/** Shape of an RFC 7807 ProblemDetails body as returned by ASP.NET Core. */
export interface ProblemDetails {
  type?: string
  title?: string
  detail?: string
  status?: number
  /** Present on validation failures (ValidationProblemDetails). */
  errors?: Record<string, string[]>
}

/** Status 0 means the request never reached the server (offline, CORS, API down). */
export const NETWORK_ERROR_STATUS = 0

export class ApiError extends Error {
  readonly status: number
  readonly title: string
  readonly problem: ProblemDetails | null

  constructor(status: number, title: string, message: string, problem: ProblemDetails | null = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.title = title
    this.problem = problem
  }

  get isNetworkError() {
    return this.status === NETWORK_ERROR_STATUS
  }
}

function isProblemDetails(value: unknown): value is ProblemDetails {
  return typeof value === 'object' && value !== null && ('title' in value || 'detail' in value || 'status' in value)
}

const FALLBACK_MESSAGES: Record<number, string> = {
  400: 'The request was not valid.',
  401: 'You need to sign in to continue.',
  403: "You don't have permission to do that.",
  404: 'The requested resource was not found.',
  429: 'Too many requests. Please wait a moment and try again.',
}

/** Builds an ApiError from a failed response, preferring the server's `detail`. */
export function toApiError(status: number, body: unknown): ApiError {
  const problem = isProblemDetails(body) ? body : null
  const validationMessages = problem?.errors ? Object.values(problem.errors).flat() : []

  const message =
    problem?.detail?.trim() ||
    validationMessages.join(' ') ||
    FALLBACK_MESSAGES[status] ||
    (status >= 500 ? 'Something went wrong on our side. Please try again.' : 'The request failed.')

  return new ApiError(status, problem?.title ?? 'Request failed', message, problem)
}

export interface MappedValidationErrors<F extends string> {
  /** First message per form field. */
  fields: Partial<Record<F, string>>
  /** Messages whose key didn't match a form field; show these at form level. */
  unmatched: string[]
}

/**
 * Maps a 400 ValidationProblemDetails onto form fields. The API keys errors by
 * PascalCase property name ("Price", "CategoryId"); model-binding errors can also
 * arrive as JSON paths ("$.price"). Both are matched case-insensitively.
 * `aliases` renames server properties that differ from the form's, e.g. { NewPrice: 'price' }.
 */
export function mapValidationErrors<F extends string>(
  error: unknown,
  fields: readonly F[],
  aliases: Record<string, F> = {},
): MappedValidationErrors<F> {
  const result: MappedValidationErrors<F> = { fields: {}, unmatched: [] }
  const errors = error instanceof ApiError && error.status === 400 ? error.problem?.errors : undefined
  if (!errors) return result

  const lookup = new Map<string, F>(fields.map((f) => [f.toLowerCase(), f]))
  for (const [alias, field] of Object.entries(aliases)) lookup.set(alias.toLowerCase(), field)

  for (const [key, messages] of Object.entries(errors)) {
    const message = messages[0]
    if (!message) continue
    const field = lookup.get(key.replace(/^\$\./, '').toLowerCase())
    if (field && !result.fields[field]) result.fields[field] = message
    else if (!field) result.unmatched.push(message)
  }
  return result
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error && error.message) return error.message
  return 'Something went wrong. Please try again.'
}
