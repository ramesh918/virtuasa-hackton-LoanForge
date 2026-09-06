export type Role = 'applicant' | 'underwriter';

export interface Session {
  role: Role;
  applicantId?: string;
}

const STORAGE_KEY = 'loanforge.session';

/** Stub auth for this hackathon's scope — a role selector at login, no real identity provider. */
export function getSession(): Session | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as Session) : null;
}

export function setSession(session: Session): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}
