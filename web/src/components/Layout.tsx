import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clearSession, getSession } from '../auth/session';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const session = getSession();
  const navigate = useNavigate();

  function handleLogout() {
    clearSession();
    navigate('/login');
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="brand">LoanForge</span>
        {session && (
          <nav className="app-nav">
            {session.role === 'applicant' && (
              <>
                <Link to="/apply">Apply</Link>
                <span className="app-nav-badge">{session.applicantId}</span>
              </>
            )}
            {session.role === 'underwriter' && <Link to="/queue">Review Queue</Link>}
            <button className="link-button" onClick={handleLogout}>
              Switch role
            </button>
          </nav>
        )}
      </header>
      <main className="app-content">{children}</main>
    </div>
  );
}
