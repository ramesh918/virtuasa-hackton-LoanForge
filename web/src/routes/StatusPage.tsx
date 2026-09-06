import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, ApiError } from '../api/client';

interface ApplicationView {
  applicationId: string;
  state: string;
  amount: string;
  tenureMonths: number;
  purpose: string;
}

const OFFER_VISIBLE_STATES = new Set(['UNDER_REVIEW', 'APPROVED', 'DISBURSED', 'MANUAL_REVIEW']);

const STATE_MESSAGES: Record<string, string> = {
  SUBMITTED: 'Your application is being processed.',
  UNDER_REVIEW: 'Eligible! An underwriter will review your application shortly.',
  MANUAL_REVIEW: 'An underwriter has requested more information before deciding.',
  REJECTED: 'This application was not approved.',
  APPROVED: 'Approved! Review your offer below to accept or decline.',
  DISBURSED: 'Funds have been disbursed for this loan.',
  CLOSED: 'This application is closed.',
};

// wires the "track application status" applicant flow
export function StatusPage() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const [application, setApplication] = useState<ApplicationView | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!applicationId) return;
    api
      .getApplication(applicationId)
      .then((result) => setApplication(result as ApplicationView))
      .catch((err) => setError(err instanceof ApiError ? JSON.stringify(err.body) : 'Failed to load'));
  }, [applicationId]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <p role="alert">{error}</p>;
  if (!application) return <p>Loading...</p>;

  return (
    <div className="card">
      <h1>Application status</h1>
      <p>
        <code>{application.applicationId}</code>
      </p>
      <p className={`status-badge status-${application.state.toLowerCase()}`}>{application.state}</p>
      <p className="muted">{STATE_MESSAGES[application.state]}</p>
      <p>
        Amount: {application.amount} · Tenure: {application.tenureMonths} months · Purpose:{' '}
        {application.purpose}
      </p>
      <div className="button-row">
        <button onClick={load}>Refresh status</button>
        {OFFER_VISIBLE_STATES.has(application.state) && (
          <Link className="button-link" to={`/applications/${application.applicationId}/offer`}>
            View offer
          </Link>
        )}
      </div>
    </div>
  );
}
