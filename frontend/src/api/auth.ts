import { apiRequest } from './client'

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  fullName: string
  role: string
}

export interface Claim {
  type: string
  value: string
}

export const authApi = {
  login: (request: LoginRequest) =>
    apiRequest<AuthResponse>('/api/auth/login', { method: 'POST', body: request, auth: false }),

  me: (signal?: AbortSignal) => apiRequest<Claim[]>('/api/auth/me', { signal }),
}

export const authKeys = {
  me: (token: string) => ['auth', 'me', token] as const,
}

/**
 * ASP.NET may emit claims under short JWT names ("role") or long WS-* URIs
 * (".../claims/role") depending on claim mapping, so match either form.
 */
export function findClaim(claims: Claim[], shortName: string): string | undefined {
  const suffix = `/${shortName}`
  return claims.find((c) => c.type === shortName || c.type.endsWith(suffix))?.value
}
