import { useEffect, useState } from 'react';
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

// wires the "track application status" applicant flow
export function StatusPage() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const [application, setApplication] = useState<ApplicationView | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!applicationId) return;
    api
      .getApplication(applicationId)
      .then((result) => setApplication(result as ApplicationView))
      .catch((err) => setError(err instanceof ApiError ? JSON.stringify(err.body) : 'Failed to load'));
  }, [applicationId]);

  if (error) return <p role="alert">{error}</p>;
  if (!application) return <p>Loading...</p>;

  return (
    <main>
      <h1>Application status</h1>
      <p>
        <code>{application.applicationId}</code>
      </p>
      <p>
        Status: <strong>{application.state}</strong>
      </p>
      <p>
        Amount: {application.amount} · Tenure: {application.tenureMonths} months · Purpose:{' '}
        {application.purpose}
      </p>
      {OFFER_VISIBLE_STATES.has(application.state) && (
        <p>
          <Link to={`/applications/${application.applicationId}/offer`}>View offer</Link>
        </p>
      )}
    </main>
  );
}
