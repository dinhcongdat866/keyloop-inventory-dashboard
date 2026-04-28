import type { ApiError } from '@/types/api';

export const API_BASE = '/api';

export class ApiClientError extends Error {
  status: number;
  code: string;
  details?: Record<string, unknown>;

  constructor(status: number, body: ApiError) {
    super(body.message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = body.code;
    this.details = body.details;
  }
}

async function parseError(response: Response): Promise<ApiClientError> {
  let body: ApiError;
  try {
    body = (await response.json()) as ApiError;
  } catch {
    body = { code: 'UNKNOWN_ERROR', message: response.statusText || 'Request failed' };
  }
  return new ApiClientError(response.status, body);
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  return (await response.json()) as T;
}
