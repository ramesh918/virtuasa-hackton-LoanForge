import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { getSession } from './session';
import type { Role } from './session';

interface RoleGuardProps {
  allow: Role;
  children: ReactNode;
}

/** Blocks underwriter routes from applicant role and vice versa (NFR-04, UI-level convenience only — the real enforcement is server-side). */
export function RoleGuard({ allow, children }: RoleGuardProps) {
  const session = getSession();

  if (!session) {
    return <Navigate to="/login" replace />;
  }
  if (session.role !== allow) {
    return <Navigate to={session.role === 'underwriter' ? '/queue' : '/apply'} replace />;
  }
  return children;
}
