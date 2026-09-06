import { getSession } from '../auth/session';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, body: unknown) {
    super(`API request failed with status ${status}`);
    this.status = status;
    this.body = body;
  }
}

/** Sends the current session's role/applicant id as headers on every request (NFR-04 stub auth). */
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const session = getSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (session?.role) headers['x-role'] = session.role;
  if (session?.applicantId) headers['x-applicant-id'] = session.applicantId;

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const body = await response.json().catch(() => undefined);

  if (!response.ok) {
    throw new ApiError(response.status, body);
  }
  return body as T;
}

export const api = {
  submitApplication: (dto: {
    applicantId: string;
    productId: string;
    amount: string;
    tenureMonths: number;
    purpose: string;
    income: string;
    employmentType: string;
  }) => request('/applications', { method: 'POST', body: JSON.stringify(dto) }),

  getApplication: (applicationId: string) => request(`/applications/${applicationId}`),

  getOffer: (applicationId: string) => request(`/applications/${applicationId}/offer`),

  acceptOffer: (applicationId: string) =>
    request(`/applications/${applicationId}/accept-offer`, { method: 'PATCH' }),

  getQueue: () => request('/queue'),

  decide: (applicationId: string, dto: { actor: string; decision: string; reason: string }) =>
    request(`/applications/${applicationId}/decision`, { method: 'PATCH', body: JSON.stringify(dto) }),
};
